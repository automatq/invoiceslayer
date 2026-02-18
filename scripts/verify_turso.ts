import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
    console.log("🔍 Verifying Turso connection...");

    try {
        // Check for existing tables
        const tables = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`;
        console.log("📊 Existing tables:", tables);

        const userCount = await prisma.user.count();
        console.log(`✅ Successfully connected to Turso! User count: ${userCount}`);

        // Check if we can write (optional, but good for verification)
        // We won't actually write data to avoid polluting the prod db if this runs there

    } catch (error) {
        console.error("❌ Failed to connect to Turso:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
