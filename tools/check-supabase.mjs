import { config } from 'dotenv';
import { build } from 'esbuild';

config({ path: ['.env.local', '.env'], quiet: true });
try {
  const compiled = await build({ entryPoints: ['server/supabase/config.ts'], bundle: true, write: false, platform: 'node', format: 'esm', logLevel: 'silent' });
  const { supabaseConfig } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  supabaseConfig();
  console.log('SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and SUPABASE_ADMIN_USER_IDS: valid configuration format. This does not verify an Admin login.');
} catch {
  console.error('Supabase configuration is incomplete or invalid. Check .env.example; values are never printed.');
  process.exitCode = 1;
}
