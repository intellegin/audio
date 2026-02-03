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
  const supabaseUrl = env.SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dbPassword = env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_DB_PASSWORD;
  
  // Don't use adapter if not configured or using placeholder values
  if (!supabaseUrl || !serviceRoleKey || 
      supabaseUrl === "your-supabase-url" || 
      dbPassword === "your-database-password" ||
      supabaseUrl.includes("your-") ||
      (dbPassword && dbPassword.includes("your-"))) {
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
          role: "admin",
        };
        return token;
      }

      // Skip database query if it's the fallback admin user (by email check)
      if (token.email === "intellegin@pm.me") {
        token.role = "admin";
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
          const { id, name, email, username, image: picture, role } = dbUser;

          token = {
            ...token,
            id,
            name,
            email,
            username,
            picture,
            role: role || "user", // Default to "user" if role not set
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
        const { id, name, email, username, picture: image, role } = token;

        session.user = {
          ...session.user,
          id: id || token.sub,
          name: name || session.user.name,
          email: email || session.user.email,
          username: username || undefined,
          image: image || session.user.image,
          role: (role as "admin" | "user" | "guest") || "user", // Default to "user" if role not set
        };
      } else {
        // Guest user (no session)
        session.user.role = "guest";
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
 * Gets the current user's role
 *
 * @returns The user's role ("admin", "user", or "guest")
 */
export async function getUserRole(): Promise<"admin" | "user" | "guest"> {
  const session = await auth();
  return (session?.user?.role as "admin" | "user" | "guest") || "guest";
}

/**
 * Checks if the current user is an admin
 *
 * @returns True if the user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === "admin";
}

/**
 * Checks if the current user is authenticated (not a guest)
 *
 * @returns True if the user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const role = await getUserRole();
  return role === "admin" || role === "user";
}

/**
 * Checks if the current user is a guest (not authenticated)
 *
 * @returns True if the user is a guest
 */
export async function isGuest(): Promise<boolean> {
  const role = await getUserRole();
  return role === "guest";
}

/**
 * Checks if the current user is authenticated
 * If not, redirects to the login page
 */
export const checkAuth = async () => {
  const session = await auth();
  if (!session) redirect("/login");
};

/**
 * Checks if the current user is an admin
 * If not, redirects to the home page
 */
export const checkAdmin = async () => {
  const role = await getUserRole();
  if (role !== "admin") redirect("/");
};
