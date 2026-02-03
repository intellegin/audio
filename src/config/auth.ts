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
          const validatedFields = loginSchema.safeParse(credentials);

          if (!validatedFields.success) {
            console.error("Validation error:", validatedFields.error);
            return null;
          }

          const user = validatedFields.data;

          // Find user by email only
          const dbUser = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.email, user.email),
          });

          if (!dbUser) {
            console.error("User not found:", user.email);
            return null;
          }

          // Check password_hash first (Supabase), fallback to password (legacy)
          const passwordToCheck = dbUser.password_hash || dbUser.password;
          
          if (!passwordToCheck) {
            console.error("User has no password set:", user.email);
            return null;
          }

          const isValid = await compare(user.password, passwordToCheck);

          if (!isValid) {
            console.error("Invalid password for user:", user.email);
            return null;
          }

          // Return user object for NextAuth
          return {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name || dbUser.email,
            username: dbUser.username,
            image: dbUser.image,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],
};
