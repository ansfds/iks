import "dotenv/config";
import { createServer } from "vite";

// Live local editing. Keep npm run preview/start for the built production site.
const server = await createServer({
  configLoader: "runner",
  cacheDir: ".vite-cache",
  server: { host: "127.0.0.1", port: 4173, strictPort: true },
});
await server.listen();
server.printUrls();
