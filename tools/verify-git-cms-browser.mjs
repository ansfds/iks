import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { build } from "esbuild";
import path from "node:path";
import assert from "node:assert/strict";
import { hashPassword } from "../server/auth/password.mjs";
import { gitFixture } from "./test-support/git-fixture.mjs";

const fixture = gitFixture(`.cache/git-cms-qa-browser-${Date.now()}`);
const port = await new Promise(resolve => {
  const server = createServer();
  server.listen(0, "127.0.0.1", () => {
    const port = server.address().port;
    server.close(() => resolve(port));
  });
});
const origin = `http://127.0.0.1:${port}`;
const password = randomBytes(32).toString("base64url");
const environment = {
  ...process.env,
  NODE_ENV: "production",
  VERCEL: "0",
  VERCEL_ENV: "preview",
  DATABASE_URL: "",
  PORT: String(port),
  ADMIN_USERNAME: "browser-owner",
  ADMIN_PASSWORD_HASH: await hashPassword(password),
  ADMIN_SESSION_SECRET: randomBytes(48).toString("base64url"),
  ADMIN_SESSION_HOURS: "0.25",
  CMS_GITHUB_REPOSITORY: "ansfds/iks",
  CMS_GITHUB_TOKEN: randomBytes(30).toString("base64url"),
  CMS_BRANCH: "experiment/git-backed-cms",
  CMS_PRODUCTION_BRANCH: "main",
  CMS_WRITES_ENABLED: "YES",
  CMS_VERCEL_PROJECT_ID: "prj_qa_existing",
  CMS_VERCEL_TOKEN: randomBytes(30).toString("base64url"),
  VERCEL_PROJECT_ID: "",
  QA_GIT_DIRECTORY: fixture.directory,
};
let child, browser;
const checks = [];
const state = value =>
  writeFile(
    path.join(fixture.directory, "deployment-state.json"),
    JSON.stringify({ state: value })
  );
