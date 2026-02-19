/**
 * Setup script for Turso database
 * Run: npx tsx scripts/setup-turso.ts
 */
import { createClient } from "@libsql/client";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoAuthToken) {
    console.error("❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
    process.exit(1);
}

console.log("🔌 Connecting to Turso...");
console.log(`📍 URL: ${tursoUrl}`);

const client = createClient({ url: tursoUrl, authToken: tursoAuthToken });

async function setup() {
    try {
        // Test connection
        const result = await client.execute("SELECT 1 as test");
        console.log("✅ Connected to Turso successfully");

        // Check if migrations table exists
        const tables = await client.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='_prisma_migrations'"
        );

        if (tables.rows.length === 0) {
            console.log("⚠️  No Prisma migrations table found. Database is empty.");
            console.log("📋 Run: npx prisma migrate deploy");
        } else {
            console.log("✅ Prisma migrations table exists");
            
            // Check migration count
            const migrations = await client.execute("SELECT COUNT(*) as count FROM _prisma_migrations");
            console.log(`📊 Applied migrations: ${migrations.rows[0].count}`);
        }

        // List all tables
        const allTables = await client.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'"
        );
        
        console.log("\n📋 Database tables:");
        allTables.rows.forEach((row: any) => {
            console.log(`  - ${row.name}`);
        });

        console.log("\n✅ Turso setup verification complete");
    } catch (error: any) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    } finally {
        await client.close();
    }
}

setup();
