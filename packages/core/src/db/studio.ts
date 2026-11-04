import { config } from "dotenv";
config({ path: ".env.local" });

import { createDatabase } from "./client";

async function studio() {
  const url = process.env.DATABASE_URL || "file:local.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  const db = createDatabase({ url, authToken });

  console.log("Starting Drizzle Studio...");
  console.log("Database:", url);

  // This would typically launch the Drizzle Studio UI
  // For now, we'll just verify the connection
  try {
    const result = await db.$client.execute("SELECT 1 as test");
    console.log("Connection successful:", result);
  } catch (err) {
    console.error("Connection failed:", err);
    process.exit(1);
  }
}

studio().catch((err) => {
  console.error("Studio failed:", err);
  process.exit(1);
});