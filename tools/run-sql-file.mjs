import "dotenv/config";
import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
const sqlFile = process.argv[2];
const skipForeignKeys = process.argv.includes("--skip-fks");

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

if (!sqlFile) {
  throw new Error("Usage: node tools/run-sql-file.mjs <file.sql> [--skip-fks]");
}

const sql = await readFile(sqlFile, "utf8");
const statements = sql
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n")
  .split(";")
  .map((statement) => statement.trim())
  .filter(Boolean)
  .filter((statement) => {
    if (!skipForeignKeys) return true;
    return !statement.toUpperCase().startsWith("ALTER TABLE");
  });

const connection = await mysql.createConnection(databaseUrl);

try {
  for (const statement of statements) {
    await connection.query(statement);
  }
  console.log(`Executed ${statements.length} statements from ${sqlFile}`);
} finally {
  await connection.end();
}
