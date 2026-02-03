import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/lib/env";
import * as schema from "./schema";

// Lazy initialization - only connect when database is actually accessed
let dbInstance: ReturnType<typeof drizzle> | null = null;
let postgresClient: ReturnType<typeof postgres> | null = null;

function getDatabaseUrl(): string {
  // Check both env object and process.env (env object may filter out optional vars)
  const supabaseUrl = env.SUPABASE_URL || process.env.SUPABASE_URL;
  const dbPassword = env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_DB_PASSWORD;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Validate SUPABASE_URL (required)
  if (!supabaseUrl || typeof supabaseUrl !== "string" || supabaseUrl.trim() === "") {
    throw new Error(
      "SUPABASE_URL is required but not set. Please set SUPABASE_URL in your environment variables.\n" +
      "Format: https://[project-ref].supabase.co\n" +
      "You can find this in: Supabase Dashboard → Project Settings → API → Project URL"
    );
  }

  // Prefer database password over service role key
  if (!dbPassword || typeof dbPassword !== "string" || dbPassword.trim() === "") {
    if (!serviceRoleKey || typeof serviceRoleKey !== "string" || serviceRoleKey.trim() === "") {
      throw new Error(
        "SUPABASE_DB_PASSWORD is required for database connections.\n" +
        "Please set SUPABASE_DB_PASSWORD in your environment variables.\n" +
        "You can find this in: Supabase Dashboard → Settings → Database → Database password\n\n" +
        "Note: SUPABASE_SERVICE_ROLE_KEY is for API authentication, not database connections."
      );
    }
  }

  // Normalize SUPABASE_URL - remove leading = if present (common env var mistake)
  let normalizedUrl = supabaseUrl.trim();
  if (normalizedUrl.startsWith("=")) {
    normalizedUrl = normalizedUrl.substring(1).trim();
  }

  // Remove trailing slash if present
  if (normalizedUrl.endsWith("/")) {
    normalizedUrl = normalizedUrl.slice(0, -1);
  }

  // Extract project reference from SUPABASE_URL
  // Format: https://[project-ref].supabase.co
  let projectRef: string;
  try {
    const url = new URL(normalizedUrl);
    const hostname = url.hostname;
    
    // Extract project ref from hostname (e.g., "rhvyeqwkvppghidcrxak" from "rhvyeqwkvppghidcrxak.supabase.co")
    const match = hostname.match(/^([^.]+)\.supabase\.co$/);
    if (!match) {
      throw new Error(`Invalid Supabase URL format. Expected: https://[project-ref].supabase.co, got: ${normalizedUrl}`);
    }
    projectRef = match[1];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Invalid SUPABASE_URL: ${error.message}\nGot: ${normalizedUrl}`);
    }
    throw new Error(`Invalid SUPABASE_URL format: ${normalizedUrl}`);
  }

  // IMPORTANT: For direct PostgreSQL connections (which Drizzle ORM uses), we need the actual DATABASE PASSWORD,
  // NOT the service role key. The service role key is a JWT token for API authentication.
  //
  // Use the database password for direct connection
  // Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
  
  const passwordToUse = dbPassword || serviceRoleKey; // Fallback to service role key if password not set (will fail)
  const encodedPassword = encodeURIComponent(passwordToUse.trim());
  
  return `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`;
}

function getDb() {
  if (!dbInstance) {
    const databaseUrl = getDatabaseUrl();
    postgresClient = postgres(databaseUrl, { max: 1 });
    dbInstance = drizzle(postgresClient, { schema });
  }
  return dbInstance;
}

// Export db as a proxy that lazily initializes the connection
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const db = getDb();
    const value = db[prop as keyof ReturnType<typeof drizzle>];
    // If it's a function, bind it to maintain 'this' context
    if (typeof value === "function") {
      return value.bind(db);
    }
    return value;
  },
});
