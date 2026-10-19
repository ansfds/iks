import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const bases = process.argv.slice(2);
if (!bases.length) bases.push("http://127.0.0.1:4173");
const catalog = JSON.parse(await fs.readFile(new URL("../src/config/gift-card-catalog.json", import.meta.url), "utf8"));
const shein = catalog.giftCards.find(card => card.slug === "shein");
const shein500 = catalog.denominations.find(item => item.giftCardId === shein.id && Number(item.faceValue) === 500);
const shein500Price = Number(shein500.manualSellingPriceLyd || Number(shein500.specialPriceUsd) * catalog.settings.rateAbove100);
const fixtures = [
  { slug: "xbox", face: "$50", expected: "🎮 طلب شراء كرت Xbox\n\n🌎 الريجن: أمريكي\n💳 الفئة: $50\n💵 السعر الحالي: 500 د.ل\n\n✅ نبي نكمل الطلب ونتفق معاكم على طريقة الدفع." },
  { slug: "playstation", face: "$100", expected: "🎮 طلب شراء كرت PlayStation Store\n\n🌎 الريجن: أمريكي\n💳 الفئة: $100\n💵 السعر الحالي: 1000 د.ل\n\n✅ نبي نكمل الطلب ونتفق معاكم على طريقة الدفع." },
  { slug: "shein", face: "$500", expected: `🎮 طلب شراء كرت SHEIN\n\n💳 الفئة: $500\n💵 السعر الحالي: ${shein500Price} د.ل\n\n✅ نبي نكمل الطلب ونتفق معاكم على طريقة الدفع.` },
];
const output = path.resolve(".preview");
const profile = path.join(output, `chrome-whatsapp-${process.pid}`);
await fs.mkdir(profile, { recursive: true });
const chrome = spawn(process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { windowsHide: true, stdio: "ignore" });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const report = { checks: [], fixtures: [], whatsappWeb: null, mobileAppTested: false };
let socket;
try {
  let port;
  for (let i = 0; i < 100; i++) {
    try { port = Number((await fs.readFile(path.join(profile, "DevToolsActivePort"), "utf8")).split("\n")[0]); break; } catch {}
    await pause(100);
  }
  assert(port, "Owned Chrome did not start");
  const target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(item => item.type === "page");
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  let id = 0;
  const pending = new Map();
  const rawMessages = [];
  const opened = [];
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    const task = pending.get(message.id);
    if (task) { pending.delete(message.id); message.error ? task.reject(new Error(JSON.stringify(message.error))) : task.resolve(message.result); }
    if (message.method === "Runtime.consoleAPICalled" && message.params.args[0]?.value === "WHATSAPP RAW MESSAGE:") rawMessages.push(message.params.args[1]?.value);
    if (message.method === "Page.windowOpen") opened.push(message.params.url);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
  const evaluate = async expression => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true, userGesture: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const until = async expression => {
    for (let i = 0; i < 150; i++) {
      try { if (await evaluate(`Boolean(${expression})`)) return; } catch (error) { if (!/context|navigat/i.test(error.message)) throw error; }
      await pause(100);
    }
    throw new Error(`Timed out: ${expression}`);
  };
  await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable");
  let finalLink;
  for (const base of bases) {
    const logsBefore = rawMessages.length;
    const headers = await fetch(base + "/gift-cards/xbox");
    assert.equal(headers.status, 200);
    const html = await headers.text();
    assert.equal(html.match(/<meta\s+charset=/gi)?.length, 1);
    for (const fixture of fixtures) {
      await send("Page.navigate", { url: base + "/gift-cards/" + fixture.slug });
      await until("document.querySelector('main button[aria-pressed]')");
      await evaluate(`Array.from(document.querySelectorAll('main button[aria-pressed]')).find(button => button.querySelector('span.block')?.textContent.trim() === ${JSON.stringify(fixture.face)}).click()`);
      await until("document.querySelector('main a[href*=\"web.whatsapp.com/send\"]')");
      const link = await evaluate("document.querySelector('main a[href*=\"web.whatsapp.com/send\"]').href");
      const message = new URL(link).searchParams.get("text");
      assert.equal(message, fixture.expected);
      assert(!message.includes("\uFFFD"));
      assert(!message.includes("*"));
      if (base.includes(":4173")) assert(rawMessages.includes(fixture.expected), "Development raw-message log missing");
      else assert.equal(rawMessages.length, logsBefore, "Production must not log raw order messages");
      report.fixtures.push({ base, slug: fixture.slug, roundTrip: true, replacementCharacters: 0, message });
      finalLink = link;
      console.log(`PASS actual UI ${fixture.slug} ${fixture.face}: exact message and Unicode round trip at ${base}`);
    }
  }
  await evaluate("document.querySelector('main a[href*=\"web.whatsapp.com/send\"]').click()");
  await until("true");
  for (let i = 0; i < 30 && !opened.length; i++) await pause(100);
  assert.equal(opened.at(-1), finalLink, "The buy button must open the unchanged composer URL");
  report.checks.push("Buy button opens the exact verified URL without a redirect or extra encoding");

  // Open the real service in the owned, unauthenticated browser. Never send.
  await send("Page.navigate", { url: finalLink });
  await pause(8000);
  report.whatsappWeb = await evaluate(`(() => {
    const composer = document.querySelector('footer [contenteditable="true"][role="textbox"]');
    const bodyText = document.body?.innerText ?? '';
    return { url: location.href, title: document.title, loadPending: !document.body, composerPresent: Boolean(composer), composeText: composer?.innerText ?? null, loginRequired: /log into|log in to|تسجيل الدخول|رمز QR|scan.*QR/i.test(bodyText), serviceError: /sorry, something went wrong/i.test(bodyText) };
  })()`);
  console.log(JSON.stringify({ whatsappWeb: report.whatsappWeb }));
  await fs.writeFile(path.join(output, "whatsapp-unicode-verification.json"), JSON.stringify(report, null, 2));
} finally {
  if (socket?.readyState === WebSocket.OPEN) { socket.send(JSON.stringify({ id: 999999, method: "Browser.close" })); await pause(100); socket.close(); }
  chrome.kill();
}
