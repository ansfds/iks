import { TRPCError } from '@trpc/server';
import type { User } from '@supabase/supabase-js';
import { appendAuthHeaders, hasAuthCookie, requestSupabase } from '../supabase/client';
import { supabaseConfig } from '../supabase/config';

export type AdminIdentity = { id: number; name: string; role: 'admin'; supabaseUserId?: string };
const unavailable = () => new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'تسجيل الدخول غير متاح حاليًا. أعد المحاولة لاحقًا.' });
function client(request: Request, headers: Headers) {
  try { return requestSupabase(request, headers); } catch { throw unavailable(); }
}
function requireAdmin(user: User) {
  if (!supabaseConfig().adminUserIds.includes(user.id.toLowerCase()) || user.is_anonymous)
    throw new TRPCError({ code: 'FORBIDDEN', message: 'هذا الحساب غير مصرح له بدخول لوحة الإدارة.' });
}
function identity(user: User): AdminIdentity {
  // Legacy content author fields are numeric. Preserve them until schema migration;
  // authorization always uses the verified immutable Supabase UUID, never this ID.
  return { id: 1, supabaseUserId: user.id, name: user.email || 'المدير', role: 'admin' };
}

export async function login(request: Request, headers: Headers, email: string, password: string) {
  const pending = new Headers();
  const supabase = client(request, pending);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user || !data.session) {
    if (error && (!error.status || error.status >= 500)) throw unavailable();
    if (error?.status === 429) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'محاولات كثيرة. أعد المحاولة لاحقًا.' });
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
  }
  try { requireAdmin(data.user); }
  catch (error) {
    // Discard pending cookies; the denied account must never get an app session.
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    throw error;
  }
  appendAuthHeaders(headers, pending);
  return { user: identity(data.user), expiresAt: (data.session.expires_at || 0) * 1000 };
}

export async function authenticateRequest(request: Request, headers = new Headers()) {
  if (!hasAuthCookie(request)) return null;
  const supabase = client(request, headers);
  // getUser verifies the token with Auth. Never authorize cookie user_metadata or getSession().user.
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    if (!error.status || error.status >= 500) throw unavailable();
    return null;
  }
  if (!data.user) return null;
  requireAdmin(data.user);
  const session = await supabase.auth.getSession();
  return { user: identity(data.user), expiresAt: (session.data.session?.expires_at || 0) * 1000, supabase };
}

export async function logout(request: Request, headers: Headers) {
  if (!hasAuthCookie(request)) return { success: true };
  const pending = new Headers();
  const supabase = client(request, pending);
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw unavailable();
  appendAuthHeaders(headers, pending);
  return { success: true };
}
