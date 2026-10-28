import { z } from 'zod';

const projectUrl = z.string().url().refine(value => {
  const url = new URL(value);
  return url.protocol === 'https:' && !url.username && !url.password &&
    url.pathname === '/' && !url.search && !url.hash;
});
const connection = z.object({
  url: projectUrl,
  publishableKey: z.string().regex(/^sb_publishable_[A-Za-z0-9_-]{10,}$/),
});

export function supabaseConnection() {
  const result = connection.safeParse({
    url: process.env.SUPABASE_URL?.trim(),
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY?.trim(),
  });
  // Never put Zod's input values (including an accidentally pasted secret) in errors.
  if (!result.success) throw new Error('SUPABASE_NOT_CONFIGURED');
  return result.data;
}

export function supabaseConfig() {
  const adminUserIds = z.array(z.uuid()).min(1).max(20).safeParse(
    process.env.SUPABASE_ADMIN_USER_IDS?.split(',').map(value => value.trim().toLowerCase()).filter(Boolean),
  );
  if (!adminUserIds.success) throw new Error('SUPABASE_NOT_CONFIGURED');
  return { ...supabaseConnection(), adminUserIds: adminUserIds.data };
}

export function supabaseConfigured() {
  try { supabaseConfig(); return true; } catch { return false; }
}
