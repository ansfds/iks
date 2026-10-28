import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { build } from "esbuild";
import assert from "node:assert/strict";
const directory = ".cache/admin-visual-qa-" + Date.now();
await mkdir(directory, { recursive: true });
const port = await new Promise(resolve => {
  const s = createServer();
  s.listen(0, "127.0.0.1", () => {
    const p = s.address().port;
    s.close(() => resolve(p));
  });
});
const origin = "http://127.0.0.1:" + port,
  password = randomBytes(24).toString("hex");
await build({
  entryPoints: ["tools/test-support/admin-ui-server.ts"],
  outfile: directory + "/server.mjs",
  platform: "node",
  bundle: true,
  format: "esm",
  banner: {
    js: "import {createRequire} from 'node:module';const require=createRequire(import.meta.url);",
  },
});
const child = spawn(process.execPath, [directory + "/server.mjs"], {
  windowsHide: true,
  env: {
    ...process.env,
    NODE_ENV: "test",
    VERCEL: "0",
    PORT: String(port),
    QA_PASSWORD: password,
    QA_DIRECTORY: directory,
    SUPABASE_URL: "https://qa-only.invalid",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_qa_test_fixture_only",
    SUPABASE_ADMIN_USER_IDS: "11111111-1111-4111-8111-111111111111",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
child.stdout.on("data", d => (output += d));
child.stderr.on("data", d => (output += d));
let browser;
const checks = [];
const savedOperations = new WeakMap();
const success = async page => {
  const previous = savedOperations.get(page) || "";
  await page.waitForFunction(previous => {
    const value = JSON.parse(
      sessionStorage.getItem("supabase-last-save") || "null"
    );
    return value?.commit && value.commit !== previous;
  }, previous);
  savedOperations.set(
    page,
    await page.evaluate(
      () => JSON.parse(sessionStorage.getItem("supabase-last-save")).commit
    )
  );
  await page.getByText("تم الحفظ بنجاح", { exact: true }).last().waitFor();
  await page.locator('[role="dialog"]').waitFor({ state: "hidden" });
};
try {
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw Error("QA server failed: " + output);
    try {
      if ((await fetch(origin + "/api/trpc/ping")).ok) break;
    } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto(origin + "/admin", { waitUntil: "networkidle" });
  assert.equal(new URL(page.url()).pathname, "/login");
  await page.locator("input[type=email]").fill("qa@example.test");
  await page.locator("input[type=password]").fill(password);
  await page.getByRole("button", { name: "تسجيل الدخول", exact: true }).click();
  await page.waitForURL("**/admin");
  await page.getByRole("button", { name: "Gift Cards", exact: true }).click();
  await page.waitForURL("**/admin/gift-cards");
  assert.equal(
    await page.getByText("إعدادات البطاقات العامة", { exact: true }).count(),
    0
  );
  for (const old of ["الصفحة الرئيسية والنصوص", "إظهار الأقسام", "SEO"])
    assert.equal(
      await page
        .locator("aside")
        .getByRole("button", { name: old, exact: true })
        .count(),
      0
    );
  assert.equal(
    await page.locator("[data-testid=admin-gift-grid] h3").count(),
    9
  );
  await page.screenshot({
    path: directory + "/gift-grid.png",
    fullPage: true,
    animations: "disabled",
  });
  checks.push(
    "Gift image grid and simplified Sidebar; general card settings removed"
  );
  await page
    .locator("[data-testid=admin-gift-grid]")
    .getByRole("button")
    .filter({
      has: page.getByRole("heading", {
        name: "PlayStation Store",
        exact: true,
      }),
    })
    .click();
  await page.waitForURL(/\/admin\/gift-cards\/\d+$/);
  await page
    .getByRole("button", { name: "تعديل فئة $50", exact: true })
    .waitFor();
  assert.equal(
    await page.getByRole("button", { name: /تعديل فئة/ }).count(),
    16
  );
  checks.push("PlayStation internal route shows all 16 denominations");
  await page
    .getByRole("button", { name: "تعديل فئة $50", exact: true })
    .click();
  let modal = page.getByRole("dialog");
  await modal.getByLabel("Most Popular — الأكثر طلبًا").check();
  await modal.getByLabel("السعر الداخلي بالدينار (اختياري)").fill("777");
  await modal
    .getByRole("button", { name: "حفظ التعديلات", exact: true })
    .click();
  await success(page);
  let fixture = JSON.parse(
    await readFile(directory + "/document.json", "utf8")
  );
  let denom = fixture.collections.giftCardDenominations.find(
    d => d.giftCardId === 1 && Number(d.faceValue) === 50
  );
  assert.equal(denom.isMostPopular, true);
  assert.equal(denom.manualSellingPriceLyd, "777.000");
  checks.push("Denomination modal persists popular flag and private price");
  await page
    .getByRole("button", { name: "تعديل فئة $50", exact: true })
    .click();
  modal = page.getByRole("dialog");
  await modal.getByLabel("فعالة — تظهر في الموقع").uncheck();
  await modal
    .getByRole("button", { name: "حفظ التعديلات", exact: true })
    .click();
  await success(page);
  const publicPage = await browser.newPage();
  await publicPage.goto(origin + "/gift-cards/playstation", {
    waitUntil: "networkidle",
  });
  assert.equal(
    await publicPage
      .locator('button[data-denomination-id="' + denom.id + '"]')
      .count(),
    0
  );
  await page
    .getByRole("button", { name: "تعديل فئة $50", exact: true })
    .click();
  modal = page.getByRole("dialog");
  await modal.getByLabel("فعالة — تظهر في الموقع").check();
  await modal
    .getByRole("button", { name: "حفظ التعديلات", exact: true })
    .click();
  await success(page);
  await publicPage.reload({ waitUntil: "networkidle" });
  assert.equal(
    await publicPage
      .locator('button[data-denomination-id="' + denom.id + '"]')
      .count(),
    1
  );
  checks.push(
    "Inactive denomination stays in Admin and disappears publicly; reactivation restores it"
  );
  await page.getByRole("button", { name: "إضافة فئة", exact: true }).click();
  modal = page.getByRole("dialog");
  await modal.getByLabel("قيمة الفئة", { exact: true }).fill("155");
  await modal
    .getByRole("button", { name: "حفظ التعديلات", exact: true })
    .click();
  await success(page);
  await publicPage.reload({ waitUntil: "networkidle" });
  assert.equal(
    await publicPage.getByRole("button", { name: "$155", exact: true }).count(),
    1
  );
  await page
    .getByRole("button", { name: "تعديل فئة $155", exact: true })
    .click();
  modal = page.getByRole("dialog");
  page.once("dialog", d => d.accept());
  await modal.getByRole("button", { name: "حذف الفئة", exact: true }).click();
  await success(page);
  checks.push(
    "Adding and deleting a denomination works with explicit confirmation"
  );
  await page
    .getByRole("button", { name: "تعديل بيانات البطاقة", exact: true })
    .click();
  await page.getByLabel("الاسم الظاهر", { exact: true }).fill("PlayStation QA");
  await page
    .getByRole("button", { name: "حفظ التعديلات", exact: true })
    .click();
  await success(page);
  const originalCard = JSON.parse(
    await readFile("content/site.json", "utf8")
  ).collections.giftCards.find(c => c.id === 1);
  const editedCard = JSON.parse(
    await readFile(directory + "/document.json", "utf8")
  ).collections.giftCards.find(c => c.id === 1);
  assert.equal(
    editedCard.imageUrl,
    originalCard.imageUrl,
    "A name edit must preserve the original stored image"
  );
  await publicPage.reload({ waitUntil: "networkidle" });
  assert.equal(
    await publicPage
      .getByRole("heading", { name: "PlayStation QA", exact: true })
      .count(),
    1
  );
  await page
    .getByRole("button", { name: "تعديل بيانات البطاقة", exact: true })
    .click();
  await page
    .getByLabel("صورة البطاقة", { exact: true })
    .fill(origin + "/images/not-found.png");
  await page
    .getByText("تعذر تحميل الصورة. تحقق من الرابط قبل الحفظ.", { exact: true })
    .first()
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "حفظ التعديلات", exact: true })
      .isDisabled(),
    true
  );
  await page
    .getByLabel("صورة البطاقة", { exact: true })
    .fill("/images/elwaseet-el-moatamad-logo.png");
  await page
    .getByRole("button", { name: "حفظ التعديلات", exact: true })
    .click();
  await success(page);
  await publicPage.reload({ waitUntil: "networkidle" });
  assert.equal(
    await publicPage
      .locator('img[alt="صورة PlayStation QA"]')
      .getAttribute("src"),
    "/images/elwaseet-el-moatamad-logo.png"
  );
  checks.push(
    "Card name/image override persist; invalid images cannot be saved"
  );
  await page.getByRole("button", { name: "الصور", exact: true }).click();
  await page.waitForURL("**/admin/images");
  await page
    .getByRole("combobox", { name: "صفحة المعاينة" })
    .selectOption("/vision-mission");
  await page
    .locator("[data-testid=visual-editor] aside")
    .getByRole("button", { name: "رسالتنا", exact: true })
    .waitFor();
  await page
    .locator("[data-testid=visual-editor] aside")
    .getByRole("button", { name: "رسالتنا", exact: true })
    .click();
  const preview = page.frameLocator('iframe[title="معاينة الموقع الحقيقية"]');
  await preview
    .locator("[data-editor-section=mission] [data-cms-key=mission_description]")
    .waitFor();
  const previous = await preview
    .locator("[data-cms-key=mission_description]")
    .innerText();
  assert.ok(previous.length > 20);
  assert.equal(await preview.locator("body").evaluate(() => innerWidth), 1280);
  await preview
    .locator("[data-cms-image=mission_image]")
    .scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const img = document
      .querySelector("iframe")
      .contentDocument.querySelector("img[data-cms-image=mission_image]");
    return img?.complete && img.naturalWidth > 0;
  });
  await page.screenshot({
    path: directory + "/visual-mission.png",
    fullPage: true,
    animations: "disabled",
  });
  const inline = preview.locator("[data-cms-key=mission_description]");
  await inline.click();
  await inline.fill("رسالة تجريبية محفوظة من المحرر البصري");
  await page
    .getByRole("button", { name: "الحسابات المصرفية", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "متابعة التحرير", exact: true })
    .click();
  assert.equal(new URL(page.url()).pathname, "/admin/images");
  await page.evaluate(() => history.back());
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "متابعة التحرير", exact: true })
    .click();
  assert.equal(new URL(page.url()).pathname, "/admin/images");
  await page
    .getByRole("button", { name: "حفظ التعديلات", exact: true })
    .click();
  await success(page);
  await publicPage.goto(origin + "/vision-mission", {
    waitUntil: "networkidle",
  });
  assert.equal(
    await publicPage
      .getByText("رسالة تجريبية محفوظة من المحرر البصري", { exact: true })
      .count(),
    1
  );
  checks.push(
    "Actual-page preview, inline mission edit, unsaved navigation warning and public refresh"
  );
  await page
    .locator("[data-testid=visual-editor] aside")
    .getByRole("button", { name: "رسالتنا", exact: true })
    .click();
  await page
    .getByRole("button", { name: "تغيير صورة رسالتنا", exact: true })
    .click();
  modal = page.getByRole("dialog");
  await modal
    .getByLabel("رابط الصورة", { exact: true })
    .fill("/images/elwaseet-el-moatamad-logo.png");
  await modal
    .getByRole("button", { name: "اعتماد الصورة في المعاينة", exact: true })
    .click();
  await page
    .getByRole("button", { name: "حفظ التعديلات", exact: true })
    .click();
  await success(page);
  await publicPage.reload({ waitUntil: "networkidle" });
  assert.equal(
    await publicPage
      .locator("[data-cms-image=mission_image]")
      .getAttribute("src"),
    "/images/elwaseet-el-moatamad-logo.png"
  );
  await page.getByRole("button", { name: "Mobile", exact: true }).click();
  assert.equal(
    await page
      .locator("iframe")
      .evaluate(el => Math.round(el.getBoundingClientRect().width)),
    390
  );
  checks.push("Mission image saves to shared content; mobile preview works");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: directory + "/admin-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    ),
    true
  );
  assert.equal(errors.length, 0, JSON.stringify(errors));
  await writeFile(
    directory + "/results.json",
    JSON.stringify(
      {
        origin,
        provider: "simulated Auth and isolated content repository",
        productionDataModified: false,
        checks,
        errors,
      },
      null,
      2
    )
  );
  console.log(JSON.stringify({ directory, checks }));
} catch (e) {
  if (browser) {
    const p = browser.contexts()[0]?.pages()[0];
    if (p)
      await p
        .screenshot({ path: directory + "/failure.png", fullPage: true })
        .catch(() => {});
  }
  console.error({ directory, serverOutput: output });
  throw e;
} finally {
  await browser?.close();
  child.kill();
}
