import { authenticateRequest } from './service';
import { isAdminPath } from './security';

export async function adminPageResponse(request: Request): Promise<Response | null> {
  if (!isAdminPath(new URL(request.url).pathname)) return null;
  try {
    if (await authenticateRequest(request)) return null;
    return new Response(null, { status: 302, headers: { Location: '/login', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
  } catch {
    return new Response('تعذر التحقق من الجلسة. أعد المحاولة لاحقًا.', {
      status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
    });
  }
}
