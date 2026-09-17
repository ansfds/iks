import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

function quoteIdentifier(identifier) {
  return `\`${identifier.replaceAll("`", "``")}\``;
}

const connection = await mysql.createConnection(databaseUrl);

try {
  const [tableRows] = await connection.query("SHOW TABLES");
  const tables = tableRows.map((row) => row[Object.keys(row)[0]]);
  const backup = {
    generatedAt: new Date().toISOString(),
    tables: {},
  };

  for (const table of tables) {
    const [createRows] = await connection.query(
      `SHOW CREATE TABLE ${quoteIdentifier(table)}`,
    );
    const [rows] = await connection.query(
      `SELECT * FROM ${quoteIdentifier(table)}`,
    );
    backup.tables[table] = {
      createTable: createRows[0]?.["Create Table"] ?? "",
      rows,
    };
  }

  const backupDir = path.resolve("backups");
  await mkdir(backupDir, { recursive: true });
  const fileName = `db-backup-${new Date()
    .toISOString()
    .replaceAll(":", "-")
    .replaceAll(".", "-")}.json`;
  const filePath = path.join(backupDir, fileName);
  await writeFile(filePath, JSON.stringify(backup, null, 2), "utf8");
  console.log(filePath);
} finally {
  await connection.end();
}
