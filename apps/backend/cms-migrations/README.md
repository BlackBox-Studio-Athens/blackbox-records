# CMS application migrations

These migrations belong to application-owned tables in `CMS_DB`. They are separate from EmDash's core migration manifest and from commerce's Prisma/D1 migrations. Never apply them to `COMMERCE_DB`.

Check pending Local migrations with `pnpm --filter @blackbox/backend cms:application-migrations:local`. Add `--apply` to apply them through Wrangler's native Local migration runner. The default check reads existing history without creating application tables. History lives in `_blackbox_app_migrations`, separate from EmDash core migrations.

The command uses the canonical Local CMS database and `.wrangler/state`; `--persist-to <directory>` selects isolated Local state for testing. It accepts no remote or environment switch. The compiled CMS smoke applies and replays the migration against temporary Local state, then verifies publication creation and status reads. No hosted migration, automatic local-stack migration, or request-time bootstrap is configured.
