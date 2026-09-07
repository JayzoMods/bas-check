import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const root = dirname(fileURLToPath(import.meta.url));

function databaseUrlFromEnvFile() {
  const envPath = join(root, "../.env.local");
  if (!existsSync(envPath)) {
    return undefined;
  }
  const line = readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((row) => row.startsWith("DATABASE_URL="));
  if (!line) {
    return undefined;
  }
  return line.slice("DATABASE_URL=".length).trim().replace(/^['"]|['"]$/g, "");
}

const url = process.env.DATABASE_URL?.trim() || databaseUrlFromEnvFile();
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = readFileSync(join(root, "../drizzle/0000_init.sql"), "utf8");
const needsSsl = url.includes("sslmode=require") || url.includes("neon.tech");

const client = new Client({
  connectionString: url,
  ssl: needsSsl ? { rejectUnauthorized: true } : undefined,
});

await client.connect();
await client.query(sql);
await client.end();
console.log("Applied drizzle/0000_init.sql");
