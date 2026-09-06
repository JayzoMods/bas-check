import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type AppDb = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as typeof globalThis & {
  basCheckPool?: Pool;
  basCheckDb?: AppDb;
};

export function databaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL?.trim();
  return url ? url : undefined;
}

export function getDb(): AppDb | null {
  const url = databaseUrl();
  if (!url) {
    return null;
  }
  if (!globalForDb.basCheckPool) {
    globalForDb.basCheckPool = new Pool({
      connectionString: url,
      max: 1,
      ssl: url.includes("sslmode=require") ? { rejectUnauthorized: true } : undefined,
    });
    globalForDb.basCheckDb = drizzle({ client: globalForDb.basCheckPool, schema });
  }
  return globalForDb.basCheckDb ?? null;
}
