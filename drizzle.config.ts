import { cwd } from "process";
import { loadEnvConfig } from "@next/env";

import type { Config } from "drizzle-kit";

import { siteConfig } from "@/config/site";

loadEnvConfig(cwd());

// Construct DATABASE_URL from SUPABASE_URL and SUPABASE_DB_PASSWORD
function getDatabaseUrl(): string {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabasePassword = process.env.SUPABASE_DB_PASSWORD;

  if (!supabaseUrl || !supabasePassword) {
    console.error("'SUPABASE_URL' and 'SUPABASE_DB_PASSWORD' must be set in the environment variables");
    process.exit(1);
  }

  // Normalize SUPABASE_URL
  let url = supabaseUrl.trim();
  if (url.startsWith("=")) {
    url = url.substring(1).trim();
  }
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }

  // Extract project reference
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const match = hostname.match(/^([^.]+)\.supabase\.co$/);
    if (!match) {
      console.error(`Invalid SUPABASE_URL format. Expected: https://[project-ref].supabase.co, got: ${url}`);
      process.exit(1);
    }
    const projectRef = match[1];
    const encodedPassword = encodeURIComponent(supabasePassword.trim());
    return `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`;
  } catch (error) {
    console.error(`Invalid SUPABASE_URL: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

const databaseUrl = getDatabaseUrl();

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  verbose: true,
  dbCredentials: { url: databaseUrl },
  tablesFilter: [`${siteConfig.name.toLowerCase().replace(/\s/g, "_")}_*`],
} satisfies Config;
