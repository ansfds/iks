import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { createHash } from "node:crypto";
import { loadContentValidator } from "./load-content-validator.mjs";
try {
  const source = await readFile(".cache/content-review.json", "utf8");
  const digest = createHash("sha256").update(source).digest("hex");
  (await loadContentValidator())(JSON.parse(source));
  if (
    process.env.REVIEWED_CONTENT_SHA256 !== digest ||
    process.env.CONFIRM_LOCAL_CONTENT_REPLACEMENT !== "YES" ||
    process.env.VERCEL
  )
    throw new Error("Review and confirm the exact local content hash first");
  const previous = await readFile("content/site.json");
  await mkdir("backups", { recursive: true });
  const filename = `backups/content-before-import-${Date.now()}.json`;
  await writeFile(filename, previous, { mode: 0o600, flag: "wx" });
  await writeFile(
    filename + ".sha256",
    createHash("sha256").update(previous).digest("hex"),
    { mode: 0o600, flag: "wx" }
  );
  await writeFile(".cache/content-next.json", source, { mode: 0o600 });
  await rename(".cache/content-next.json", "content/site.json");
  console.log(
    "Reviewed content copied locally; previous JSON backed up. No commit, push or deployment performed."
  );
} catch {
  console.error(
    "Local import stopped. Review schema, exact hash and confirmation."
  );
  process.exitCode = 1;
}