async function start(artifact) {
  child = spawn(process.execPath, ["tools/test-support/browser-server.mjs"], {
    windowsHide: true,
    stdio: "ignore",
    env: { ...environment, QA_SERVER_ARTIFACT: artifact },
  });
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null)
      throw new Error("Local QA server stopped before startup");
    try {
      if ((await fetch(origin + "/api/trpc/ping")).ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error("Local QA server startup timed out");
}
async function stop() {
  if (child && child.exitCode === null) {
    const current = child;
    await new Promise(resolve => {
      current.once("exit", resolve);
      current.kill();
    });
  }
}
async function saveAddress(page, value) {
  await page.getByRole("button", { name: "التواصل", exact: true }).click();
  const field = page.getByLabel("عنوان المكتب", { exact: true });
  await field.fill(value);
  const response = page.waitForResponse(response =>
    response.url().includes("siteContent.admin.save")
  );
  await field
    .locator("..")
    .locator("..")
    .getByRole("button", { name: "حفظ", exact: true })
    .click();
  return response;
}
try {
  await state("SAVED");
  await start("dist/boot.js");
  browser = await chromium.launch({
    executablePath:
      process.env.CHROMIUM_PATH ||
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(origin + "/admin");
  await page.waitForURL("**/login");
  await page.locator("#admin-username").waitFor();
  assert.ok(await page.locator('[dir="rtl"]').count());
  await page.screenshot({
    path: ".cache/git-cms-login-desktop.png",
    fullPage: true,
  });
  checks.push("protected direct admin route and Arabic RTL");
  await page.locator("#admin-username").fill("browser-owner");
  await page.locator("#admin-password").fill("wrong-password");
  await page.getByRole("button", { name: "تسجيل الدخول", exact: true }).click();
  await page.getByRole("alert").waitFor();
  assert.match(await page.getByRole("alert").innerText(), /غير صحيحة/);
  checks.push("incorrect credentials rejected");
  await page
    .getByRole("button", { name: "إظهار كلمة المرور", exact: true })
    .click();
  assert.equal(
    await page.locator("#admin-password").getAttribute("type"),
    "text"
  );
  await page
    .getByRole("button", { name: "إخفاء كلمة المرور", exact: true })
    .click();
  checks.push("password visibility control");
  await page.locator("#admin-password").fill(password);
  await page.getByRole("button", { name: "تسجيل الدخول", exact: true }).click();
  await page.waitForURL("**/admin");
  await page.getByText("فرع التحرير:", { exact: false }).waitFor();
  await page.reload();
  await page.getByText("فرع التحرير:", { exact: false }).waitFor();
  checks.push("signed session survives page reload");
  const before = fixture.head(),
    originalAddress = JSON.parse(
      fixture.fileText()
    ).collections.siteSettings.find(row => row.key === "site_address")?.value;
  const address = "عنوان محفوظ عبر Git " + Date.now();
  assert.equal((await saveAddress(page, address)).status(), 200);
  assert.notEqual(fixture.head(), before);
  assert.equal(
    JSON.parse(fixture.fileText()).collections.siteSettings.find(
      row => row.key === "site_address"
    ).value,
    address
  );
  checks.push("UI save created a real commit in an isolated Git repository");
  await page
    .getByText("تم الحفظ؛ بانتظار بدء النشر", { exact: true })
    .waitFor();
  await state("BUILDING");
  await page
    .getByText("جارٍ النشر", { exact: true })
    .waitFor({ timeout: 15000 });
  await state("READY");
  await page.getByText("تم النشر", { exact: true }).waitFor({ timeout: 15000 });
  checks.push(
    "saved/building/deployed status UI with simulated Vercel responses"
  );
  const publicPage = await context.newPage();
  await publicPage.goto(origin + "/contact");
  await publicPage
    .getByText(originalAddress, { exact: true })
    .first()
    .waitFor();
  assert.equal(await publicPage.getByText(address, { exact: true }).count(), 0);
  checks.push("saving never leaks an unpublished draft to the public site");
  await page.screenshot({
    path: ".cache/git-cms-admin-saved.png",
    fullPage: true,
  });

  // Rebuild the real server with the saved Git snapshot without touching the working source JSON.
  const artifact = path.resolve("dist/qa-published-server.mjs");
  await build({
    entryPoints: ["server/boot.ts"],
    outfile: artifact,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20.19",
    logLevel: "silent",
    banner: {
      js: "import {createRequire} from 'node:module';const require=createRequire(import.meta.url);",
    },
    plugins: [
      {
        name: "saved-git-content",
        setup(builder) {
          builder.onLoad({ filter: /[\\/]content[\\/]site\.json$/ }, () => ({
            contents: fixture.fileText(),
            loader: "json",
          }));
        },
      },
    ],
  });
  await stop();
  await start(artifact);
  await publicPage.reload();
  await publicPage.getByText(address, { exact: true }).first().waitFor();
  await publicPage.screenshot({
    path: ".cache/git-cms-public-after-build.png",
    fullPage: true,
  });
  checks.push(
    "saved real Git content appears after rebuilding the deployed server snapshot locally"
  );
  await page.reload();
  await page.getByRole("button", { name: "التواصل", exact: true }).waitFor();
  const stale = await context.newPage();
  await stale.goto(origin + "/admin");
  await stale.getByText("فرع التحرير:", { exact: false }).waitFor();
  await stale.getByRole("button", { name: "التواصل", exact: true }).click();
  await stale.getByLabel("عنوان المكتب", { exact: true }).waitFor();
  await state("ERROR");
  const nextAddress = "مسودة ثانية " + Date.now();
  assert.equal((await saveAddress(page, nextAddress)).status(), 200);
  await page
    .getByText("فشل النشر", { exact: true })
    .waitFor({ timeout: 15000 });
  const confirmedHead = fixture.head();
  assert.equal((await saveAddress(stale, "تعديل متعارض")).status(), 409);
  assert.equal(fixture.head(), confirmedHead);
  await stale.getByText(/تغيّر المحتوى منذ فتح المحرر/).waitFor();
  assert.equal(
    await stale.getByLabel("عنوان المكتب", { exact: true }).inputValue(),
    "تعديل متعارض"
  );
  checks.push(
    "a stale browser tab cannot overwrite a newer commit and retains its draft"
  );
  await publicPage.reload();
  await publicPage.getByText(address, { exact: true }).first().waitFor();
  assert.equal(
    await publicPage.getByText(nextAddress, { exact: true }).count(),
    0
  );
  checks.push("failed deployment keeps the previous public snapshot");
  await stale.close();
  await publicPage.close();
  await page.getByRole("button", { name: "الصور", exact: true }).click();
  const imageField = page.getByLabel("صورة Hero", { exact: true });
  const imageBox = imageField.locator(
    'xpath=ancestor::div[contains(@class,"rounded-xl")][1]'
  );
  const uploaded = page.waitForResponse(response =>
    response.url().includes("cms.uploadImage")
  );
  await imageBox
    .locator("input[type=file]")
    .setInputFiles({
      name: "proof.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jF4cAAAAASUVORK5CYII=",
        "base64"
      ),
    });
  assert.equal((await uploaded).status(), 200);
  await imageBox.locator('img[src^="data:image/png"]').waitFor();
  const imageUrl = await imageField.inputValue();
  assert.match(imageUrl, /^\/images\/cms\/[a-f0-9]{64}\.png$/);
  const imageSaved = page.waitForResponse(response =>
    response.url().includes("siteContent.admin.save")
  );
  await imageBox.getByRole("button", { name: "حفظ", exact: true }).click();
  assert.equal((await imageSaved).status(), 200);
  assert.equal(
    fixture.git(["cat-file", "-t", "HEAD:public" + imageUrl]),
    "blob"
  );
  assert.equal(
    JSON.parse(fixture.fileText()).collections.siteSettings.find(
      row => row.key === "hero_image"
    ).value,
    imageUrl
  );
  checks.push("uploaded image and permanent URL survive as real Git objects");
  await page.getByRole("button", { name: "تسجيل الخروج", exact: true }).click();
  await page.waitForURL("**/login");
  await page.goto(origin + "/admin");
  await page.waitForURL("**/login");
  checks.push("logout clears the browser session");
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(origin + "/login");
  await mobilePage.locator("#admin-password").waitFor();
  assert.equal(
    await mobilePage.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    ),
    true
  );
  await mobilePage.screenshot({
    path: ".cache/git-cms-login-mobile.png",
    fullPage: true,
  });
  checks.push("390px mobile layout");
  assert.deepEqual(errors, []);
  checks.push("no JavaScript page errors");
  await writeFile(
    ".cache/git-cms-browser-results.json",
    JSON.stringify(
      {
        passed: true,
        environment:
          "local real Git + simulated GitHub/Vercel APIs; NOT hosted Preview",
        checks,
        fixture: fixture.directory,
      },
      null,
      2
    )
  );
  console.log(
    `Browser: ${checks.length} checks passed. Real local Git commits and rebuilt public snapshot verified. Hosted Preview remains untested.`
  );
} finally {
  await browser?.close();
  await stop();
}
