import devServer from "@hono/vite-dev-server"
import path from "path"
const __dirname = import.meta.dirname
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { siteMetadata } from './tools/site-metadata'
import { config as loadServerEnvironment } from 'dotenv'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  // Reload server-only credentials when Vite restarts after auth:setup changes .env.
  if (command === 'serve') loadServerEnvironment({ override: true, quiet: true });
  return {
  cacheDir: '.vite-cache',
  plugins: [
    siteMetadata(),
    devServer({ entry: "server/boot.ts", exclude: [/^\/(?!api\/).*$/] }),
    react()],
  server: {
    port: 3000,
    fs: { deny: ['**/.env*', '**/*.{crt,pem}', '**/.git/**', '**/.cache/**', '**/admin-backup-*/**'] },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@contracts": path.resolve(__dirname, "./contracts"),
      "@db": path.resolve(__dirname, "./db"),
      "db": path.resolve(__dirname, "./db"),
    },
  },
  envDir: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  };
});
