#!/usr/bin/env node
/**
 * Test script to verify Supabase database connection and authentication
 * Run with: pnpm tsx test-db-connection.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import { hash, compare } from "bcryptjs";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "./src/lib/db";
import { users } from "./src/lib/db/schema";
import { eq } from "drizzle-orm";

async function testDatabaseConnection() {
  console.log("🔍 Testing Supabase Database Connection...\n");

  // First check environment variables
  console.log("Environment Check:");
  console.log(`  SUPABASE_URL: ${process.env.SUPABASE_URL ? "✅ SET" : "❌ NOT SET"}`);
  console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ SET" : "❌ NOT SET"}\n`);

  try {
    // Test 1: Check if we can query the database
    console.log("Test 1: Querying users table...");
    const allUsers = await db.query.users.findMany({
      limit: 5,
    });
    console.log(`✅ Database connection successful! Found ${allUsers.length} user(s)\n`);

    // Test 2: Check if we can find a specific user
    if (allUsers.length > 0) {
      const firstUser = allUsers[0];
      console.log("Test 2: Finding user by email...");
      const foundUser = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, firstUser.email!),
      });
      
      if (foundUser) {
        console.log(`✅ User found: ${foundUser.email}`);
        console.log(`   - Has password_hash: ${!!foundUser.password_hash}`);
        console.log(`   - Has password (legacy): ${!!foundUser.password}\n`);
      }
    }

    // Test 3: Test password hashing and comparison
    console.log("Test 3: Testing password hashing...");
    const testPassword = "TestPassword123!";
    const hashedPassword = await hash(testPassword, 10);
    const isValid = await compare(testPassword, hashedPassword);
    
    if (isValid) {
      console.log("✅ Password hashing and comparison working correctly\n");
    } else {
      console.log("❌ Password comparison failed\n");
    }

    // Test 4: Try to authenticate a test user
    console.log("Test 4: Testing authentication flow...");
    const testEmail = process.env.TEST_EMAIL || "test@example.com";
    const testUserPassword = process.env.TEST_PASSWORD || "TestPassword123!";
    
    const testUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, testEmail),
    });

    if (testUser) {
      console.log(`Found test user: ${testEmail}`);
      const passwordToCheck = testUser.password_hash || testUser.password;
      
      if (passwordToCheck) {
        const passwordValid = await compare(testUserPassword, passwordToCheck);
        if (passwordValid) {
          console.log("✅ Authentication test passed - password is valid\n");
        } else {
          console.log("❌ Authentication test failed - password is invalid\n");
        }
      } else {
        console.log("⚠️  User has no password set\n");
      }
    } else {
      console.log(`⚠️  Test user not found: ${testEmail}`);
      console.log("   Create a user first or set TEST_EMAIL and TEST_PASSWORD env vars\n");
    }

    console.log("✅ All database tests completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database connection test failed:");
    console.error(error);
    
    if (error instanceof Error) {
      console.error("\nError details:");
      console.error(`Message: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
    }
    
    process.exit(1);
  }
}

// Run the test
testDatabaseConnection();
