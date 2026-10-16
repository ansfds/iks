import { build } from "esbuild";

const shared = {
  platform: "node",
  bundle: true,
  format: "esm",
  target: "node20.19",
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  logLevel: "info",
};

await build({ ...shared, entryPoints: ["server/boot.ts"], outfile: "dist/boot.js" });
await build({ ...shared, entryPoints: ["server/vercel.ts"], outfile: "dist/vercel.mjs" });
