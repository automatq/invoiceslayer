import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

async function main() {
    const tursoUrl = process.env.TURSO_DATABASE_URL;
    const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

    if (!tursoUrl || !tursoAuthToken) {
        console.error("❌ Turso credentials missing in .env");
        process.exit(1);
    }

    const adapter = new PrismaLibSql({
        url: tursoUrl,
        authToken: tursoAuthToken,
    });

    const prisma = new PrismaClient({ adapter });

    const phantomColumns = [
        "accounts", "sessions", "clients", "invoices", "quotes",
        "projects", "expenses", "recurring", "settings", "notifications",
        "auditLogs", "pipelines", "deals", "teams"
    ];

    console.log(`🚀 Starting to drop ${phantomColumns.length} phantom columns from User table on Turso...`);

    try {
        for (const col of phantomColumns) {
            console.log(`🗑️ Dropping column: ${col}...`);
            await prisma.$executeRawUnsafe(`ALTER TABLE "User" DROP COLUMN "${col}"`);
        }
        console.log("✅ All phantom columns dropped successfully!");
    } catch (error) {
        console.error("❌ Failed to drop phantom columns:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
