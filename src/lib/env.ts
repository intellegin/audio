import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",

  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    /* -----------------------------------------------------------------------------------------------
     * Node.js Environment
     * -----------------------------------------------------------------------------------------------*/

    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    /* -----------------------------------------------------------------------------------------------
     * NextAuth.js
     * -----------------------------------------------------------------------------------------------*/

    AUTH_SECRET: z.string().optional(),
    AUTH_URL: z.string().optional(),

    /* -----------------------------------------------------------------------------------------------
     * Google OAuth
     * -----------------------------------------------------------------------------------------------*/

    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    /* -----------------------------------------------------------------------------------------------
     * Github OAuth
     * -----------------------------------------------------------------------------------------------*/

    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),

    /* -----------------------------------------------------------------------------------------------
     * JioSaavn API URL (https://github.com/rajput-hemant/jiosaavn-api-ts)
     * Optional if using Plex or custom API
     * -----------------------------------------------------------------------------------------------*/

    JIOSAAVN_API_URL: z
      .string()
      .url()
      .optional(),

    /* -----------------------------------------------------------------------------------------------
     * Plex Media Server Configuration
     * -----------------------------------------------------------------------------------------------*/

    PLEX_URL: z
      .string()
      .url()
      .optional(),
    PLEX_TOKEN: z
      .string()
      .optional(),

    /* -----------------------------------------------------------------------------------------------
     * API Provider Selection
     * -----------------------------------------------------------------------------------------------*/

    API_PROVIDER: z
      .enum(["jiosaavn", "plex", "custom"])
      .default("jiosaavn"),

    /* -----------------------------------------------------------------------------------------------
     * Supabase Configuration
     * -----------------------------------------------------------------------------------------------*/

    SUPABASE_URL: z
      .string()
      .url()
      .optional()
      .describe("Supabase project URL (e.g., https://[project-ref].supabase.co)"),

    SUPABASE_SERVICE_ROLE_KEY: z
      .string()
      .optional()
      .describe("Supabase service role key (for API authentication, not database connection)"),

    SUPABASE_DB_PASSWORD: z
      .string()
      .optional()
      .describe("Supabase database password (required for direct PostgreSQL connections)"),

    /* -----------------------------------------------------------------------------------------------
     * Upstash Rate Limiting (Redis)
     * -----------------------------------------------------------------------------------------------*/

    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    ENABLE_RATE_LIMITING: z.enum(["true", "false"]).default("false"),
    RATE_LIMITING_REQUESTS_PER_SECOND: z.coerce.number().default(50),

    /* -----------------------------------------------------------------------------------------------
     * Umami Analytics
     * -----------------------------------------------------------------------------------------------*/
    UMAMI_WEBSITE_ID: z.string().optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   * For Next.js >= 13.4.4, you only need to destructure client variables (Only valid for `experimental__runtimeEnv`)
   */
  experimental__runtimeEnv: {
    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
  },

  /**
   * Makes it so that empty strings are treated as undefined.
   * `SOME_VAR: z.string()` and `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
