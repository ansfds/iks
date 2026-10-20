import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile, rename } from 'node:fs/promises';
import { createInterface, emitKeypressEvents } from 'node:readline';

import { hashPassword, isPasswordHash } from '../server/auth/password.mjs';



async function ask(prompt) {
  const input = createInterface({ input: process.stdin, output: process.stdout });
  try { return await new Promise(resolve => input.question(prompt, resolve)); }
  finally { input.close(); }
}

async function hidden(prompt) {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) throw new Error('استخدم طرفية تفاعلية لإدخال كلمة المرور بأمان.');
  process.stdout.write(prompt);
  emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  let value = '';
  return new Promise((resolve, reject) => {
    function done(error) {
      process.stdin.removeListener('keypress', keypress);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
      if (error) reject(error); else resolve(value);
    }
    function keypress(text, key = {}) {
      if (key.ctrl && key.name === 'c') return done(new Error('أُلغي الإعداد.'));
      if (key.name === 'return' || key.name === 'enter') return done();
      if (key.name === 'backspace') value = Array.from(value).slice(0, -1).join('');
      else if (text && !key.ctrl && !key.meta && !/[\u0000-\u001f\u007f]/.test(text)) value += text;
    }
    process.stdin.on('keypress', keypress);
  });
}

async function passwordHash() {
  const password = await hidden('كلمة المرور (14 حرفًا على الأقل، الإدخال مخفي): ');
  if (password !== await hidden('أعد كتابة كلمة المرور: ')) throw new Error('كلمتا المرور غير متطابقتين.');
  return hashPassword(password);
}

async function setup() {
  let existing = '';
  try { existing = await readFile('.env', 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (process.env.ADMIN_PASSWORD_HASH) {
    if ((await ask('سيؤدي التحديث إلى إلغاء الجلسات القديمة. اكتب YES للمتابعة: ')).trim() !== 'YES') return;
  }
  const username = (await ask('اسم مستخدم المدير: ')).trim();
  if (!/^[\p{L}\p{N}_.-]{3,100}$/u.test(username)) throw new Error('اسم المستخدم: 3–100 حرف أو رقم أو _ أو . أو - دون مسافات.');
  const hash = await passwordHash();
  const keys = { ADMIN_USERNAME: username, ADMIN_PASSWORD_HASH: hash, ADMIN_SESSION_SECRET: randomBytes(48).toString('base64url'), ADMIN_SESSION_HOURS: '0.25' };
  // Preserve unrelated server configuration exactly. Remove obsolete OAuth configuration.
  const content = existing.split(/\r?\n/).filter(line => !/^(ADMIN_(USERNAME|PASSWORD_HASH|SESSION_SECRET|SESSION_HOURS)|APP_ID|APP_SECRET|OWNER_UNION_ID|KIMI_AUTH_URL|KIMI_OPEN_URL|VITE_KIMI_AUTH_URL|VITE_APP_ID)=/.test(line)).join('\n');
  const next = `${content.trimEnd()}\n\n# Single administrator (server only)\n${Object.entries(keys).map(([key, value]) => `${key}=${JSON.stringify(value)}`).join('\n')}\n`;
  const temporary = `.env.${randomBytes(8).toString('hex')}.local`;
  await writeFile(temporary, next, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
  await rename(temporary, '.env');
  console.log('حُفظ اسم المستخدم وHash والسر داخل .env فقط. لم تُحفظ كلمة المرور.');
  console.log('No database initialization is needed. Configure the CMS server environment separately.');
}

try {
  const action = process.argv[2];
  if (action === 'setup') await setup();
  else if (action === 'hash') console.log(await passwordHash());

  else if (action === 'check') {
    if (!process.env.ADMIN_USERNAME?.trim() || !isPasswordHash(process.env.ADMIN_PASSWORD_HASH || '') || Buffer.byteLength(process.env.ADMIN_SESSION_SECRET || '') < 32 || !(Number(process.env.ADMIN_SESSION_HOURS || '0.25') >= 0.083333333 && Number(process.env.ADMIN_SESSION_HOURS || '0.25') <= 0.25)) throw new Error('الإعداد غير مكتمل. راجع .env.example.');
    console.log('متغيرات المصادقة الأساسية موجودة. لا يحتاج هذا الفرع قاعدة بيانات.');
  } else throw new Error('Use npm run auth:setup, auth:hash, or auth:check.');
} catch (error) {
  console.error(error.code || error.message);
  process.exitCode = 1;
}
