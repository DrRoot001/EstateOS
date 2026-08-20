/**
 * One database handle for the whole server.
 *
 * DATABASE_URL points at real PostgreSQL (VPS, Vercel, Supabase — same code).
 * With no DATABASE_URL we fall back to PGlite, Postgres compiled to WASM, stored
 * in .data/pg — so `npm run dev` works on a laptop with no server installed.
 *
 * ponytail: migrations run once at first use instead of in a deploy step. Move
 * them to `npm run db:migrate` in CI when there is a CI.
 */
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import * as schema from "./schema";

const MIGRATIONS = "./drizzle";

type Db =
  ReturnType<typeof drizzlePg<typeof schema>> | ReturnType<typeof drizzlePglite<typeof schema>>;

let handle: Promise<Db> | undefined;

async function connect(): Promise<Db> {
  const url = process.env["DATABASE_URL"];

  if (url) {
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: url,
      ssl: url.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
      max: Number(process.env["DATABASE_POOL_MAX"] ?? 10),
    });
    const db = drizzlePg(pool, { schema });
    await migratePg(db, { migrationsFolder: MIGRATIONS });
    return db;
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { mkdirSync } = await import("node:fs");
  const dir = process.env["PGLITE_DIR"] ?? ".data/pg";
  mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir);
  const db = drizzlePglite(client, { schema });
  await migratePglite(db, { migrationsFolder: MIGRATIONS });
  console.warn("estateos: no DATABASE_URL — using local PGlite store at .data/pg");
  return db;
}

export function db(): Promise<Db> {
  if (!handle) handle = connect();
  return handle;
}

export { schema };
