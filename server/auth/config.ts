import { createHmac } from 'node:crypto';
import { isPasswordHash } from './password.mjs';

export function authConfig() {
  const username = process.env.ADMIN_USERNAME?.trim();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const secret = process.env.ADMIN_SESSION_SECRET;
  const sessionHours = Number(process.env.ADMIN_SESSION_HOURS || '0.25');
  if (!username || username.length > 100 || !passwordHash || !isPasswordHash(passwordHash) ||
      !secret || Buffer.byteLength(secret) < 32 || !Number.isFinite(sessionHours) ||
      sessionHours < 0.083333333 || sessionHours > 0.25) {
    throw new Error('ADMIN_AUTH_NOT_CONFIGURED');
  }
  const fingerprint = createHmac('sha256', secret)
    .update(JSON.stringify(['credentials-v2', username, passwordHash, 'site-admin:single', sessionHours]))
    .digest('hex');
  return { username, passwordHash, secret, fingerprint, sessionSeconds: Math.floor(sessionHours * 3600) };
}
