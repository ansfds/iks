import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { databaseOptions } from "./server/database-config.mjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "mysql",
  dbCredentials: {
    ...databaseOptions(connectionString),
  },
});
