import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import app from './boot';
import { appRouter } from './router';
import { authenticateRequest } from './auth/service';
import { adminPageResponse } from './auth/page-guard';
import { handleVercelRequest } from './vercel';
import { supabaseConfig } from './supabase/config';
import { bundledSnapshot } from './cms/store';
import { encodeTables } from './supabase/content';

const adminId = '11111111-1111-4111-8111-111111111111';
const otherId = '22222222-2222-4222-8222-222222222222';
const origin = 'https://app.example';
const project = 'https://unit-test.supabase.co';
const key = 'sb_publishable_unit_test_only';
const email = 'owner@example.test';
const password = 'unit-only-password-value';
let id: string;
let calls: { path: string; method: string; scope: string | null }[];
let token: string;
let userUnavailable: boolean;
let wrongPassword: boolean;
const jwt = (uid: string, exp: number) => [
  Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
  Buffer.from(JSON.stringify({ sub: uid, exp, role: 'authenticated', aud: 'authenticated' })).toString('base64url'),
  'unit-test-signature',
].join('.');
const user = () => ({ id, email, aud: 'authenticated', role: 'authenticated', app_metadata: {},
  user_metadata: { role: 'admin', is_admin: true }, created_at: '2026-01-01T00:00:00Z' });
function session() {
  const expires = Math.floor(Date.now() / 1000) + 3600;
  token = jwt(id, expires);
  return { access_token: token, refresh_token: 'unit-refresh-token', token_type: 'bearer', expires_in: 3600, expires_at: expires, user: user() };
}
async function rpc(path: string, input?: unknown, cookie = '', method = 'POST', requestOrigin = origin) {
  const url = new URL(origin + '/api/trpc/' + path);
  if (method === 'GET') url.searchParams.set('input', JSON.stringify({ json: input ?? null }));
  return app.request(new Request(url, { method,
    headers: { origin: requestOrigin, cookie, 'content-type': 'application/json', 'x-admin-request': '1' },
    ...(method === 'POST' ? { body: JSON.stringify({ json: input ?? null }) } : {}),
  }));
}
const cookieFrom = (response: Response) => response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
async function signIn() {
  const response = await rpc('auth.login', { email, password });
  expect(response.status).toBe(200);
  return response;
}

