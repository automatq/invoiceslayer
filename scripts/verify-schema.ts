/**
 * Verify Turso schema
 */
import { createClient } from "@libsql/client";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoAuthToken) {
    console.error("❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
    process.exit(1);
}

const client = createClient({ url: tursoUrl, authToken: tursoAuthToken });

async function verify() {
    try {
        const tables = await client.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        );
        
        console.log("✅ Tables created:");
        tables.rows.forEach((r: any) => console.log(`  - ${r.name}`));
        console.log(`\nTotal: ${tables.rows.length} tables`);
        
        // Check migrations
        const migrations = await client.execute("SELECT migration_name FROM _prisma_migrations ORDER BY id");
        console.log(`\n✅ Migrations tracked: ${migrations.rows.length}`);
    } catch (error: any) {
        console.error("❌ Error:", error.message);
    } finally {
        await client.close();
    }
}

verify();
