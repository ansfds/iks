import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { loadContentValidator } from "./load-content-validator.mjs";
try {
  const text = await readFile(process.argv[2] || "content/site.json", "utf8");
  const document = (await loadContentValidator())(JSON.parse(text));
  console.log(
    "Validated public content SHA256:",
    createHash("sha256").update(text).digest("hex")
  );
  console.log(
    "Collections:",
    Object.fromEntries(
      Object.entries(document.collections).map(([name, rows]) => [
        name,
        rows.length,
      ])
    )
  );
} catch {
  console.error(
    "Content validation failed. Review schema, references, duplicates and public-setting values. No content changed."
  );
  process.exitCode = 1;
}
