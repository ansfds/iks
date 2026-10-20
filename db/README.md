# Historical MySQL schema

These schema/migration files are retained for reviewing the source mapping and recovery. They are NOT used at runtime or applied by the Git CMS build. The original database and full readiness tools remain intact in the separate local-app/upstream-review worktrees. Active content validation is in server/cms, with reviewed legacy column mappings in tools/legacy-content-columns.json. Never run schema push or seed commands against the source while evaluating this branch.
