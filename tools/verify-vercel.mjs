import assert from "node:assert/strict";

// Import the actual production artifact using native Node ESM. This catches
// startup/import failures that Vite development and unit tests cannot detect.
process.env.NODE_ENV = "production";
process.env.VERCEL = "1";
process.env.GIFT_CARDS_STORAGE = "mysql";
process.env.DATABASE_URL = "";
const { default: handler } = await import("../api/index.mjs");
assert.equal(typeof handler.fetch, "function");

const ping = await handler.fetch(new Request("https://example.com/api/index?__path=/api/trpc/ping&batch=1&input=%7B%7D"));
assert.equal(ping.status, 200);
assert.equal((await ping.json())[0].result.data.json.ok, true);

for (const pathname of ["/about", "/gift-cards", "/gift-cards/xbox", "/gift-cards/playstation", "/gift-cards/shein"]) {
  const response = await handler.fetch(new Request(`https://example.com/api/index?__path=${pathname}`));
  assert.equal(response.status, 200);
  assert.match(await response.text(), /<meta property="og:image"/);
}

// The catalog works even if legacy storage variables ask for MySQL and no
// database exists. Browsing cards and composing orders are file-based.
const response = await handler.fetch(new Request("https://example.com/api/index?__path=/api/trpc/giftCards.list&batch=1&input=%7B%7D"));
assert.equal(response.status, 200);
assert.match(response.headers.get("content-type"), /application\/json/);
assert.equal((await response.json())[0].result.data.json.some(card => card.slug === "xbox"), true);
const sitemap = await handler.fetch(new Request("https://example.com/api/index?__path=/sitemap.xml"));
assert.equal(sitemap.status, 200);
assert.match(await sitemap.text(), /\/gift-cards\/xbox/);
console.log("Vercel production artifact: cards, details, API compatibility and sitemap work without DATABASE_URL.");
