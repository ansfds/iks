import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

const base = process.argv[2] || "http://127.0.0.1:4173";
const failureBase = process.argv[3] || "http://127.0.0.1:4174";
const output = path.resolve(".preview");
await fs.mkdir(output, { recursive: true });
const clientFor = (url) => createTRPCClient({ links: [httpBatchLink({ url: `${url}/api/trpc`, transformer: superjson })] });
const summary = { base, checks: [] };
const check = (name) => { summary.checks.push(name); console.log(`PASS ${name}`); };
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const catalogs = [];
for (const url of ["http://127.0.0.1:3000", base]) {
  const client = clientFor(url);
  const cards = await client.giftCards.list.query();
  const prices = [];
  for (const slug of ["playstation", "xbox", "shein"]) {
    const data = await client.giftCards.bySlug.query({ slug });
    assert.equal(data.card.status, "AVAILABLE");
    assert(data.denominations.length > 0);
    assert(data.denominations.every((item) => Number(item.sellingPriceLyd) > 0));
    assert.equal(data.settings.whatsappNumber, "218935095091");
    prices.push(data.denominations.map((item) => item.sellingPriceLyd));
  }
  assert(cards.some((card) => card.status === "COMING_SOON"));
  for (const route of ["/", "/gift-cards", "/gift-cards/playstation"]) {
    const response = await fetch(url + route, { headers: { accept: "text/html" } });
    assert(response.ok); assert((await response.text()).includes("الوسيط المعتمد"));
  }
  for (const route of ["/site.webmanifest", "/images/elwaseet-el-moatamad-logo.png", "/favicon.svg", "/apple-touch-icon.png"]) {
    const response = await fetch(url + route);
    assert(response.ok); assert(!response.headers.get("content-type")?.includes("text/html"));
  }
  catalogs.push(prices);
  check(`anonymous API, deep links, images and manifest: ${url}`);
}
assert.deepEqual(catalogs[0], catalogs[1]);
check("development and production prices match exactly");
await assert.rejects(() => clientFor(failureBase).giftCards.list.query());
check("production database failure returns an error without old JSON prices");

