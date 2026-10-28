import app from "./boot";
import { isSeoRequest, seoResponse } from "./seo";
import { adminPageResponse } from "./auth/page-guard";
import { appendAuthHeaders } from './supabase/client';

export async function handleVercelRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  // Vercel rewrites explicitly carry the public pathname. Preserve tRPC batch
  // input and all other query parameters while removing this routing detail.
  const pathname = url.searchParams.get("__path") || url.pathname;
  if (!pathname.startsWith("/") || pathname.startsWith("//") || /[?#\\]/.test(pathname)) {
    return new Response("Invalid request path", { status: 400 });
  }
  url.pathname = pathname;
  url.searchParams.delete("__path");
  const forwarded = new Request(url, request);
  const authHeaders = new Headers();
  const guarded = await adminPageResponse(forwarded, authHeaders);
  if (guarded) return guarded;

  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
    return app.fetch(forwarded);
  }
  if ((request.method === "GET" || request.method === "HEAD") && isSeoRequest(url.pathname)) {
    const response = await seoResponse(url.pathname);
    appendAuthHeaders(response.headers, authHeaders);
    if (/^\/(admin|login)(\/|$)/.test(url.pathname)) {
      response.headers.set("Cache-Control", "no-store");
      response.headers.set("Content-Security-Policy", "frame-ancestors 'none'");
      response.headers.set("Referrer-Policy", "same-origin");
    }
    return request.method === "HEAD" ? new Response(null, response) : response;
  }
  return new Response("Not Found", { status: 404 });
}

// Vercel's Web Standard handler receives an actual Request for every method.
export default { fetch: handleVercelRequest };
