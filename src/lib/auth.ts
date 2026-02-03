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
      await db
        .update(users)
        .set({ emailVerified: new Date() })
        .where(eq(users.id, user.id!));
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
        console.warn("⚠️  Could not fetch user from database for JWT callback:", error);
        // Use existing token data as fallback
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
