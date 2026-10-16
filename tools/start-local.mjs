import "dotenv/config";
import { createServer } from "vite";

// Live local editing. Keep npm run preview/start for the built production site.
process.env.GIFT_CARDS_STORAGE ||= "local";
const server = await createServer({
  server: { host: "127.0.0.1", port: 4173, strictPort: true },
});
await server.listen();
server.printUrls();
