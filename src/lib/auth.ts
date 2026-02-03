import { redirect } from "next/navigation";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";

import type { Adapter } from "next-auth/adapters";

import { authConfig } from "@/config/auth";
import { env } from "./env";
import { db } from "./db";
import { users } from "./db/schema";

// Only use adapter if Supabase is configured
function getAdapter(): Adapter | undefined {
  // Check if Supabase is configured (optional for local dev)
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return undefined; // No adapter - sessions will be JWT-only
  }
  try {
    return DrizzleAdapter(db) as Adapter;
  } catch (error) {
    // If database connection fails, fall back to JWT-only sessions
    console.warn("Database adapter not available, using JWT-only sessions:", error);
    return undefined;
  }
}

export const {
  handlers,
  auth,
  signIn,
  signOut,
  unstable_update: update,
} = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET || "development-secret-change-in-production",
  trustHost: true, // Required for Vercel deployments

  adapter: getAdapter(),

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
    newUser: "/signup",
  },

  events: {
    linkAccount: async ({ user }) => {
      // Skip database update for fallback admin user
      if (user.id === "admin-user-id" || user.email === "intellegin@pm.me") {
        return;
      }
      
      // Only update database if it's configured
      try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const dbPassword = process.env.SUPABASE_DB_PASSWORD;
        
        if (!supabaseUrl || !dbPassword || 
            supabaseUrl === "your-supabase-url" || 
            dbPassword === "your-database-password" ||
            supabaseUrl.includes("your-") ||
            dbPassword.includes("your-")) {
          return; // Database not configured
        }
        
        await db
          .update(users)
          .set({ emailVerified: new Date() })
          .where(eq(users.id, user.id!));
      } catch (error) {
        // Silently fail if database is unavailable
        if (error instanceof Error && !error.message.includes("ENOTFOUND") && !error.message.includes("getaddrinfo")) {
          console.warn("Could not update user email verification:", error.message);
        }
      }
    },
  },

  callbacks: {
    jwt: async ({ token, user }) => {
      // Handle fallback admin user (when database unavailable)
      if (token.sub === "admin-user-id" || user?.id === "admin-user-id") {
        token = {
          ...token,
          id: "admin-user-id",
          email: user?.email || token.email || "intellegin@pm.me",
          name: user?.name || "Admin User",
        };
        return token;
      }

      // Skip database query if it's the fallback admin user (by email check)
      if (token.email === "intellegin@pm.me") {
        return token;
      }

      // Check if database is configured before attempting connection
      const supabaseUrl = process.env.SUPABASE_URL;
      const dbPassword = process.env.SUPABASE_DB_PASSWORD;
      
      // Skip database query if not configured or using placeholder values
      if (!supabaseUrl || !dbPassword || 
          supabaseUrl === "your-supabase-url" || 
          dbPassword === "your-database-password" ||
          supabaseUrl.includes("your-") ||
          dbPassword.includes("your-")) {
        // Database not configured, use token data as-is
        return token;
      }

      // Try to get user from database
      try {

        const dbUser = await db.query.users.findFirst({
          where: (u, { eq }) => eq(u.id, token.sub!),
        });

        if (dbUser) {
          const { id, name, email, username, image: picture } = dbUser;

          token = {
            ...token,
            id,
            name,
            email,
            username,
            picture,
          };
        }
      } catch (error) {
        // Silently fail - use existing token data as fallback
        // Only log if it's not a connection error (which is expected when DB is unavailable)
        if (error instanceof Error && !error.message.includes("ENOTFOUND") && !error.message.includes("getaddrinfo")) {
          console.warn("⚠️  Could not fetch user from database for JWT callback:", error.message);
        }
      }

      return token;
    },

    session: async ({ session, token }) => {
      if (token.sub && session.user) {
        const { id, name, email, username, picture: image } = token;

        session.user = {
          ...session.user,
          id: id || token.sub,
          name: name || session.user.name,
          email: email || session.user.email,
          username: username || undefined,
          image: image || session.user.image,
        };
      }

      return session;
    },
  },
});

/**
 * Gets the current user from the server session
 *
 * @returns The current user
 */
export async function getUser() {
  const session = await auth();
  return session?.user;
}

/**
 * Checks if the current user is authenticated
 * If not, redirects to the login page
 */
export const checkAuth = async () => {
  const session = await auth();
  if (!session) redirect("/login");
};
