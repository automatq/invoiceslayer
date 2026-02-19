/**
 * Migration script for Turso database
 * Uses @libsql/client to execute migrations directly
 * Run: npx tsx scripts/migrate-turso.ts
 */
import { createClient } from "@libsql/client";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoAuthToken) {
    console.error("❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
    process.exit(1);
}

const client = createClient({ url: tursoUrl, authToken: tursoAuthToken });

async function migrate() {
    try {
        console.log("🔌 Connecting to Turso...");
        await client.execute("SELECT 1");
        console.log("✅ Connected\n");

        // Create migrations table if not exists
        await client.execute(`
            CREATE TABLE IF NOT EXISTS _prisma_migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                migration_name TEXT NOT NULL UNIQUE,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Get applied migrations
        const applied = await client.execute("SELECT migration_name FROM _prisma_migrations");
        const appliedNames = new Set(applied.rows.map((r: any) => r.migration_name));

        // Read migration files
        const migrationsDir = join(process.cwd(), "prisma", "migrations");
        const migrationFolders = readdirSync(migrationsDir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name)
            .sort();

        console.log(`📊 Found ${migrationFolders.length} migrations`);
        console.log(`✅ Already applied: ${appliedNames.size}\n`);

        let appliedCount = 0;

        for (const folder of migrationFolders) {
            if (appliedNames.has(folder)) {
                console.log(`⏭️  ${folder} - already applied`);
                continue;
            }

            const sqlPath = join(migrationsDir, folder, "migration.sql");
            let sql: string;
            
            try {
                sql = readFileSync(sqlPath, "utf-8");
            } catch {
                console.log(`⚠️  ${folder} - no migration.sql, skipping`);
                continue;
            }

            console.log(`🔄 ${folder} - applying...`);

            // Split and execute statements
            const statements = sql
                .split(";")
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith("--") && !s.startsWith("/*"));

            for (const stmt of statements) {
                try {
                    await client.execute(stmt + ";");
                } catch (e: any) {
                    // Ignore "already exists" errors
                    if (!e.message?.includes("already exists") && !e.message?.includes("duplicate")) {
                        throw e;
                    }
                }
            }

            // Record migration
            await client.execute({
                sql: "INSERT INTO _prisma_migrations (migration_name) VALUES (?)",
                args: [folder]
            });

            console.log(`✅ ${folder} - applied\n`);
            appliedCount++;
        }

        console.log(`\n🎉 Migration complete! Applied ${appliedCount} new migrations.`);
    } catch (error: any) {
        console.error("\n❌ Migration failed:", error.message);
        process.exit(1);
    } finally {
        await client.close();
    }
}

migrate();
