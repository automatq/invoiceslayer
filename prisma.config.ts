import { defineConfig } from "prisma/config";
import "dotenv/config";

const getDatabaseUrl = () => {
    // Priority 1: Explicit DATABASE_URL (useful for local commands)
    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL;
    }

    // Priority 2: Turso (production)
    const tursoUrl = process.env.TURSO_DATABASE_URL;
    const tursoToken = process.env.TURSO_AUTH_TOKEN;

    if (tursoUrl && tursoToken) {
        // Strip any existing protocol if present to avoid double-prefixing
        const cleanUrl = tursoUrl.replace(/^(libsql|https|http):\/\//, "");
        return `libsql://${cleanUrl}?authToken=${tursoToken}`;
    }

    return "file:./prisma/dev.db";
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
