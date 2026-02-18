import { defineConfig } from "@prisma/config";
import "dotenv/config";

const getDatabaseUrl = () => {
    if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
        return `${process.env.TURSO_DATABASE_URL}?authToken=${process.env.TURSO_AUTH_TOKEN}`;
    }
    return process.env.DATABASE_URL ?? "file:./dev.db";
};

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations", // Ensure this path is correct relative to where you run prisma commands
    },
    datasource: {
        url: getDatabaseUrl(),
    },
});
