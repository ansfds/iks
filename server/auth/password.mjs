import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

// OWASP scrypt minimum: N=2^17, r=8, p=1; a fresh 128-bit salt per password.
const options = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
const derive = (password, salt) => new Promise((resolve, reject) => {
  scrypt(password, salt, 64, options, (error, key) => error ? reject(error) : resolve(key));
});

export function isPasswordHash(value) {
  return /^scrypt\$131072\$8\$1\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{86}$/.test(value);
}

export async function hashPassword(password) {
  if (password.length < 14 || Buffer.byteLength(password, 'utf8') > 1024) {
    throw new Error('استخدم كلمة مرور من 14 حرفًا على الأقل، ولا تتجاوز 1024 بايت.');
  }
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$131072$8$1$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

export async function verifyPassword(password, encoded) {
  if (!isPasswordHash(encoded) || Buffer.byteLength(password, 'utf8') > 1024) return false;
  const parts = encoded.split('$');
  const key = await derive(password, Buffer.from(parts[4], 'base64url'));
  return timingSafeEqual(key, Buffer.from(parts[5], 'base64url'));
}
