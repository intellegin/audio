import { compare } from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";

import type { NextAuthConfig } from "next-auth";

import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations";

export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const validatedFields = loginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const user = validatedFields.data;

          // Find user by email only
          const dbUser = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.email, user.email),
          });

          // Check password_hash first (Supabase), fallback to password (legacy)
          const passwordToCheck = dbUser?.password_hash || dbUser?.password;
          
          if (dbUser && passwordToCheck) {
            const isValid = await compare(user.password, passwordToCheck);

            if (isValid) {
              return dbUser;
            }
          }
        }

        return null;
      },
    }),
  ],
};
