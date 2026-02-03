import { compare } from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";

import type { NextAuthConfig } from "next-auth";

import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations";

// Hardcoded admin user for fallback when database is unavailable
const ADMIN_EMAIL = "intellegin@pm.me";

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

          // Check if it's the admin user first (fallback when DB unavailable)
          if (user.email === ADMIN_EMAIL) {
            const adminPassword = process.env.ADMIN_PASSWORD;
            if (adminPassword && user.password === adminPassword) {
              console.log("✅ Hardcoded admin login successful (fallback mode)");
              return {
                id: "admin-user-id",
                email: ADMIN_EMAIL,
                name: "Admin User",
              };
            }
          }

          // Check if database is configured before attempting connection
          const supabaseUrl = process.env.SUPABASE_URL;
          const dbPassword = process.env.SUPABASE_DB_PASSWORD;
          
          // Skip database query if not configured or using placeholder values
          const isDbConfigured = supabaseUrl && dbPassword && 
            supabaseUrl !== "your-supabase-url" && 
            dbPassword !== "your-database-password" &&
            !supabaseUrl.includes("your-") &&
            !dbPassword.includes("your-");

          // Try database lookup only if configured
          let dbUser = null;
          if (isDbConfigured) {
            try {
              dbUser = await db.query.users.findFirst({
                where: (u, { eq }) => eq(u.email, user.email),
              });
            } catch (dbError) {
              console.warn("⚠️  Database connection failed:", dbError instanceof Error ? dbError.message : String(dbError));
              
              // If database fails and it's admin user, use fallback
              if (user.email === ADMIN_EMAIL) {
                const adminPassword = process.env.ADMIN_PASSWORD;
                if (adminPassword && user.password === adminPassword) {
                  console.log("✅ Hardcoded admin login successful (database unavailable)");
                  return {
                    id: "admin-user-id",
                    email: ADMIN_EMAIL,
                    name: "Admin User",
                  };
                }
              }
              
              console.error("❌ Database unavailable and no fallback match");
              return null;
            }
          }

          if (!dbUser) {
            console.error("❌ User not found in database:", user.email);
            if (user.email === ADMIN_EMAIL) {
              console.error("💡 Run 'pnpm db:seed' to create the admin user in database");
            }
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
            
            // Fallback for admin user when database errors occur
            if (credentials?.email === ADMIN_EMAIL) {
              const adminPassword = process.env.ADMIN_PASSWORD;
              if (adminPassword && credentials.password === adminPassword) {
                console.log("✅ Hardcoded admin login successful (error fallback)");
                return {
                  id: "admin-user-id",
                  email: ADMIN_EMAIL,
                  name: "Admin User",
                };
              }
            }
          }
          return null;
        }
      },
    }),
  ],
};
