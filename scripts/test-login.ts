#!/usr/bin/env node
/**
 * Test login flow directly
 * Run with: pnpm tsx scripts/test-login.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import { compare, hash } from "bcryptjs";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "../src/lib/db";
import { eq } from "drizzle-orm";
import { users } from "../src/lib/db/schema";

async function testLogin() {
  const adminEmail = "intellegin@pm.me";
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error("❌ ADMIN_PASSWORD not set in .env.local");
    process.exit(1);
  }

  console.log("🧪 Testing login flow...\n");
  console.log(`Email: ${adminEmail}`);
  console.log(`Password from env: ${adminPassword ? "SET" : "NOT SET"}\n`);

  try {
    // Step 1: Check if user exists
    console.log("Step 1: Checking if user exists...");
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, adminEmail),
    });

    if (!user) {
      console.error("❌ User not found!");
      console.log("\n💡 Creating user now...");
      
      const hashedPassword = await hash(adminPassword, 10);
      await db.insert(users).values({
        email: adminEmail,
        password_hash: hashedPassword,
        name: "Admin User",
      });
      
      console.log("✅ User created!");
      
      // Try again
      const newUser = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, adminEmail),
      });
      
      if (!newUser) {
        console.error("❌ Failed to create user");
        process.exit(1);
      }
      
      console.log("\n✅ User exists now, testing password...");
      const passwordToCheck = newUser.password_hash || newUser.password;
      
      if (!passwordToCheck) {
        console.error("❌ User has no password");
        process.exit(1);
      }
      
      const isValid = await compare(adminPassword, passwordToCheck);
      
      if (isValid) {
        console.log("✅ Password comparison: SUCCESS");
        console.log("\n✅ Login should work now!");
      } else {
        console.error("❌ Password comparison: FAILED");
        console.error("This shouldn't happen - password was just set!");
      }
      
      process.exit(0);
    }

    console.log("✅ User found!");
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Has password_hash: ${!!user.password_hash}`);
    console.log(`   Has password: ${!!user.password}`);

    // Step 2: Check password
    console.log("\nStep 2: Testing password...");
    const passwordToCheck = user.password_hash || user.password;
    
    if (!passwordToCheck) {
      console.error("❌ User has no password!");
      console.log("\n💡 Setting password now...");
      
      const hashedPassword = await hash(adminPassword, 10);
      await db
        .update(users)
        .set({ password_hash: hashedPassword })
        .where(eq(users.email, adminEmail));
      
      console.log("✅ Password set!");
      console.log("\n✅ Try logging in again!");
      process.exit(0);
    }

    console.log("   Password hash exists, comparing...");
    const isValid = await compare(adminPassword, passwordToCheck);

    if (isValid) {
      console.log("✅ Password comparison: SUCCESS");
      console.log("\n✅ Everything looks good! Login should work.");
      console.log("\nIf login still fails, check:");
      console.log("1. Server console logs when you try to login");
      console.log("2. Make sure you're typing the exact password from ADMIN_PASSWORD");
      console.log("3. Check browser console for any errors");
    } else {
      console.error("❌ Password comparison: FAILED");
      console.error("\nThe password doesn't match!");
      console.error("\nPossible issues:");
      console.error("1. ADMIN_PASSWORD in .env.local doesn't match what was used to seed");
      console.error("2. Password was changed manually in database");
      console.error("\n💡 Fix: Run 'pnpm db:seed' to update the password");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
      if (error.message.includes("SUPABASE_DB_PASSWORD")) {
        console.error("\n⚠️  Database connection issue!");
        console.error("You need SUPABASE_DB_PASSWORD set in .env.local");
      }
    }
    process.exit(1);
  }
}

testLogin();
