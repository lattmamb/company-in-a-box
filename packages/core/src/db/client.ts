import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

export interface DatabaseConfig {
  url: string;
  authToken?: string;
}

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function createDatabase(config: DatabaseConfig) {
  const client = createClient({
    url: config.url,
    authToken: config.authToken,
  });

  const db = drizzle(client, { schema, logger: process.env.NODE_ENV === "development" });

  return db;
}

export function getDatabase(): ReturnType<typeof drizzle> {
  if (!dbInstance) {
    const url = process.env.DATABASE_URL || "file:local.db";
    const authToken = process.env.DATABASE_AUTH_TOKEN;

    const client = createClient({
      url,
      authToken,
    });

    dbInstance = drizzle(client, { schema, logger: process.env.NODE_ENV === "development" });
  }

  return dbInstance;
}

export function resetDatabase() {
  dbInstance = null;
}

export type Database = ReturnType<typeof drizzle<typeof schema>>;
export { schema };