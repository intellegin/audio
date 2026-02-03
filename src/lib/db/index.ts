import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/lib/env";
import * as schema from "./schema";

// Lazy initialization - only connect when database is actually accessed
let dbInstance: ReturnType<typeof drizzle> | null = null;
let postgresClient: ReturnType<typeof postgres> | null = null;

function getDatabaseUrl(): string {
  // Validate SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (required at runtime when database is accessed)
  if (!env.SUPABASE_URL || typeof env.SUPABASE_URL !== "string" || env.SUPABASE_URL.trim() === "") {
    throw new Error(
      "SUPABASE_URL is required but not set. Please set SUPABASE_URL in your environment variables.\n" +
      "Format: https://[project-ref].supabase.co\n" +
      "You can find this in: Supabase Dashboard → Project Settings → API → Project URL"
    );
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY || typeof env.SUPABASE_SERVICE_ROLE_KEY !== "string" || env.SUPABASE_SERVICE_ROLE_KEY.trim() === "") {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required but not set. Please set SUPABASE_SERVICE_ROLE_KEY in your environment variables.\n" +
      "You can find this in: Supabase Dashboard → Settings → API → Service Role Key (secret)"
    );
  }

  // Normalize SUPABASE_URL - remove leading = if present (common env var mistake)
  let supabaseUrl = env.SUPABASE_URL.trim();
  if (supabaseUrl.startsWith("=")) {
    supabaseUrl = supabaseUrl.substring(1).trim();
  }

  // Remove trailing slash if present
  if (supabaseUrl.endsWith("/")) {
    supabaseUrl = supabaseUrl.slice(0, -1);
  }

  // Extract project reference from SUPABASE_URL
  // Format: https://[project-ref].supabase.co
  let projectRef: string;
  try {
    const url = new URL(supabaseUrl);
    const hostname = url.hostname;
    
    // Extract project ref from hostname (e.g., "rhvyeqwkvppghidcrxak" from "rhvyeqwkvppghidcrxak.supabase.co")
    const match = hostname.match(/^([^.]+)\.supabase\.co$/);
    if (!match) {
      throw new Error(`Invalid Supabase URL format. Expected: https://[project-ref].supabase.co, got: ${supabaseUrl}`);
    }
    projectRef = match[1];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Invalid SUPABASE_URL: ${error.message}\nGot: ${supabaseUrl}`);
    }
    throw new Error(`Invalid SUPABASE_URL format: ${supabaseUrl}`);
  }

  // Note: The service role key is a JWT token used for Supabase API authentication.
  // For direct PostgreSQL connections (which Drizzle ORM uses), we typically need the database password.
  // However, Supabase's connection pooling might accept the service role key in some configurations.
  // We'll try using it with the direct connection URL format.
  // If this doesn't work, you may need to use the database password instead.
  
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY.trim();
  const encodedKey = encodeURIComponent(serviceRoleKey);
  
  // Use direct connection URL format
  // Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
  return `postgresql://postgres:${encodedKey}@db.${projectRef}.supabase.co:5432/postgres`;
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
