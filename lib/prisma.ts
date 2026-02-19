import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Check for Turso configuration
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

let adapter;

if (tursoUrl && tursoUrl.includes("turso.io")) {
    adapter = new PrismaLibSql({
        url: tursoUrl,
        authToken: tursoAuthToken,
    });
} else {
    if (!globalForPrisma.prisma) {
        console.log("📂 Using Local SQLite Database");
    }
    const databaseUrl = process.env.DATABASE_URL?.replace("file:", "") ?? "prisma/dev.db";
    adapter = new PrismaBetterSqlite3({ url: databaseUrl });
}

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["query"] : [],
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
