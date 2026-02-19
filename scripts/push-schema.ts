/**
 * Push current Prisma schema directly to Turso
 * This creates all tables based on the current schema.prisma
 * Run: npx tsx scripts/push-schema.ts
 */
import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { join } from "path";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoAuthToken) {
    console.error("❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
    process.exit(1);
}

const client = createClient({ url: tursoUrl, authToken: tursoAuthToken });

// Parse schema and generate SQL
function generateSQLFromSchema(schemaContent: string): string[] {
    const statements: string[] = [];
    
    // Extract enums
    const enumRegex = /enum\s+(\w+)\s*\{([^}]+)\}/g;
    let enumMatch;
    while ((enumMatch = enumRegex.exec(schemaContent)) !== null) {
        const enumName = enumMatch[1];
        const values = enumMatch[2].split(/\s+/).filter(v => v && !v.startsWith("//"));
        // SQLite doesn't support enums, so we skip them
        console.log(`⚠️  Enum ${enumName} will be stored as TEXT`);
    }
    
    // Extract models
    const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
    let modelMatch;
    
    while ((modelMatch = modelRegex.exec(schemaContent)) !== null) {
        const modelName = modelMatch[1];
        const fieldsBlock = modelMatch[2];
        
        if (modelName === 'Account' || modelName === 'Session' || modelName === 'VerificationToken') {
            // Skip NextAuth models for now
            continue;
        }
        
        const fields: string[] = [];
        const indexes: string[] = [];
        const uniques: string[] = [];
        
        // Parse fields
        const fieldLines = fieldsBlock.split('\n');
        for (const line of fieldLines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('//')) continue;
            
            // Skip relation fields (contain @relation)
            if (trimmed.includes('@relation')) continue;
            
            // Parse field definition
            const fieldMatch = trimmed.match(/^(\w+)\s+(\w+)(\?)?/);
            if (fieldMatch) {
                const name = fieldMatch[1];
                const type = fieldMatch[2];
                const optional = fieldMatch[3];
                const isId = trimmed.includes('@id');
                const isUnique = trimmed.includes('@unique');
                
                let sqlType = 'TEXT';
                if (type === 'Int') sqlType = 'INTEGER';
                if (type === 'Float') sqlType = 'REAL';
                if (type === 'Boolean') sqlType = 'BOOLEAN';
                if (type === 'DateTime') sqlType = 'DATETIME';
                if (type === 'Json') sqlType = 'TEXT';
                
                let fieldDef = `"${name}" ${sqlType}`;
                if (!optional) fieldDef += ' NOT NULL';
                if (isId) fieldDef += ' PRIMARY KEY';
                
                // Parse @default - handle functions like cuid(), now(), etc.
                const defaultMatch = trimmed.match(/@default\(([^)]+(?:\)[^)]*)*)\)/);
                if (defaultMatch) {
                    let defaultValue = defaultMatch[1].trim();
                    if (defaultValue === 'now()') {
                        fieldDef += ' DEFAULT CURRENT_TIMESTAMP';
                    } else if (defaultValue === 'cuid()' || defaultValue === 'uuid()') {
                        // Skip - generate in app
                    } else if (defaultValue.startsWith('"') || defaultValue.startsWith("'")) {
                        fieldDef += ` DEFAULT ${defaultValue}`;
                    } else if (!isNaN(Number(defaultValue))) {
                        fieldDef += ` DEFAULT ${defaultValue}`;
                    } else if (defaultValue === 'true' || defaultValue === 'false') {
                        fieldDef += ` DEFAULT ${defaultValue}`;
                    } else {
                        fieldDef += ` DEFAULT ${defaultValue}`;
                    }
                }
                
                fields.push(fieldDef);
                
                if (isUnique && !isId) {
                    uniques.push(`CREATE UNIQUE INDEX "${modelName}_${name}_key" ON "${modelName}"("${name}");`);
                }
            }
            
            // Parse @@index
            const indexMatch = trimmed.match(/@@index\(\[(\w+)\]\)/);
            if (indexMatch) {
                indexes.push(`CREATE INDEX "${modelName}_${indexMatch[1]}_idx" ON "${modelName}"("${indexMatch[1]}");`);
            }
            
            // Parse @@unique
            const uniqueMatch = trimmed.match(/@@unique\(\[(\w+)\]\)/);
            if (uniqueMatch) {
                uniques.push(`CREATE UNIQUE INDEX "${modelName}_${uniqueMatch[1]}_key" ON "${modelName}"("${uniqueMatch[1]}");`);
            }
        }
        
        if (fields.length > 0) {
            statements.push(`CREATE TABLE "${modelName}" (${fields.join(', ')});`);
            statements.push(...indexes);
            statements.push(...uniques);
        }
    }
    
    return statements;
}

async function pushSchema() {
    try {
        console.log("🔌 Connecting to Turso...");
        await client.execute("SELECT 1");
        console.log("✅ Connected\n");
        
        // Read schema
        const schemaPath = join(process.cwd(), "prisma", "schema.prisma");
        const schemaContent = readFileSync(schemaPath, "utf-8");
        
        // Generate SQL
        const statements = generateSQLFromSchema(schemaContent);
        
        console.log(`📊 Generated ${statements.length} SQL statements\n`);
        
        // Execute statements
        for (const stmt of statements) {
            try {
                await client.execute(stmt);
                console.log(`✅ ${stmt.substring(0, 60)}...`);
            } catch (e: any) {
                if (e.message?.includes("already exists")) {
                    console.log(`⏭️  ${stmt.substring(0, 60)}... (already exists)`);
                } else {
                    console.error(`❌ ${stmt}`);
                    console.error(`   Error: ${e.message}`);
                }
            }
        }
        
        // Create migrations tracking table
        await client.execute(`
            CREATE TABLE IF NOT EXISTS _prisma_migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                migration_name TEXT NOT NULL UNIQUE,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Mark all migrations as applied
        const migrationsDir = join(process.cwd(), "prisma", "migrations");
        const migrationFolders = require('fs').readdirSync(migrationsDir, { withFileTypes: true })
            .filter((d: any) => d.isDirectory())
            .map((d: any) => d.name)
            .sort();
        
        for (const folder of migrationFolders) {
            try {
                await client.execute({
                    sql: "INSERT INTO _prisma_migrations (migration_name) VALUES (?)",
                    args: [folder]
                });
            } catch {
                // Already exists
            }
        }
        
        console.log("\n🎉 Schema push complete!");
    } catch (error: any) {
        console.error("\n❌ Error:", error.message);
        process.exit(1);
    } finally {
        await client.close();
    }
}

pushSchema();
