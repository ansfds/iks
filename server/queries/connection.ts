import type { SupabaseClient } from '@supabase/supabase-js';
import { publicSupabase, requestSupabase } from '../supabase/client';

// Production persistence uses PostgreSQL through Supabase's Data API. No MySQL
// connection, elevated key, or process-wide authenticated session is used.
export function getDb(request?: Request, headers = new Headers()): SupabaseClient {
  return request ? requestSupabase(request, headers) : publicSupabase();
}
