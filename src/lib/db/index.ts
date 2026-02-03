import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/lib/env";
import * as schema from "./schema";

// Validate DATABASE_URL before creating connection
if (!env.DATABASE_URL || typeof env.DATABASE_URL !== "string" || env.DATABASE_URL.trim() === "") {
  throw new Error(
    "DATABASE_URL is required but not set. Please set DATABASE_URL in your environment variables.\n" +
    "Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
  );
}

// Validate URL format (postgres URLs don't always parse with URL constructor)
if (!env.DATABASE_URL.startsWith("postgresql://") && !env.DATABASE_URL.startsWith("postgres://")) {
  throw new Error(
    `DATABASE_URL must start with postgresql:// or postgres://\n` +
    `Current value: "${env.DATABASE_URL.substring(0, 50)}..."`
  );
}

const client = postgres(env.DATABASE_URL, { max: 1 });

export const db = drizzle(client, { schema });
