#!/usr/bin/env node
/**
 * Check if admin user exists and verify password
 * Run with: pnpm tsx scripts/check-admin-user.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import { compare } from "bcryptjs";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "../src/lib/db";
import { eq } from "drizzle-orm";
import { users } from "../src/lib/db/schema";

async function checkAdminUser() {
  const adminEmail = "intellegin@pm.me";
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error("❌ ADMIN_PASSWORD environment variable is not set!");
    console.error("\nPlease add to your .env.local:");
    console.error("ADMIN_PASSWORD=your-secure-password-here");
    process.exit(1);
  }

  console.log("🔍 Checking admin user...\n");

  try {
    // Check if user exists
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, adminEmail),
    });

    if (!user) {
      console.error(`❌ User ${adminEmail} not found in database!`);
      console.error("\nRun the seed script first:");
      console.error("pnpm db:seed");
      process.exit(1);
    }

    console.log("✅ User found!");
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Has password_hash: ${!!user.password_hash}`);
    console.log(`   Has password (legacy): ${!!user.password}`);

    // Test password
    const passwordToCheck = user.password_hash || user.password;
    
    if (!passwordToCheck) {
      console.error("\n❌ User has no password set!");
      console.error("Run the seed script to set the password:");
      console.error("pnpm db:seed");
      process.exit(1);
    }

    const isValid = await compare(adminPassword, passwordToCheck);

    if (isValid) {
      console.log("\n✅ Password verification: SUCCESS");
      console.log("   The password matches! Login should work.");
    } else {
      console.error("\n❌ Password verification: FAILED");
      console.error("   The password doesn't match!");
      console.error("\nPossible issues:");
      console.error("1. ADMIN_PASSWORD in .env.local doesn't match what was used to seed");
      console.error("2. Password was changed after seeding");
      console.error("\nSolution: Run the seed script again:");
      console.error("pnpm db:seed");
      process.exit(1);
    }

    console.log("\n✅ Everything looks good! You should be able to login.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error checking admin user:");
    console.error(error);
    
    if (error instanceof Error) {
      if (error.message.includes("SUPABASE_DB_PASSWORD")) {
        console.error("\n⚠️  Database connection issue:");
        console.error("You need SUPABASE_DB_PASSWORD set in .env.local");
        console.error("Even if you're not using Supabase, the database connection is needed for auth.");
      }
    }
    
    process.exit(1);
  }
}

checkAdminUser();
