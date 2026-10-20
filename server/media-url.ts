import { z } from 'zod';

export function safeMediaUrl(value: string) {
  if (/^\/images\/[a-zA-Z0-9_./-]+$/.test(value) && !value.includes('..') && !value.includes('//')) return true;
  if (['/favicon.svg', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png'].includes(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password &&
      !/^(localhost|127(?:\.\d+){3}|0\.0\.0\.0|\[::1\])$/i.test(url.hostname) && !url.hostname.endsWith('.localhost');
  } catch { return false; }
}
export function safeNavigationUrl(value: string) {
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') && !Array.from(value).some(char => char.charCodeAt(0) <= 32)) return true;
  return value.startsWith('https://') && safeMediaUrl(value);
}
export const imageUrlInput = z.string().trim().max(500).refine(safeMediaUrl, 'استخدم رابط صورة HTTPS دائمًا أو صورة من /images/.');
export const optionalImageUrlInput = z.preprocess(value => value === '' || value === undefined ? null : value, imageUrlInput.nullable()).optional();
export const optionalNavigationInput = z.preprocess(value => value === '' || value === undefined ? null : value,
  z.string().trim().max(500).refine(safeNavigationUrl, 'رابط الخدمة غير صالح.').nullable()).optional();
