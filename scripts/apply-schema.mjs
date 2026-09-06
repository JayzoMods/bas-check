import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Client } from "pg";

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const root = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(root, "../drizzle/0000_init.sql"), "utf8");

const client = new Client({
  connectionString: url,
  ssl: url.includes("sslmode=require") ? { rejectUnauthorized: true } : undefined,
});

await client.connect();
await client.query(sql);
await client.end();
console.log("Applied drizzle/0000_init.sql");
