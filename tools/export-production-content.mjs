import "dotenv/config";
import { createConnection, escapeId } from "mysql2/promise";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { loadContentValidator } from "./load-content-validator.mjs";
let connection;
try {
  const url = new URL(process.env.SOURCE_MYSQL_DATABASE_URL || "file:///");
  if (
    url.protocol !== "mysql:" ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  )
    throw new Error(
      "SOURCE_MYSQL_DATABASE_URL must select the local legacy source; hosted sources are not permitted"
    );
  const columns = JSON.parse(
    await readFile("tools/legacy-content-columns.json", "utf8")
  );
  connection = await createConnection({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    dateStrings: true,
    bigNumberStrings: true,
    timezone: "Z",
  });
  await connection.query("SET time_zone = '+00:00'");
  await connection.query(
    "START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY"
  );
  const document = {
    version: 1,
    nextIds: {},
    collections: {},
    audit: [],
    lastOperation: "reviewed-local-mysql-export",
  };
  const excluded = {};
  for (const [name, fields] of Object.entries(columns)) {
    const table = name.replace(/[A-Z]/g, char => "_" + char.toLowerCase());
    const [rows] = await connection.query("SELECT * FROM " + escapeId(table));
    document.collections[name] = [];
    excluded[name] = 0;
    for (const row of rows) {
      if (Object.keys(row).some(key => !fields[key]))
        throw new Error("Legacy schema changed; review the column map first");
      if (
        /\b(?:test|demo|sample)\b|localhost|127\.0\.0\.1|session.?secret|database.?url/i.test(
          JSON.stringify(row)
        ) ||
        (name === "siteSettings" && !row.is_public)
      ) {
        excluded[name]++;
        continue;
      }
      const mapped = {};
      for (const [key, descriptor] of Object.entries(fields)) {
        let value = row[key];
        if (value == null) value = null;
        else if (descriptor.type === "boolean") value = Number(value) === 1;
        else if (descriptor.type === "number") value = Number(value);
        else if (descriptor.type === "date") {
          const text = String(value).replace(" ", "T");
          value = new Date(
            /^\d{4}-\d{2}-\d{2}$/.test(text) ? text + "T00:00:00Z" : text + "Z"
          ).toISOString();
        }
        mapped[descriptor.key] = value;
      }
      for (const key of ["createdBy", "updatedBy", "changedBy"])
        if (key in mapped) mapped[key] = null;
      document.collections[name].push(mapped);
    }
    document.nextIds[name] =
      Math.max(0, ...rows.map(row => Number(row.id))) + 1;
  }
  await connection.commit();
  const validate = await loadContentValidator();
  const validated = validate(document);
  const text = JSON.stringify(validated, null, 2) + "\n";
  const digest = createHash("sha256").update(text).digest("hex");
  await mkdir(".cache", { recursive: true });
  await writeFile(".cache/content-review.json", text, { mode: 0o600 });
  await writeFile(".cache/content-review.sha256", digest, { mode: 0o600 });
  await writeFile(
    ".cache/content-review-summary.json",
    JSON.stringify(
      {
        approvedForProduction: false,
        sourceTimezone: "UTC",
        sha256: digest,
        counts: Object.fromEntries(
          Object.entries(validated.collections).map(([k, v]) => [k, v.length])
        ),
        excluded,
      },
      null,
      2
    ),
    { mode: 0o600 }
  );
  console.log(
    "Review candidate generated in .cache only. Source database and content/site.json unchanged. SHA256:",
    digest
  );
} catch (error) {
  console.error(
    "Read-only export stopped:",
    error.code ||
      "Review source configuration, public settings and content schema."
  );
  process.exitCode = 1;
} finally {
  if (connection) await connection.end();
}
