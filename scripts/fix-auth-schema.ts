/**
 * One-time script to add missing NextAuth tables/columns to Turso.
 * Run: npx tsx scripts/fix-auth-schema.ts
 */
import "dotenv/config";
import { createClient } from "@libsql/client";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoAuthToken) {
    console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
    process.exit(1);
}

const client = createClient({ url: tursoUrl, authToken: tursoAuthToken });

const statements = [
    // Add missing columns to User table
    `ALTER TABLE "User" ADD COLUMN "emailVerified" DATETIME;`,
    `ALTER TABLE "User" ADD COLUMN "image" TEXT;`,

    // Make email and password nullable (NextAuth OAuth users may not have them)
    // SQLite doesn't support ALTER COLUMN, but the column was created as NOT NULL.
    // We'll recreate later if needed; for now adding the new cols is the critical fix.

    // Create Account table for NextAuth
    `CREATE TABLE IF NOT EXISTS "Account" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "provider" TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        "refresh_token" TEXT,
        "access_token" TEXT,
        "expires_at" INTEGER,
        "token_type" TEXT,
        "scope" TEXT,
        "id_token" TEXT,
        "session_state" TEXT,
        CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");`,

    // Create Session table for NextAuth
    `CREATE TABLE IF NOT EXISTS "Session" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "sessionToken" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "expires" DATETIME NOT NULL,
        CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");`,

    // Create VerificationToken table for NextAuth
    `CREATE TABLE IF NOT EXISTS "VerificationToken" (
        "identifier" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "expires" DATETIME NOT NULL
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");`,
];

async function run() {
    for (const sql of statements) {
        try {
            await client.execute(sql);
            console.log("✅", sql.slice(0, 60).replace(/\n/g, " ") + "...");
        } catch (err: any) {
            // "duplicate column name" or "table already exists" are fine
            if (err.message?.includes("duplicate column") || err.message?.includes("already exists")) {
                console.log("⏭️  Already exists:", sql.slice(0, 60).replace(/\n/g, " ") + "...");
            } else {
                console.error("❌ Failed:", sql.slice(0, 60).replace(/\n/g, " ") + "...");
                console.error("   Error:", err.message);
            }
        }
    }
    console.log("\n🎉 Auth schema migration complete!");
}

run();
