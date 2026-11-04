import { config } from "dotenv";
config({ path: ".env.local" });

import { migrate } from "drizzle-orm/libsql/migrator";
import { createDatabase } from "./client";

async function push() {
  const url = process.env.DATABASE_URL || "file:local.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  const db = createDatabase({ url, authToken });

  console.log("Pushing schema to database...");

  // For libSQL, we use the migrations folder
  await migrate(db, { migrationsFolder: "./drizzle" });

  console.log("Schema pushed successfully!");
  process.exit(0);
}

push().catch((err) => {
  console.error("Push failed:", err);
  process.exit(1);
});