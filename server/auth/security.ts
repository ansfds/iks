import { TRPCError } from '@trpc/server';

export function requestOrigin(request: Request) {
  const url = new URL(request.url);
  // Vercel terminates HTTPS before the function. Its generated deployment host is trusted,
  // but arbitrary forwarded-host/origin headers are never used as the expected origin.
  if (process.env.VERCEL === '1') url.protocol = 'https:';
  return url.origin;
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const expected = requestOrigin(request);
  const fetchSite = request.headers.get('sec-fetch-site');
  if (!origin || origin !== expected || (fetchSite && fetchSite !== 'same-origin') ||
      request.headers.get('x-admin-request') !== '1' ||
      !/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'تعذر التحقق من أمان الطلب. حدّث الصفحة وأعد المحاولة.' });
  }
}

export function cookieSettings(request: Request) {
  const secure = requestOrigin(request).startsWith('https:');
  return { name: secure ? '__Host-elwaseet_admin' : 'elwaseet_admin', secure };
}

export function isAdminPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}
