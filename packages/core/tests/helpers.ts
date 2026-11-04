import { getDatabase } from "../src/db/client";
import { pushSQLiteSchema } from "drizzle-kit/api";
import * as schema from "../src/db/schema";

process.env.DATABASE_URL = process.env.DATABASE_URL || ":memory:";

let applied = false;

/**
 * Point the core DB singleton at an in-memory libsql database and push the
 * drizzle schema into it. Safe to call from every test file's beforeAll.
 */
export async function initTestDb() {
  if (applied) return;
  const db = getDatabase();
  const { apply } = await pushSQLiteSchema(schema, db as any);
  await apply();
  applied = true;
}
