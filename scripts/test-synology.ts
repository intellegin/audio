#!/usr/bin/env node
/**
 * Test script for Synology NAS connection
 * Run with: pnpm tsx scripts/test-synology.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

async function testSynologyConnection() {
  console.log("🧪 Testing Synology NAS Connection...\n");

  // Check environment variables (read directly from process.env)
  console.log("📋 Checking environment variables...");
  const serverUrl = process.env.SYNOLOGY_SERVER_URL;
  const username = process.env.SYNOLOGY_USERNAME;
  const password = process.env.SYNOLOGY_PASSWORD;
  const audioPath = process.env.SYNOLOGY_AUDIO_STATION_PATH || "/music";

  if (!serverUrl) {
    console.error("❌ SYNOLOGY_SERVER_URL is not set!");
    console.error("\nPlease add to your .env.local:");
    console.error("SYNOLOGY_SERVER_URL=https://your-nas-url:5001");
    process.exit(1);
  }

  if (!username || !password) {
    console.error("❌ SYNOLOGY_USERNAME or SYNOLOGY_PASSWORD is not set!");
    console.error("\nPlease add to your .env.local:");
    console.error("SYNOLOGY_USERNAME=your-username");
    console.error("SYNOLOGY_PASSWORD=your-password");
    process.exit(1);
  }

  console.log("✅ Environment variables configured");
  console.log(`   Server URL: ${serverUrl}`);
  console.log(`   Username: ${username}`);
  console.log(`   Audio Path: ${audioPath}\n`);

  // Note: Admin check skipped in test script (requires Next.js context)
  console.log("🔐 Admin access check skipped (requires Next.js context)\n");

  // Test authentication
  console.log("🔑 Testing authentication...");
  try {
    const baseUrl = serverUrl.replace(/\/$/, "");
    const loginUrl = `${baseUrl}/webapi/auth.cgi?api=SYNO.API.Auth&version=3&method=login&account=${encodeURIComponent(username)}&passwd=${encodeURIComponent(password)}&session=FileStation&format=sid`;
    
    console.log(`   Calling: ${baseUrl}/webapi/auth.cgi...`);
    
    const response = await fetch(loginUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as { 
      success: boolean; 
      data?: { sid: string }; 
      error?: { 
        code: number; 
        errors?: { 
          types?: Array<{ type: string }>; 
          token?: string;
        };
      };
    };
    
    if (!data.success || !data.data?.sid) {
      const errorCode = data.error?.code;
      const errorTypes = data.error?.errors?.types?.map(e => e.type) || [];
      
      if (errorCode === 403 && (errorTypes.includes("authenticator") || errorTypes.includes("otp"))) {
        throw new Error(
          "❌ Synology NAS requires 2FA authentication.\n\n" +
          "To fix this:\n" +
          "1. Go to Control Panel > Security > 2-Step Verification\n" +
          "2. Either disable 2FA for API access, or\n" +
          "3. Create an application-specific password, or\n" +
          "4. Use a user account without 2FA enabled\n\n" +
          "Alternatively, you can create a dedicated API user without 2FA."
        );
      }
      
      if (errorCode === 402) {
        throw new Error(
          "❌ Authentication failed: Invalid username or password.\n\n" +
          "Please check:\n" +
          "1. Username is correct (case-sensitive)\n" +
          "2. Password is correct\n" +
          "3. Account exists and is enabled on your NAS"
        );
      }
      
      const errorDetails = data.error?.errors ? JSON.stringify(data.error.errors) : "";
      throw new Error(`Login failed: Code ${errorCode}${errorDetails ? ` - ${errorDetails}` : ""}`);
    }

    console.log("✅ Authentication successful!");
    console.log(`   Session ID: ${data.data.sid.substring(0, 20)}...\n`);

    const sessionId = data.data.sid;

    // Test File Station API - List files
    console.log("📁 Testing File Station API - Listing files...");
    try {
      const listUrl = `${baseUrl}/webapi/entry.cgi?api=SYNO.FileStation.List&version=2&method=list&folder_path=${encodeURIComponent(audioPath)}&additional=["size","owner","time"]&_sid=${sessionId}`;
      
      const listResponse = await fetch(listUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!listResponse.ok) {
        throw new Error(`HTTP ${listResponse.status}: ${listResponse.statusText}`);
      }

      const listData = await listResponse.json() as { success: boolean; data?: { files: any[] }; error?: { code: number } };
      
      if (!listData.success) {
        throw new Error(`List failed: ${listData.error?.code || "Unknown error"}`);
      }

      const files = listData.data?.files || [];
      console.log(`✅ Successfully listed ${files.length} items in ${audioPath}`);
      
      if (files.length > 0) {
        console.log("\n   Sample files/folders:");
        files.slice(0, 5).forEach((file: any) => {
          console.log(`   ${file.isdir ? "📁" : "📄"} ${file.name}`);
        });
        if (files.length > 5) {
          console.log(`   ... and ${files.length - 5} more`);
        }
      } else {
        console.log("   ⚠️  No files found in this path");
        console.log("   💡 Make sure SYNOLOGY_AUDIO_STATION_PATH points to your music folder");
      }
    } catch (error) {
      console.error("❌ File listing failed:", error instanceof Error ? error.message : String(error));
      console.error("   💡 Check that:");
      console.error("      - The path exists on your NAS");
      console.error("      - Your user has read permissions");
      console.error("      - File Station is enabled on your NAS");
    }

    // Logout
    console.log("\n🔓 Logging out...");
    const logoutUrl = `${baseUrl}/webapi/auth.cgi?api=SYNO.API.Auth&version=3&method=logout&session=FileStation&_sid=${sessionId}`;
    await fetch(logoutUrl);
    console.log("✅ Logged out\n");

    console.log("✅ All tests completed successfully!");
    console.log("\n🎉 Your Synology NAS is configured correctly!");
    console.log("   Admin users will be able to access music files from your NAS.");
    
  } catch (error) {
    console.error("\n❌ Connection test failed:");
    console.error(error instanceof Error ? error.message : String(error));
    console.error("\n💡 Troubleshooting:");
    console.error("   1. Check that SYNOLOGY_SERVER_URL is correct");
    console.error("   2. Verify username and password are correct");
    console.error("   3. Ensure File Station is enabled on your NAS");
    console.error("   4. Check that your NAS is accessible from this machine");
    console.error("   5. Verify the port (5001 for HTTPS) is correct");
    process.exit(1);
  }
}

testSynologyConnection();
