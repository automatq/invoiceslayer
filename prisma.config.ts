import { defineConfig } from "@prisma/config";
import "dotenv/config";

const getDatabaseUrl = () => {
    // Priority 1: Explicitly provided DATABASE_URL if it's a local file
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("file:")) {
        return process.env.DATABASE_URL;
    }

    const tursoUrl = process.env.TURSO_DATABASE_URL;
    const tursoToken = process.env.TURSO_AUTH_TOKEN;

    if (tursoUrl && tursoToken) {
        // Strip any existing protocol if present to avoid double-prefixing
        const cleanUrl = tursoUrl.replace(/^(libsql|https|http):\/\//, "");
        return `libsql://${cleanUrl}?authToken=${tursoToken}`;
    }

    return process.env.DATABASE_URL ?? "file:./prisma/dev.db";
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
