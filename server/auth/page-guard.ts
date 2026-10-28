import { authenticateRequest } from './service';
import { isAdminPath } from './security';
import { TRPCError } from '@trpc/server';

export async function adminPageResponse(request: Request, responseHeaders = new Headers()): Promise<Response | null> {
  if (!isAdminPath(new URL(request.url).pathname)) return null;
  try {
    if (await authenticateRequest(request, responseHeaders)) return null;
    const headers = new Headers(responseHeaders);
    headers.set('location', '/login');
    headers.set('cache-control', 'private, no-store');
    headers.set('x-robots-tag', 'noindex, nofollow');
    return new Response(null, { status: 302, headers });
  } catch (error) {
    const forbidden = error instanceof TRPCError && error.code === 'FORBIDDEN';
    const headers = new Headers(responseHeaders);
    headers.set('content-type', 'text/plain; charset=utf-8');
    headers.set('cache-control', 'private, no-store');
    headers.set('x-robots-tag', 'noindex, nofollow');
    return new Response(forbidden ? 'غير مصرح لك بدخول لوحة الإدارة.' : 'تعذر التحقق من الجلسة. أعد المحاولة لاحقًا.', { status: forbidden ? 403 : 503, headers });
  }
}
