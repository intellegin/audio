import { compare } from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";

import type { NextAuthConfig } from "next-auth";

import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations";

export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        try {
          console.log("🔐 Auth attempt for:", credentials?.email);
          
          const validatedFields = loginSchema.safeParse(credentials);

          if (!validatedFields.success) {
            console.error("❌ Validation error:", JSON.stringify(validatedFields.error, null, 2));
            return null;
          }

          const user = validatedFields.data;
          console.log("✅ Validation passed, looking up user:", user.email);

          // Find user by email only
          const dbUser = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.email, user.email),
          });

          if (!dbUser) {
            console.error("❌ User not found in database:", user.email);
            console.error("💡 Run 'pnpm db:seed' to create the admin user");
            return null;
          }

          console.log("✅ User found:", {
            id: dbUser.id,
            email: dbUser.email,
            hasPasswordHash: !!dbUser.password_hash,
            hasPassword: !!dbUser.password,
          });

          // Check password_hash first (Supabase), fallback to password (legacy)
          const passwordToCheck = dbUser.password_hash || dbUser.password;
          
          if (!passwordToCheck) {
            console.error("❌ User has no password set:", user.email);
            console.error("💡 Run 'pnpm db:seed' to set the password");
            return null;
          }

          console.log("🔑 Comparing password...");
          const isValid = await compare(user.password, passwordToCheck);

          if (!isValid) {
            console.error("❌ Password comparison failed for:", user.email);
            console.error("💡 Make sure ADMIN_PASSWORD in .env.local matches what you're typing");
            return null;
          }

          console.log("✅ Password valid! Returning user object");
          // Return user object for NextAuth
          return {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name || dbUser.email,
            username: dbUser.username,
            image: dbUser.image,
          };
        } catch (error) {
          console.error("❌ Authorization error:", error);
          if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
          }
          return null;
        }
      },
    }),
  ],
};
