import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/lib/env";
import * as schema from "./schema";

// Validate and normalize DATABASE_URL before creating connection
if (!env.DATABASE_URL || typeof env.DATABASE_URL !== "string" || env.DATABASE_URL.trim() === "") {
  throw new Error(
    "DATABASE_URL is required but not set. Please set DATABASE_URL in your environment variables.\n" +
    "Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
  );
}

// Normalize DATABASE_URL - remove leading = if present (common env var mistake)
let databaseUrl = env.DATABASE_URL.trim();
if (databaseUrl.startsWith("=")) {
  databaseUrl = databaseUrl.substring(1).trim();
}

// Auto-fix common Supabase URL issues
// If it starts with https://, it's likely a Supabase project URL, not connection string
if (databaseUrl.startsWith("https://")) {
  throw new Error(
    `DATABASE_URL appears to be a Supabase project URL, not a database connection string.\n` +
    `You need the PostgreSQL connection string from:\n` +
    `Supabase Dashboard → Settings → Database → Connection string (URI tab)\n` +
    `Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres\n` +
    `Current value: "${databaseUrl.substring(0, 60)}..."`
  );
}

// Validate URL format
if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
  throw new Error(
    `DATABASE_URL must start with postgresql:// or postgres://\n` +
    `Current value: "${databaseUrl.substring(0, 60)}..."\n` +
    `Make sure you're using the PostgreSQL connection string from Supabase Dashboard → Settings → Database`
  );
}

// Use normalized URL
const normalizedDatabaseUrl = databaseUrl;

const client = postgres(normalizedDatabaseUrl, { max: 1 });

export const db = drizzle(client, { schema });
