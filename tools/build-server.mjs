import { build } from "esbuild";
import { mkdir, writeFile } from 'node:fs/promises';

const shared = {
  platform: "node",
  bundle: true,
  format: "esm",
  target: "node20.19",
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  logLevel: "info",
};

const reports = [];
for (const [entry, output] of [['server/boot.ts', 'dist/boot.js'], ['server/vercel.ts', 'dist/vercel.mjs']]) {
  const result = await build({ ...shared, entryPoints: [entry], outfile: output, metafile: true });
  const inputs = Object.keys(result.metafile.inputs);
  if (inputs.some(name => /node_modules\/(mysql2|pg|drizzle-orm)\//.test(name))) throw new Error('A database driver was accidentally bundled into the Git CMS runtime');
  reports.push({ entry, databaseDrivers: [], inputs });
}
await mkdir('.cache', { recursive: true });
await writeFile('.cache/server-dependencies.json', JSON.stringify(reports, null, 2));
