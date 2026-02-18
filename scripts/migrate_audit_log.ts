import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
    console.log("🔧 Creating AuditLog table in Turso...");

    // Use raw SQL to create the table if it doesn't exist
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "AuditLog" (
            "id"         TEXT NOT NULL PRIMARY KEY,
            "action"     TEXT NOT NULL,
            "resource"   TEXT NOT NULL,
            "resourceId" TEXT,
            "actor"      TEXT NOT NULL DEFAULT 'system',
            "ipAddress"  TEXT,
            "metadata"   TEXT,
            "createdAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log("✅ AuditLog table created (or already exists).");

    // Verify
    const tables = await prisma.$queryRaw<{ name: string }[]>`
        SELECT name FROM sqlite_master WHERE type='table' AND name='AuditLog'
    `;
    console.log("📊 AuditLog table present:", tables.length > 0);

    await prisma.$disconnect();
}

main().catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
});