beforeEach(() => {
  id = adminId; calls = []; userUnavailable = false; wrongPassword = false;
  vi.stubEnv('SUPABASE_URL', project);
  vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', key);
  vi.stubEnv('SUPABASE_ADMIN_USER_IDS', adminId);
  vi.stubEnv('CMS_GITHUB_TOKEN', '');
  vi.stubEnv('VERCEL', '0');
  vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input, init) => {
    const url = new URL(String(input));
    expect(url.origin).toBe(project);
    const headers = new Headers(init?.headers);
    expect(headers.get('apikey')).toBe(key);
    calls.push({ path: url.pathname, method: init?.method || 'GET', scope: url.searchParams.get('scope') });
    if (url.pathname === '/auth/v1/token') {
      if (wrongPassword) return Response.json({ code: 'invalid_credentials', msg: 'private upstream detail' }, { status: 400 });
      const body = JSON.parse(String(init?.body));
      if (url.searchParams.get('grant_type') === 'password') expect(body).toMatchObject({ email, password });
      else expect(body.refresh_token).toBe('unit-refresh-token');
      return Response.json(session());
    }
    if (url.pathname === '/auth/v1/user') {
      if (userUnavailable) return Response.json({ code: 'unexpected_failure', msg: 'PRIVATE_UPSTREAM_VALUE' }, { status: 500 });
      if (headers.get('authorization') !== 'Bearer ' + token) return Response.json({ code: 'bad_jwt', msg: 'Invalid JWT' }, { status: 401 });
      return Response.json(user());
    }
    if (url.pathname === '/auth/v1/logout') return new Response(null, { status: 204 });
    if (url.pathname === '/rest/v1/rpc/read_content_tables') {
      const requested = JSON.parse(String(init?.body)).p_tables as string[];
      const tables = {...encodeTables(bundledSnapshot().document),cms_state:[{id:1,revision:1,next_ids:bundledSnapshot().document.nextIds,migration_verified:true,last_operation:''}],activity_logs:[]};
      return Response.json(Object.fromEntries(requested.map(t=>[t,tables[t as keyof typeof tables]])));
    }
    throw new Error('Unexpected provider operation');
  }));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('Supabase Auth at the HTTP boundary (provider responses simulated)', () => {
  it('issues secure HttpOnly cookies but returns no tokens in JSON', async () => {
    const response = await signIn();
    const cookies = response.headers.getSetCookie();
    expect(cookies.length).toBeGreaterThan(0);
    for (const cookie of cookies) {
      expect(cookie).toContain('__Host-elwaseet_supabase');
      expect(cookie).toContain('HttpOnly'); expect(cookie).toContain('Secure');
      expect(cookie).not.toContain('Domain=');
    }
    expect(response.headers.get('cache-control')).toContain('no-store');
    const text = await response.text();
    expect(text).toContain(adminId);
    expect(text).not.toContain(token); expect(text).not.toContain('unit-refresh-token'); expect(text).not.toContain(password);
    const me = await rpc('auth.me', undefined, cookieFrom(response), 'GET');
    expect(me.status).toBe(200);
    expect(await me.text()).toContain(adminId);
    expect(calls.some(call => call.path === '/auth/v1/user')).toBe(true);
  });
  it('denies an ordinary Supabase user despite forged admin user_metadata', async () => {
    id = otherId;
    const response = await rpc('auth.login', { email, password });
    expect(response.status).toBe(403);
    expect(response.headers.getSetCookie()).toHaveLength(0);
    expect(calls.some(call => call.path === '/auth/v1/logout' && call.scope === 'local')).toBe(true);
  });
  it('rechecks the current server allowlist on every authenticated request', async () => {
    const response = await signIn();
    vi.stubEnv('SUPABASE_ADMIN_USER_IDS', otherId);
    const me = await rpc('auth.me', undefined, cookieFrom(response), 'GET');
    expect(me.status).toBe(403);
    const page = await adminPageResponse(new Request(origin + '/admin', { headers: { cookie: cookieFrom(response) } }));
    expect(page?.status).toBe(403);
  });
  it('sanitizes invalid credentials without a cookie or upstream messages', async () => {
    wrongPassword = true;
    const response = await rpc('auth.login', { email, password });
    expect(response.status).toBe(401);
    expect(response.headers.getSetCookie()).toHaveLength(0);
    expect(await response.text()).not.toContain('private upstream detail');
  });
  it('rejects legacy local credentials and forged session cookies', async () => {
    expect(await authenticateRequest(new Request(origin + '/admin', { headers: { cookie: 'elwaseet_admin=legacy-token' } }))).toBeNull();
    const response = await rpc('auth.me', undefined, '__Host-elwaseet_supabase=not-a-session', 'GET');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ result: { data: { json: null } } });
  });
  it('fails closed during Auth outages while public APIs stay available', async () => {
    const response = await signIn();
    userUnavailable = true;
    const cookie = cookieFrom(response);
    expect((await rpc('auth.me', undefined, cookie, 'GET')).status).toBe(503);
    expect((await adminPageResponse(new Request(origin + '/admin', { headers: { cookie } })))?.status).toBe(503);
    const publicResponse = await rpc('giftCards.list', undefined, cookie, 'GET');
    expect(publicResponse.status).toBe(200);
    expect(await publicResponse.text()).not.toContain('PRIVATE_UPSTREAM_VALUE');
  });
  it('refreshes expired tokens and propagates cookies through the page guard', async () => {
    const response = await signIn();
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(Date.now() + 3601000);
    const headers = new Headers();
    expect(await adminPageResponse(new Request(origin + '/admin', { headers: { cookie: cookieFrom(response) } }), headers)).toBeNull();
    expect(headers.getSetCookie().length).toBeGreaterThan(0);
    expect(headers.get('cache-control')).toContain('no-store');
    expect(calls.filter(call => call.path === '/auth/v1/token')).toHaveLength(2);
  });
  it('revokes only this Supabase session on logout', async () => {
    const response = await signIn();
    const loggedOut = await rpc('auth.logout', undefined, cookieFrom(response));
    expect(loggedOut.status).toBe(200);
    expect(loggedOut.headers.getSetCookie().some(cookie => cookie.includes('Max-Age=0'))).toBe(true);
    expect(calls.some(call => call.path === '/auth/v1/logout' && call.scope === 'local')).toBe(true);
  });
  it('returns refreshed cookies from authenticated HTTP API requests', async () => {
    const response = await signIn();
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(Date.now() + 3601000);
    const me = await rpc('auth.me', undefined, cookieFrom(response), 'GET');
    expect(me.status).toBe(200);
    expect(me.headers.getSetCookie().length).toBeGreaterThan(0);
    expect(me.headers.get('cache-control')).toContain('no-store');
  });
  it('reads the Admin catalog from Supabase on Vercel without GitHub credentials', async () => {
    const response = await signIn();
    vi.stubEnv('VERCEL', '1');
    const headers = { cookie: cookieFrom(response), 'x-cms-editor': '1' };
    const result = await app.request(new Request(origin + '/api/trpc/giftCards.admin.list', { headers }));
    expect(result.status).toBe(200);
    expect(calls.some(call => call.path === '/rest/v1/rpc/read_content_tables')).toBe(true);
  });
  it('rejects secret/service_role and absent allowlists without exposing configuration', async () => {
    for (const value of ['sb_secret_DO_NOT_EXPOSE', 'eyJ-service-role-token', '']) {
      vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', value);
      expect(() => supabaseConfig()).toThrow('SUPABASE_NOT_CONFIGURED');
      const response = await rpc('auth.login', { email, password });
      expect(response.status).toBe(503);
      expect(await response.text()).not.toContain('DO_NOT_EXPOSE');
    }
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', key); vi.stubEnv('SUPABASE_ADMIN_USER_IDS', '');
    expect((await rpc('auth.login', { email, password })).status).toBe(503);
  });
  it('keeps login/logout protected against cross-origin requests', async () => {
    for (const route of ['auth.login', 'auth.logout'])
      expect((await rpc(route, { email, password }, '', 'POST', 'https://evil.example')).status).toBe(403);
    expect(calls).toHaveLength(0);
  });
  it('protects nested admin pages through the real Vercel rewrite handler', async () => {
    for (const route of ['/admin', '/admin/settings', '/admin/']) {
      const response = await handleVercelRequest(new Request(origin + '/api/index?__path=' + route));
      expect(response.status).toBe(302); expect(response.headers.get('location')).toBe('/login');
    }
    expect(calls).toHaveLength(0);
  });
  it('denies every private API without signing in', async () => {
    let count = 0;
    for (const [path, procedure] of Object.entries(appRouter._def.procedures)) {
      if (!/^(cms\.|admin\.|finance\.admin\.|giftCards\.admin\.|siteContent\.admin\.|contact\.(?!submit$)|gallery\.(?!list$)|news\.(?!list$|getById$)|testimonial\.(?!list$))/.test(path)) continue;
      const method = (procedure as unknown as { _def: { type: string } })._def.type === 'mutation' ? 'POST' : 'GET';
      expect((await rpc(path, {}, '', method)).status, path).toBe(401); count++;
    }
    expect(count).toBeGreaterThan(50); expect(calls).toHaveLength(0);
  });
  it('reports unavailable data when Supabase configuration is absent without a stale fallback', async () => {
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', '');
    for (const route of ['giftCards.list', 'finance.overview', 'siteContent.public']) expect((await rpc(route, undefined, '', 'GET')).status).toBe(503);
    const status = await rpc('auth.configuration', undefined, '', 'GET');
    expect(await status.json()).toMatchObject({ result: { data: { json: { provider: 'supabase', configured: false } } } });
    expect(calls).toHaveLength(0);
  });
});
