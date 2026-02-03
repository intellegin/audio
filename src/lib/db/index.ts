import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/lib/env";
import * as schema from "./schema";

// Validate DATABASE_URL before creating connection
if (!env.DATABASE_URL || typeof env.DATABASE_URL !== "string" || env.DATABASE_URL.trim() === "") {
  throw new Error(
    "DATABASE_URL is required but not set. Please set DATABASE_URL in your environment variables."
  );
}

// Validate URL format
try {
  new URL(env.DATABASE_URL);
} catch (error) {
  throw new Error(
    `DATABASE_URL is invalid: "${env.DATABASE_URL}". Expected format: postgresql://user:password@host:port/database`
  );
}

const client = postgres(env.DATABASE_URL, { max: 1 });

export const db = drizzle(client, { schema });
