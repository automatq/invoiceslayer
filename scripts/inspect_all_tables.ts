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

    const tables = ["Invoice", "Quote", "Project", "Deal", "Team", "Expense"];

    for (const table of tables) {
        console.log(`🔍 Inspecting ${table} table on Turso...`);
        try {
            const columns = await prisma.$queryRawUnsafe(`PRAGMA table_info("${table}")`);
            console.log(`📊 ${table} table columns:`, JSON.stringify(columns, null, 2));
        } catch (error) {
            console.error(`❌ Failed to inspect ${table} table:`, error);
        }
    }

    await prisma.$disconnect();
}

main();
