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

    console.log("🔍 Inspecting Client table on Turso...");

    try {
        const columns = await prisma.$queryRaw`PRAGMA table_info("Client")`;
        console.log("📊 Client table columns:", JSON.stringify(columns, null, 2));
    } catch (error) {
        console.error("❌ Failed to inspect Client table:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
