import { cwd } from "process";
import { loadEnvConfig } from "@next/env";

import type { Config } from "drizzle-kit";

import { siteConfig } from "@/config/site";

loadEnvConfig(cwd());

// Construct DATABASE_URL from SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
function getDatabaseUrl(): string {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("'SUPABASE_URL' and 'SUPABASE_SERVICE_ROLE_KEY' must be set in the environment variables");
    console.error("\nTo set them up:");
    console.error("1. Create a .env.local file in the project root");
    console.error("2. Add: SUPABASE_URL=https://[project-ref].supabase.co");
    console.error("3. Add: SUPABASE_SERVICE_ROLE_KEY=your-service-role-key");
    console.error("\nYou can find these values in:");
    console.error("- Supabase Dashboard → Project Settings → API → Project URL");
    console.error("- Supabase Dashboard → Settings → API → Service Role Key (secret)");
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
    const encodedKey = encodeURIComponent(serviceRoleKey.trim());
    return `postgresql://postgres:${encodedKey}@db.${projectRef}.supabase.co:5432/postgres`;
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
