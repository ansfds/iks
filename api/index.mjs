// Build the server before Vercel traces this entry point. All TypeScript imports
// are resolved by esbuild, rather than by Node's native ESM loader at runtime.
export { default } from "../dist/vercel.mjs";
