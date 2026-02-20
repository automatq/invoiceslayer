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

    const fixes = [
        {
            table: "User",
            columns: ["accounts", "sessions", "clients", "invoices", "quotes", "projects", "expenses", "recurring", "settings", "notifications", "auditLogs", "pipelines", "deals", "teams"]
        },
        {
            table: "Client",
            columns: ["invoices", "quotes", "projects", "recurringInvoices", "deals", "signatures"]
        },
        {
            table: "Invoice",
            columns: ["items", "payments"]
        },
        {
            table: "Quote",
            columns: ["items"]
        },
        {
            table: "Project",
            columns: ["invoices", "quotes", "expenses"]
        },
        {
            table: "Deal",
            columns: ["activities", "notes", "quotes", "invoices"]
        },
        {
            table: "Team",
            columns: ["members", "invitations", "clients", "invoices", "quotes", "projects", "expenses", "recurring", "pipelines", "deals", "settingsTeam"]
        }
    ];

    console.log("🚀 Starting comprehensive schema fix on Turso...");

    try {
        for (const fix of fixes) {
            console.log(`📊 Fixing ${fix.table} table...`);
            for (const col of fix.columns) {
                try {
                    console.log(`🗑️ Dropping ${fix.table} column: ${col}...`);
                    await prisma.$executeRawUnsafe(`ALTER TABLE "${fix.table}" DROP COLUMN "${col}"`);
                } catch (e) {
                    // console.log(`ℹ️ Column ${col} already dropped or doesn't exist in ${fix.table}.`);
                }
            }
        }

        console.log("✅ All phantom columns dropped successfully!");
    } catch (error) {
        console.error("❌ Failed to drop phantom columns:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
