import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const databaseUrl = process.env.DATABASE_URL?.replace("file:", "") ?? "prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
        log: ["query"],
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
