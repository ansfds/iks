import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { parse, serialize } from 'cookie';
import { supabaseConfig, supabaseConnection } from './config';
import { requestOrigin } from '../auth/security';

export function authCookieName(request: Request) {
  return requestOrigin(request).startsWith('https:') ? '__Host-elwaseet_supabase' : 'elwaseet_supabase';
}

export function hasAuthCookie(request: Request) {
  const name = authCookieName(request);
  return Object.keys(parse(request.headers.get('cookie') || '')).some(key => key === name || key.startsWith(name + '.'));
}

// A new instance per request. Sessions must never be shared across Vercel requests.
export function requestSupabase(request: Request, responseHeaders: Headers) {
  const config = supabaseConfig();
  const jar = new Map(Object.entries(parse(request.headers.get('cookie') || '')).filter((entry): entry is [string, string] => entry[1] !== undefined));
  const secure = requestOrigin(request).startsWith('https:');
  return createServerClient(config.url, config.publishableKey, {
    global: { fetch: async (input, init) => {
      try { return await fetch(input, { ...init, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000) }); }
      catch { throw new TypeError('Supabase network unavailable'); }
    } },
    cookieOptions: { name: authCookieName(request), httpOnly: true, secure, sameSite: 'lax', path: '/' },
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll(cookies, cacheHeaders) {
        for (const { name, value, options } of cookies) {
          jar.set(name, value);
          responseHeaders.append('set-cookie', serialize(name, value, { ...options, httpOnly: true, secure, sameSite: 'lax', path: '/', domain: undefined }));
        }
        for (const [key, value] of Object.entries(cacheHeaders)) responseHeaders.set(key, value);
        responseHeaders.set('cache-control', 'private, no-store');
      },
    },
  });
}

// Shared project/key configuration for future public table reads; no admin session.
export function publicSupabase() {
  const { url, publishableKey } = supabaseConnection();
  return createClient(url, publishableKey, {
    global: { fetch: async (input,init) => {
      try { return await fetch(input,{...init,cache:'no-store',signal:AbortSignal.timeout(15000)}); }
      catch { throw new TypeError('Supabase network unavailable'); }
    } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function appendAuthHeaders(target: Headers, source: Headers) {
  for (const cookie of source.getSetCookie()) target.append('set-cookie', cookie);
  source.forEach((value, key) => { if (key !== 'set-cookie') target.set(key, value); });
}
