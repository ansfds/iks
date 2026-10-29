import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const development = process.argv[2] || "http://127.0.0.1:4173";
const production = process.argv[3] || "http://127.0.0.1:4174";
const report = { checks: [], production, development };
const pass = (message) => { report.checks.push(message); console.log(`PASS ${message}`); };
const output = path.resolve(".preview");
await fs.mkdir(output, { recursive: true });
const source = await fs.readFile("src/config/seo.ts", "utf8");
const officialImage = source.match(/export const DEFAULT_OG_IMAGE\s*=\s*"([^"]+)"/)[1];
function meta(html, attribute, key) {
  const element = html.match(new RegExp(`<meta\\b[^>]*${attribute}="${key.replaceAll(":", "\\:")}"[^>]*>`))?.[0];
  return element?.match(/content="([^"]*)"/)?.[1];
}
const publicRoutes = ["/", "/about", "/curriculum", "/gift-cards", "/gift-cards/playstation", "/gift-cards/xbox", "/gift-cards/shein", "/transfers", "/contact", "/admissions", "/news", "/gallery", "/vision-mission", "/values", "/goals"];
for (const base of [development, production]) {
  const titles = new Set();
  for (const route of publicRoutes) {
    const response = await fetch(base + route);
    const html = await response.text();
    assert.equal(response.status, 200, route);
    const title = html.match(/<title>(.*?)<\/title>/)?.[1];
    assert(title?.includes("الوسيط المعتمد"), route);
    assert(!titles.has(title), `Duplicate title: ${title}`); titles.add(title);
    assert(meta(html, "name", "description"), route);
    assert.equal(meta(html, "property", "og:image"), officialImage, route);
    assert.equal(meta(html, "name", "twitter:image"), officialImage, route);
    assert.equal(meta(html, "name", "twitter:card"), "summary_large_image");
    assert.equal(meta(html, "property", "og:image:width"), "1200");
    assert.equal(meta(html, "property", "og:image:height"), "630");
    assert.equal(html.match(/property="og:image"/g)?.length, 1, route);
    assert.equal(html.match(/name="description"/g)?.length, 1, route);
    assert.equal(html.match(/rel="canonical"/g)?.length, 1, route);
    const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
    assert(canonical?.startsWith("https://") && !/localhost|127\.0\.0\.1/.test(canonical), route);
    assert.equal(meta(html, "property", "og:url"), canonical);
    const schema = JSON.parse(html.match(/type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert(schema.some((entry) => entry["@type"] === "WebSite"));
    assert.deepEqual(schema.find((entry) => entry["@type"] === "FinancialService").telephone, ["+218935095091", "+218945095091"]);
    if (route.startsWith("/gift-cards/")) assert(schema.some((entry) => entry["@type"] === "BreadcrumbList"));
    assert(!html.includes("الوسيط العالمي"));
  }
  for (const [route, expected] of [["/admin", 200], ["/login", 200], ["/seo-missing-page", 404], ["/gift-cards/seo-missing-card", 404]]) {
    const response = await fetch(base + route);
    assert.equal(response.status, expected, route);
    assert(response.headers.get("x-robots-tag")?.includes("noindex"));
    assert(meta(await response.text(), "name", "robots")?.includes("noindex"));
  }
  const sitemapResponse = await fetch(base + "/sitemap.xml");
  assert.equal(sitemapResponse.status, 200);
  const sitemap = await sitemapResponse.text();
  for (const route of publicRoutes) assert(sitemap.includes(`${route}</loc>`), route);
  assert(!/localhost|127\.0\.0\.1|\/admin|\/login|\/gift-cards\/steam/.test(sitemap));
  const robots = await (await fetch(base + "/robots.txt")).text();
  assert(robots.includes("Disallow: /admin")); assert(robots.includes("Disallow: /login"));
  assert(!robots.includes("Disallow: /assets"));
  pass(`raw HTML metadata, unique titles, canonical, schemas, 404, noindex, sitemap and robots: ${base}`);
}
for (const agent of ["WhatsApp/2.0", "facebookexternalhit/1.1", "TelegramBot", "Discordbot/2.0"]) {
  const response = await fetch(production + "/gift-cards/xbox", { headers: { "user-agent": agent } });
  const html = await response.text();
  assert(meta(html, "property", "og:title")?.includes("Xbox"));
  assert.equal(meta(html, "property", "og:image"), officialImage);
  pass(`social metadata without JavaScript for ${agent}`);
}
const profile = path.join(output, `chrome-seo-${process.pid}`);
await fs.mkdir(profile, { recursive: true });
const child = spawn(process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { windowsHide: true, stdio: "ignore" });
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let socket;
try {
  let port;
  for (let i = 0; i < 100; i++) { try { port = Number((await fs.readFile(path.join(profile, "DevToolsActivePort"), "utf8")).split("\n")[0]); break; } catch {} await pause(100); }
  assert(port);
  const target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((item) => item.type === "page");
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  let id = 0; const pending = new Map();
  socket.addEventListener("message", ({ data }) => { const message = JSON.parse(data); const task = pending.get(message.id); if (task) { pending.delete(message.id); message.error ? task.reject(new Error(JSON.stringify(message.error))) : task.resolve(message.result); } });
  const send = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
  const evaluate = async (expression) => { const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails)); return result.result.value; };
  const until = async (expression) => { for (let i = 0; i < 150; i++) { try { if (await evaluate(`Boolean(${expression})`)) return; } catch (error) { if (!/context|navigat/i.test(error.message)) throw error; } await pause(100); } throw new Error(`Timed out: ${expression}`); };
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: production + "/" });
  await until("document.querySelectorAll('main h1').length === 1");
  assert.equal(await evaluate("document.documentElement.lang"), "ar");
  assert.equal(await evaluate("document.documentElement.dir"), "rtl");
  assert.equal(await evaluate("document.querySelector('main section img').getAttribute('loading')"), "eager");
  assert.equal(await evaluate("document.querySelector('main section img').getAttribute('fetchpriority')"), "high");
  await evaluate("document.querySelector('header a[href=\"/gift-cards\"]').click()");
  await until("location.pathname === '/gift-cards' && document.querySelector('main a[href=\"/gift-cards/xbox\"]')");
  await evaluate("document.querySelector('main a[href=\"/gift-cards/xbox\"]').click()");
  await until("document.title.includes('Xbox') && document.querySelector('main button[aria-pressed]')");
  assert.equal(await evaluate("document.querySelectorAll('head meta[property=\"og:image\"]').length"), 1);
  assert.equal(await evaluate("document.querySelectorAll('main h1').length"), 1);
  await evaluate("document.querySelector('main button[aria-pressed]:not(:disabled)').click()");
  await until("Array.from(document.querySelectorAll('main a')).some(a => a.href.startsWith('https://web.whatsapp.com/send?phone=218935095091&'))");
  pass("client navigation metadata, one H1, Arabic, hero priority and unchanged gift-card checkout");
  for (const width of [375, 768]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 960, deviceScaleFactor: 1, mobile: width === 375 });
    assert(await evaluate("document.documentElement.scrollWidth <= innerWidth"));
  }
  pass("gift-card layout remains responsive at 375, 768 and 1440px");
  await send("Page.navigate", { url: production + "/seo-missing-page" });
  await until("document.body.innerText.includes('404') && document.querySelector('a[href=\"/\"]')");
  assert(await evaluate("document.querySelector('meta[name=\"robots\"]').content.includes('noindex')"));
  pass("404 page renders with noindex and a real home link");
  await fs.writeFile(path.join(output, "seo-verification.json"), JSON.stringify(report, null, 2));
} finally {
  if (socket?.readyState === WebSocket.OPEN) { socket.send(JSON.stringify({ id: 999999, method: "Browser.close" })); await pause(100); socket.close(); }
  child.kill();
}
