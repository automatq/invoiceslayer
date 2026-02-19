/**
 * Reset Turso database - drops all tables
 * Run: npx tsx scripts/reset-turso.ts
 */
import { createClient } from "@libsql/client";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoAuthToken) {
    console.error("❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
    process.exit(1);
}

const client = createClient({ url: tursoUrl, authToken: tursoAuthToken });

async function reset() {
    try {
        console.log("🔌 Connecting to Turso...");
        
        // Get all tables
        const tables = await client.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        );
        
        console.log(`Found ${tables.rows.length} tables`);
        
        // Drop each table
        for (const row of tables.rows) {
            const tableName = (row as any).name;
            console.log(`Dropping ${tableName}...`);
            await client.execute(`DROP TABLE IF EXISTS "${tableName}"`);
        }
        
        // Drop migrations table
        await client.execute('DROP TABLE IF EXISTS _prisma_migrations');
        
        console.log("✅ Database reset complete");
    } catch (error: any) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    } finally {
        await client.close();
    }
}

reset();
