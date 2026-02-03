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
import { users, roles, userRoles } from "../src/lib/db/schema";
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
    // Ensure admin role exists
    let adminRole = await db.query.roles.findFirst({
      where: (r, { eq }) => eq(r.name, "admin"),
    });

    if (!adminRole) {
      console.log("Creating admin role...");
      const [newRole] = await db
        .insert(roles)
        .values({
          name: "admin",
          description: "Administrator role with full access",
        })
        .returning();
      adminRole = newRole;
      console.log("✅ Admin role created!");
    } else {
      console.log("✅ Admin role already exists");
    }

    // Check if user already exists
    let existingUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, adminEmail),
    });

    if (existingUser) {
      console.log(`⚠️  User ${adminEmail} already exists.`);
      console.log("Updating password...");

      const hashedPassword = await hash(adminPassword, 10);

      await db
        .update(users)
        .set({ 
          password_hash: hashedPassword,
        })
        .where(eq(users.email, adminEmail));

      // Check if user already has admin role
      const existingUserRole = await db.query.userRoles.findFirst({
        where: (ur, { and, eq }) =>
          and(eq(ur.userId, existingUser.id), eq(ur.roleId, adminRole.id)),
      });

      if (!existingUserRole) {
        console.log("Assigning admin role to user...");
        await db.insert(userRoles).values({
          userId: existingUser.id,
          roleId: adminRole.id,
        });
        console.log("✅ Admin role assigned!");
      } else {
        console.log("✅ User already has admin role");
      }

      console.log("✅ Admin user password updated successfully!");
    } else {
      console.log(`Creating admin user: ${adminEmail}`);

      const hashedPassword = await hash(adminPassword, 10);

      const [newUser] = await db
        .insert(users)
        .values({
          email: adminEmail,
          password_hash: hashedPassword,
          name: "Admin User",
        })
        .returning();

      // Assign admin role to new user
      console.log("Assigning admin role to user...");
      await db.insert(userRoles).values({
        userId: newUser.id,
        roleId: adminRole.id,
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
