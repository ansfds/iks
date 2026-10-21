import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright-core';

// Locked-preview verification only: no login bypass, CMS save, Git push or deployment mutation.
// Vercel protection remains enabled; use the automation credential provisioned by `vercel curl`.
const projectId = 'prj_x7OyV8frk1Nlr7ccRPEnczAzvKnd';
const teamId = 'team_VRkAxWqlSsvV8pEFVqodVKxC';
const branch = 'experiment/git-backed-cms';
const stableHost = 'iks-git-experiment-git-backed-cms-bk201s-projects-ecc0efd4.vercel.app';
const productionDeploymentId = 'dpl_EMwT7uKwfhZg4ptopX3ntobdJzvC';
const checks = [];
let browser;
try {
  const deploymentId = process.argv[2];
  assert.match(deploymentId || '', /^dpl_[a-zA-Z0-9]+$/, 'Provide the verified Preview deployment ID');
  const linked = JSON.parse(await readFile('.vercel/project.json', 'utf8'));
  assert.equal(linked.projectId, projectId);
  assert.equal(linked.orgId, teamId);
  let token = process.env.VERCEL_TOKEN;
  if (!token) {
    const directory = process.platform === 'win32'
      ? path.join(process.env.APPDATA, 'com.vercel.cli', 'Data')
      : path.join(process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share'), 'com.vercel.cli');
    token = JSON.parse(await readFile(path.join(directory, 'auth.json'), 'utf8')).token;
  }
  async function api(endpoint) {
    const response = await fetch(`https://api.vercel.com${endpoint}?teamId=${teamId}`, {
      headers: { authorization: `Bearer ${token}` }, redirect: 'error', signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`Vercel metadata access failed (${response.status})`);
    return response.json();
  }
  const [project, deployment, alias, production] = await Promise.all([
    api(`/v9/projects/${projectId}`), api(`/v13/deployments/${deploymentId}`),
    api(`/v4/aliases/${stableHost}`), api('/v4/aliases/iks-pearl.vercel.app'),
  ]);
  assert.equal(project.link?.org, 'ansfds');
  assert.equal(project.link?.repo, 'iks');
  assert.equal(project.link?.productionBranch, 'main');
  assert.equal(deployment.projectId, projectId);
  assert.notEqual(deployment.target, 'production');
  assert.equal(deployment.readyState, 'READY');
  assert.equal(deployment.meta?.githubCommitRef, branch);
  assert.equal(deployment.meta?.githubCommitOrg, 'ansfds');
  assert.equal(deployment.meta?.githubCommitRepo, 'iks');
  assert.equal(alias.projectId, projectId);
  assert.equal(alias.deploymentId || alias.deployment?.id, deploymentId, 'Stable Preview alias must point to the tested deployment');
  assert.equal(production.deploymentId || production.deployment?.id, productionDeploymentId, 'Production alias changed; stop for review');
  checks.push('Verified existing project, repository, Preview source branch and unchanged Production alias');
  const bypass = Object.entries(project.protectionBypass || {}).find(([, value]) => value.scope === 'automation-bypass')?.[0];
  assert.ok(bypass, 'Run vercel curl on Preview first; do not disable deployment protection');
  const origin = `https://${stableHost}`;
  async function request(route, body) {
    // Authentication headers are sent only to this verified Preview host, never to external images.
    const response = await fetch(origin + route, {
      method: body ? 'POST' : 'GET', redirect: 'manual', signal: AbortSignal.timeout(30000),
      headers: { 'x-vercel-protection-bypass': bypass, ...(body ? { origin, 'x-admin-request': '1', 'content-type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify({ json: body }) } : {}),
    });
    return response;
  }
  for (const route of ['/', '/transfers', '/gift-cards', '/gift-cards/playstation', '/gift-cards/xbox', '/gift-cards/shein', '/contact', '/login']) {
    assert.equal((await request(route)).status, 200, route);
    checks.push(`GET ${route}: 200`);
  }
  for (const route of ['/admin', '/admin/settings', '/admin/']) {
    const response = await request(route);
    assert.equal(response.status, 302, route);
    assert.equal(response.headers.get('location'), '/login');
    assert.match(response.headers.get('cache-control') || '', /no-store/);
    checks.push(`GET ${route}: protected redirect to /login`);
  }
  const rpc = name => '/api/trpc/' + name;
  for (const name of ['giftCards.list', 'finance.overview', 'siteContent.public']) {
    const response = await request(rpc(name));
    assert.equal(response.status, 200, name);
    const value = await response.text();
    assert.ok(!/CMS_GITHUB_TOKEN|CMS_VERCEL_TOKEN|ADMIN_SESSION_SECRET|ADMIN_PASSWORD_HASH|github_pat_|ghp_/.test(value));
    if (name === 'giftCards.list') assert.equal(JSON.parse(value).result.data.json.length, 9);
    checks.push(`Public API ${name}: 200, no secret references`);
  }
  for (const name of ['cms.snapshot', 'finance.admin.dashboard', 'contact.stats']) {
    assert.equal((await request(rpc(name))).status, 401, name);
    checks.push(`Private API ${name}: 401`);
  }
  const denied = await request(rpc('finance.admin.bankAccounts.delete'), { id: 1 });
  assert.equal(denied.status, 401);
  checks.push('Unauthenticated bank delete: 401, no write');
  const legacy = await request(rpc('contact.submit'), {
    studentName: 'Preview QA', parentName: 'Preview QA', email: 'preview-qa@example.invalid', message: 'Availability check; must not be stored in public Git',
  });
  assert.equal(legacy.status, 503);
  assert.match(await legacy.text(), /SERVICE_UNAVAILABLE/);
  checks.push('Legacy contact submission: explicit 503, never reports saved');
  const challenge = await (await request(rpc('auth.challenge'))).json();
  assert.equal(challenge.result.data.json.required, true);
  checks.push('Turnstile required on hosted Preview');
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route('**/*', async route => {
    const request = route.request();
    if (new URL(request.url()).hostname === stableHost) return route.continue({ headers: { ...request.headers(), 'x-vercel-protection-bypass': bypass } });
    return route.continue();
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.name));
  await page.goto(origin + '/admin');
  await page.waitForURL('**/login');
  await page.locator('#admin-username').waitFor();
  await page.reload();
  await page.locator('#admin-password').waitFor();
  await page.screenshot({ path: '.cache/hosted-preview-login.png', fullPage: true });
  checks.push('Browser: /admin redirect and /login reload preserve login screen');
  for (const route of ['/transfers', '/gift-cards', '/gift-cards/playstation', '/contact']) {
    await page.goto(origin + route);
    await page.locator('main').first().waitFor();
    await page.reload();
    await page.locator('main').first().waitFor();
    assert.ok((await page.locator('body').innerText()).length > 100);
    checks.push(`Browser: ${route} renders after direct navigation and reload`);
  }
  await page.screenshot({ path: '.cache/hosted-preview-contact.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin + '/login');
  await page.locator('#admin-password').waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: '.cache/hosted-preview-login-mobile.png', fullPage: true });
  assert.deepEqual(errors, []);
  checks.push('Browser: mobile 390px has no horizontal overflow; no JavaScript page errors');
  const baseline = JSON.parse(await readFile('backups/pre-preview-production.json', 'utf8'));
  const publicResponse = await fetch('https://iks-pearl.vercel.app/', { redirect: 'error' });
  assert.equal(publicResponse.status, 200);
  assert.equal(createHash('sha256').update(await publicResponse.text()).digest('hex'), baseline.htmlSha256);
  checks.push('Official Production homepage HTML SHA256 matches pre-Preview backup');
  const report = { checkedAt: new Date().toISOString(), passed: true, projectId, deploymentId, commit: deployment.meta.githubCommitSha, branch, url: origin, productionDeploymentId, checks, notTested: ['Real admin login: user credentials and Turnstile setup pending', 'CMS save, GitHub commit, subsequent content deployment: writes intentionally locked'] };
  await writeFile('.cache/hosted-preview-results.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  // Never print raw responses, request headers, API objects, secret values or stack traces.
  console.error('Hosted Preview verification failed:', error.code || error.name, error instanceof assert.AssertionError ? error.message.slice(0, 250) : 'Inspect the failed check locally; no credential data logged');
  process.exitCode = 1;
} finally {
  await browser?.close();
}
