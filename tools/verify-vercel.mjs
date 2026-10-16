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

for (const pathname of ["/about", "/gift-cards"]) {
  const response = await handler.fetch(new Request(`https://example.com/api/index?__path=${pathname}`));
  assert.equal(response.status, 200);
  assert.match(await response.text(), /<meta property="og:image"/);
}

// A missing integration must remain a handled JSON error, not crash the function.
const originalError = console.error;
let reportedMissingDatabase = false;
console.error = (...args) => { reportedMissingDatabase ||= args.some(value => value instanceof Error && /Missing required environment variable: DATABASE_URL/.test(value.message)); };
try {
  const response = await handler.fetch(new Request("https://example.com/api/index?__path=/api/trpc/giftCards.list&batch=1&input=%7B%7D"));
  assert.equal(response.status, 500);
  assert.match(response.headers.get("content-type"), /application\/json/);
  assert.equal((await response.json())[0].error.json.data.code, "INTERNAL_SERVER_ERROR");
  assert.equal(reportedMissingDatabase, true);
} finally {
  console.error = originalError;
}
console.log("Vercel production artifact: startup, nested API, page metadata and database-error handling passed.");
