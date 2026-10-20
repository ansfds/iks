import assert from "node:assert/strict";
import { randomBytes } from 'node:crypto';
import { hashPassword } from '../server/auth/password.mjs';

// Import the actual production artifact using native Node ESM. This catches
// startup/import failures that Vite development and unit tests cannot detect.
process.env.NODE_ENV = "production";
process.env.VERCEL = "1";
process.env.DATABASE_URL = "";
const { default: handler } = await import("../api/index.mjs");
assert.equal(typeof handler.fetch, "function");

const ping = await handler.fetch(new Request("https://example.com/api/index?__path=/api/trpc/ping&batch=1&input=%7B%7D"));
assert.equal(ping.status, 200);
assert.equal((await ping.json())[0].result.data.json.ok, true);

for (const pathname of ["/", "/about", "/curriculum", "/transfers", "/contact", "/gift-cards", "/login"]) {
  const response = await handler.fetch(new Request(`https://example.com/api/index?__path=${pathname}`));
  assert.equal(response.status, 200);
  assert.match(await response.text(), /<meta property="og:image"/);
}

// Public content is embedded in the built artifact and needs no database or GitHub token.
const response = await handler.fetch(new Request("https://example.com/api/index?__path=/api/trpc/giftCards.list&batch=1&input=%7B%7D"));
assert.equal(response.status, 200);
assert.match(response.headers.get("content-type"), /application\/json/);
assert.doesNotMatch(await response.text(), /mysql:\/\/|ADMIN_PASSWORD_HASH|CMS_GITHUB_TOKEN|SELECT |Failed query/);
const sitemap = await handler.fetch(new Request("https://example.com/api/index?__path=/sitemap.xml"));
assert.equal(sitemap.status, 200);
const admin = await handler.fetch(new Request('https://example.com/api/index?__path=/admin'));
assert.equal(admin.status, 302);
assert.equal(admin.headers.get('Location'), '/login');
assert.equal(admin.headers.get('Cache-Control'), 'no-store');
const password = randomBytes(32).toString('base64url');
process.env.ADMIN_USERNAME = 'artifact-owner';
process.env.ADMIN_PASSWORD_HASH = await hashPassword(password);
process.env.ADMIN_SESSION_SECRET = randomBytes(48).toString('base64url');
process.env.ADMIN_SESSION_HOURS = '0.25';
process.env.TURNSTILE_SITE_KEY = 'test-public-widget';
process.env.TURNSTILE_SECRET_KEY = randomBytes(32).toString('base64url');
const originalFetch = globalThis.fetch;
globalThis.fetch = async url => {
  assert.equal(String(url), 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
  return Response.json({ success: true, hostname: 'example.com', action: 'admin-login' });
};
try {
  const signedIn = await handler.fetch(new Request('https://example.com/api/index?__path=/api/trpc/auth.login', {
    method: 'POST', headers: { origin: 'https://example.com', 'content-type': 'application/json', 'x-admin-request': '1' },
    body: JSON.stringify({ json: { username: 'artifact-owner', password, challengeToken: 'isolated-artifact-challenge' } }),
  }));
  assert.equal(signedIn.status, 200);
  const cookie = signedIn.headers.get('set-cookie');
  assert.match(cookie, /__Host-elwaseet_admin=.*HttpOnly.*Secure/);
  for (const pathname of ['/admin', '/admin/settings']) {
    const response = await handler.fetch(new Request('https://example.com/api/index?__path=' + pathname, { headers: { cookie: cookie.split(';')[0] } }));
    assert.equal(response.status, 200); assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.match(await response.text(), /id="root"/);
  }
} finally { globalThis.fetch = originalFetch; }
console.log('Vercel artifact: public routing, catalog, sitemap and admin redirect without a database PASS.');
