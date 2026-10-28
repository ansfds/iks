# Database sources

`schema.ts` describes PostgreSQL tables. Runtime `getDb()` uses the Supabase Data API and RLS; `DATABASE_URL` is only needed if an operator deliberately invokes Drizzle tooling. Production does not run schema pushes at startup or build time.

`supabase/migrations/` contains the applied PostgreSQL migration history. SQL under `db/supabase-content.sql` and `db/refine-content-read-policies.sql` is the reviewed source for those migrations. Do not reapply a CREATE migration to the populated project.

`legacy/mysql-schema.ts`, historical `db/migrations/`, source worktrees and backups are retained. They are not PostgreSQL and must never be applied to Supabase. Legacy users and password/session tables are replaced by Supabase Auth; they were not imported as public content.

The import generator reads the reviewed `content/site.json` and the existing local backup's historical activity record, writes SQL only under ignored `.cache`, and verifies counts and every typed field before setting `cms_state.migration_verified`. Once verified, rerunning it skips import rather than overwriting newer Admin edits. Neither build nor startup seeds data.
