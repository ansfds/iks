# ELWASEET — Supabase content and administration

React/Vite + Hono/tRPC. Production: https://www.elwaseetel-moatamad.ly, repository `ansfds/iks`, branch `main`.

Supabase Auth, PostgreSQL content and Storage use the existing project `cqunbjasbbmmtaiawxhe`. Public browsing requires no login; `/admin` and all private procedures require the verified Admin UUID. There is no runtime MySQL connection or GitHub content writer.

- [Configuration and security](SUPABASE_SETUP_AR.md)
- [Migration inventory and verification](SUPABASE_MIGRATION_AR.md)
- [Current self-hosted share-image fix](OG_IMAGE_FIX_AR.md)
- PostgreSQL definitions: `db/schema.ts`; applied DDL/RLS/RPC history: `supabase/migrations/`.
- Historical MySQL schema: `db/legacy/mysql-schema.ts`. The source database, backups and `content/site.json` remain intact.

Copy `.env.example` to ignored `.env.local` and set the three Supabase variables. Run `npm ci`, `npm run dev`. The admin password is entered in the login page only. No secret/service role key, GitHub token, Vercel token or DATABASE_URL is required by the runtime.

Checks: `npm run check`, `npm run lint`, `npm test`, `npm run build`, `npm run verify:vercel-artifact`, `node tools/verify-browser-secrets.mjs`. `tools/verify-supabase-content.mjs` tests the actual browser against `VERIFY_ORIGIN` (default port 4175); authenticated editing requires the owner's login.

The `GIT_CMS_*` reports and old preview tools describe archived experiments. They are not the active deployment or persistence workflow. Saving content now commits a PostgreSQL transaction and is visible after Refresh without rebuilding Vercel.
