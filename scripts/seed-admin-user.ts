#!/usr/bin/env node
/**
 * Seed script to create an admin user
 * Run with: pnpm tsx scripts/seed-admin-user.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import { hash } from "bcryptjs";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "../src/lib/db";
import { users } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

async function seedAdminUser() {
  const adminEmail = "intellegin@pm.me";
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error("❌ ADMIN_PASSWORD environment variable is not set!");
    console.error("\nPlease add to your .env.local:");
    console.error("ADMIN_PASSWORD=your-secure-password-here");
    process.exit(1);
  }

  console.log("🌱 Seeding admin user...\n");

  try {
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, adminEmail),
    });

    if (existingUser) {
      console.log(`⚠️  User ${adminEmail} already exists.`);
      console.log("Updating password and role...");

      const hashedPassword = await hash(adminPassword, 10);

      await db
        .update(users)
        .set({ 
          password_hash: hashedPassword,
          role: "admin",
        })
        .where(eq(users.email, adminEmail));

      console.log("✅ Admin user password and role updated successfully!");
    } else {
      console.log(`Creating admin user: ${adminEmail}`);

      const hashedPassword = await hash(adminPassword, 10);

      await db.insert(users).values({
        email: adminEmail,
        password_hash: hashedPassword,
        name: "Admin User",
        role: "admin",
      });

      console.log("✅ Admin user created successfully!");
    }

    console.log("\n📧 Email:", adminEmail);
    console.log("🔑 Password: (set via ADMIN_PASSWORD env variable)");
    console.log("\n✅ Done! You can now login with this account.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to seed admin user:");
    console.error(error);
    process.exit(1);
  }
}

seedAdminUser();
