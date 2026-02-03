import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/lib/env";
import * as schema from "./schema";

// Validate SUPABASE_URL and SUPABASE_DB_PASSWORD
if (!env.SUPABASE_URL || typeof env.SUPABASE_URL !== "string" || env.SUPABASE_URL.trim() === "") {
  throw new Error(
    "SUPABASE_URL is required but not set. Please set SUPABASE_URL in your environment variables.\n" +
    "Format: https://[project-ref].supabase.co"
  );
}

if (!env.SUPABASE_DB_PASSWORD || typeof env.SUPABASE_DB_PASSWORD !== "string" || env.SUPABASE_DB_PASSWORD.trim() === "") {
  throw new Error(
    "SUPABASE_DB_PASSWORD is required but not set. Please set SUPABASE_DB_PASSWORD in your environment variables.\n" +
    "You can find this in: Supabase Dashboard → Settings → Database → Database password"
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

// Construct DATABASE_URL from SUPABASE_URL and password
// Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
const databasePassword = encodeURIComponent(env.SUPABASE_DB_PASSWORD.trim());
const databaseUrl = `postgresql://postgres:${databasePassword}@db.${projectRef}.supabase.co:5432/postgres`;

const client = postgres(databaseUrl, { max: 1 });

export const db = drizzle(client, { schema });
