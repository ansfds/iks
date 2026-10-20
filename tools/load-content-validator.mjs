import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
export async function loadContentValidator() {
  await mkdir(".cache/content-tools", { recursive: true });
  const outfile = path.resolve(".cache/content-tools/validator.mjs");
  await build({
    entryPoints: ["server/cms/document.ts"],
    outfile,
    bundle: true,
    platform: "node",
    format: "esm",
    logLevel: "silent",
  });
  return (await import(pathToFileURL(outfile).href)).validateContent;
}