const chrome = spawn(process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", [
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
  "--remote-debugging-port=9222", `--user-data-dir=${path.join(output, "chrome-qa")}`, "about:blank",
], { windowsHide: true, stdio: "ignore" });
let socket;
try {
  let target;
  for (let i = 0; i < 100; i++) {
    try { target = (await (await fetch("http://127.0.0.1:9222/json/list")).json()).find((item) => item.type === "page"); if (target) break; } catch {}
    await pause(100);
  }
  assert(target, "Owned headless Chrome did not start");
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  let sequence = 0;
  const pending = new Map();
  const errors = [];
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) { const task = pending.get(message.id); if (task) { pending.delete(message.id); message.error ? task.reject(new Error(JSON.stringify(message.error))) : task.resolve(message.result); } }
    if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.text);
    if (message.method === "Fetch.requestPaused") {
      send("Fetch.failRequest", { requestId: message.params.requestId, errorReason: "Failed" }).catch(() => {});
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const until = async (expression) => {
    for (let i = 0; i < 150; i++) {
      try { if (await evaluate(`Boolean(${expression})`)) return; } catch (error) { if (!/context|navigat/i.test(error.message)) throw error; }
      await pause(100);
    }
    throw new Error(`Timed out: ${expression}`);
  };
  const navigate = async (route, url = base) => {
    await send("Page.navigate", { url: url + route });
    await until(`location.href === ${JSON.stringify(url + route)} && document.readyState === 'complete' && !!document.querySelector('header img')`);
    await until(`document.querySelector('header img').naturalWidth > 0`);
    await until(`Number(getComputedStyle(document.querySelector('header img')).opacity) > .99`);
  };
  const screenshot = async (name) => { const image = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }); await fs.writeFile(path.join(output, name + ".png"), Buffer.from(image.data, "base64")); };
  await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable");
  // Exercise local image fallbacks without depending on external image servers.
  await send("Network.setBlockedURLs", { urls: ["*images.unsplash.com/*", "*gmedia.playstation.com/*", "*cdn-dynmedia-1.microsoft.com/*", "*placehold.co/*"] });
  for (const width of [375, 768, 1440]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 960, deviceScaleFactor: 1, mobile: width === 375 });
    await navigate("/");
    await until(`document.querySelector('main h1')?.textContent.includes('الوسيط المعتمد')`);
    await pause(1800); // Existing GSAP entrance animation must finish before visual QA.
    const layout = await evaluate(`(() => { const logo = document.querySelector('header img'); const r = logo.getBoundingClientRect(); return { width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth, left: r.left, right: r.right, distorted: Math.abs(r.width/r.height - logo.naturalWidth/logo.naturalHeight) > .02, oldName: document.body.innerText.includes('الوسيط العالمي') }; })()`);
    assert(!layout.overflow, JSON.stringify(layout)); assert(layout.left >= 0 && layout.right <= width); assert(!layout.distorted); assert(!layout.oldName);
    await screenshot(`home-${width}`);
    await evaluate("window.scrollTo(0, 1000)"); await pause(350);
    const lightLogo = await evaluate("document.querySelector('header img').naturalWidth > 0"); assert(lightLogo);
    if (width < 1024) {
      await evaluate(`document.querySelector('header button').click()`);
      assert(await evaluate(`document.querySelector('header button').getAttribute('aria-expanded') === 'true'`));
    }
    await navigate("/gift-cards");
    await until(`document.querySelector('a[href="/gift-cards/playstation"]')`);
    await until(`document.querySelector('main a[href="/gift-cards/playstation"] img')?.naturalWidth > 0`);
    await pause(600);
    assert(await evaluate(`!document.querySelector('main a[href="/gift-cards/steam"]')`));
    assert(await evaluate(`document.documentElement.scrollWidth <= innerWidth`));
    await screenshot(`gift-cards-${width}`);
    await navigate("/about");
    assert(await evaluate(`document.documentElement.scrollWidth <= innerWidth`));
    check(`responsive home, about, navbar, catalog and logo: ${width}px`);
  }
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
  for (const slug of ["playstation", "xbox", "shein"]) {
    await navigate(`/gift-cards/${slug}`);
    await until(`document.querySelector('button[aria-pressed="false"]')`);
    await evaluate(`document.querySelector('button[aria-pressed="false"]:not(:disabled)').click()`);
    await until(`Array.from(document.querySelectorAll('a')).some(a => a.textContent.trim() === 'الشراء')`);
    const buy = await evaluate(`(() => {const a = Array.from(document.querySelectorAll('a')).find(a => a.textContent.trim() === 'الشراء'); return { href: a.href, target: a.target };})()`);
    const url = new URL(buy.href);
    assert.equal(url.hostname, "wa.me"); assert.equal(url.pathname, "/218935095091"); assert.equal(buy.target, "_blank");
    assert(url.searchParams.get("text").includes("السعر"));
    await screenshot(`detail-${slug}`);
    for (const width of [375, 768]) {
      await send("Emulation.setDeviceMetricsOverride", { width, height: 960, deviceScaleFactor: 1, mobile: width === 375 });
      assert(await evaluate(`document.documentElement.scrollWidth <= innerWidth`));
      await screenshot(`detail-${slug}-${width}`);
    }
    await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
    check(`${slug}: denomination, price and WhatsApp checkout link without login`);
  }
  await navigate("/gift-cards/steam");
  await until(`document.body.innerText.includes('هذه البطاقة غير قابلة للشراء حاليًا')`);
  assert(await evaluate(`!Array.from(document.querySelectorAll('a')).some(a => a.textContent.trim() === 'الشراء')`));
  check("COMING_SOON direct link cannot be purchased");
  for (const route of ["/gift-cards", "/gift-cards/playstation"]) {
    await send("Fetch.enable", { patterns: [{ urlPattern: `${base}/api/trpc/giftCards.*`, requestStage: "Request" }] });
    await navigate(route);
    await until(`Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('إعادة المحاولة'))`);
    await send("Fetch.disable");
    await evaluate(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('إعادة المحاولة')).click()`);
    await until(route === "/gift-cards" ? `document.querySelector('main a[href="/gift-cards/playstation"]')` : `document.querySelector('button[aria-pressed="false"]')`);
    check(`retry recovers after a network outage: ${route}`);
  }
  for (const route of ["/gift-cards", "/gift-cards/playstation"]) {
    await navigate(route, failureBase);
    await until(`Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('إعادة المحاولة'))`);
    assert(await evaluate(`!Array.from(document.querySelectorAll('a')).some(a => a.textContent.trim() === 'الشراء')`));
    check(`database failure is recoverable and hides checkout: ${route}`);
  }
  assert.equal(errors.length, 0, JSON.stringify(errors));
  check("no uncaught browser exceptions");
  await fs.writeFile(path.join(output, "verification.json"), JSON.stringify(summary, null, 2));
} finally {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ id: 999999, method: "Browser.close" }));
    await pause(100);
    socket.close();
  }
  chrome.kill();
}
