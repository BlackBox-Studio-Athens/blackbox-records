# CMS backup and recovery

CMS backups contain the complete D1 SQL export (including users, revisions and application publication records) and every media-bucket object with its metadata. They never read or restore `COMMERCE_DB`. JSON content export is not a substitute.

`apps/backend/scripts/cms-backup.mjs` stores immutable, checksum-addressed bytes in a separate private R2 bucket. It retains seven daily recovery points and the latest pre-upgrade point, sharing unchanged bytes. It publishes a recovery point only if database exports before and after media capture match and the media inventory remains unchanged. Concurrent editing makes capture fail; retry after editing stops. The initial recovery objective is at most 24 hours of editorial loss and manual same-day recovery.

## Local use

Run through the WebStorm terminal/run tooling:

```sh
node apps/backend/scripts/cms-backup.mjs --env local --backup-bucket blackbox-cms-backups-local
node apps/backend/scripts/cms-backup.mjs --env local --kind pre-upgrade --backup-bucket blackbox-cms-backups-local
```

Local commands use existing `apps/backend/.wrangler/state` persistence. They do not contact hosted storage. A capture is capped at 10,000 objects and 256 MiB by default; `--max-bytes` is an explicit reviewed override. The private backup bucket is not a Worker binding and must never receive a public domain or `r2.dev` access.

## Hosted daily capture

The committed `cms-backup.yml` workflow schedules daily capture at 02:30 UTC and supports manual pre-upgrade capture. It is disabled until repository variables `CMS_BACKUPS_ENABLED` and `CMS_BACKUP_BUDGET_REVIEWED` are both `true`.

Before enabling it:

1. Rehearse capture and isolated restore locally. Follow [the Free-tier operating rule](cloudflare-free-tier.md), measure current account usage and allow room for normal traffic.
2. Provision separate private buckets named `blackbox-cms-backups-uat` and `blackbox-cms-backups-prd`. Set `UAT_CMS_BACKUP_BUCKET`, `PRD_CMS_BACKUP_BUCKET`, `CLOUDFLARE_ACCOUNT_ID`, and an explicitly budgeted `CMS_BACKUP_MAX_BYTES`.
3. Supply `CMS_BACKUP_API_TOKEN` through GitHub secrets with the permissions needed for CMS D1 export, source R2 reads and backup R2 writes. Do not give it commerce restore duties or expose it to browser builds.
4. Run one bounded manual pilot, inspect actual D1/R2 usage and retained bytes, then enable the daily job. Stop scheduling if quota headroom is lost. A configured flag is not itself usage evidence.

Each capture exports schema and data separately before and after media capture (four native exports), lists source media twice, reads each source object once, checks retained backup blobs and writes changed bytes. Retention also reads the kept manifests and deletes unreferenced backup objects. Budget those operations and failed attempts; there are no automatic inline retries. Seven points do not necessarily require seven full copies, but changed large media still needs measured storage headroom.

## Isolated recovery

Create an empty recovery database and bucket with names starting `blackbox-cms-recovery-`. Use their actual IDs; do not substitute a production ID under a different name. For example:

```sh
node apps/backend/scripts/cms-backup.mjs --env local --mode restore --backup-bucket blackbox-cms-backups-local --point YYYY-MM-DD-daily --recovery-database blackbox-cms-recovery-local --recovery-id RECOVERY_DATABASE_UUID --recovery-bucket blackbox-cms-recovery-local
```

Hosted commands additionally require `--hosted-budget-reviewed` after the quota review. The command rejects configured application database IDs, non-empty databases and non-empty destination buckets. It verifies every checksum before restoration, restores media, then restores database rows with bound statements in one transaction. A failed restore leaves only the isolated recovery resources incomplete; recreate those empty resources before retrying.

Before any cutover, run the compatible CMS build against recovery bindings and compare users, content, references, revisions, image checksums and public rendering. Preserve the original environment until that acceptance passes. Recovery never authorizes PRD cutover, payment launch or commerce rollback. Do not roll back to an obsolete compiled-catalog Worker after runtime items exist.

The implementation uses [Wrangler's native D1 exports](https://developers.cloudflare.com/workers/wrangler/commands/d1/) and Node's built-in SQLite reader. Each database capture pairs native schema and data exports. Recovery creates tables before inserting data through bound D1 statements, avoiding both foreign-key ordering and D1's SQL-literal size limit. It installs triggers after the captured rows so restoration does not alter maintenance state; subsequent edits still run the restored triggers. Foreign keys remain enforced in the destination. The single recovery transaction is capped at 10,000 statements; larger sites need a reviewed dependency-aware batching strategy. Hosted bucket provisioning, schedule activation and the full recovery rehearsal remain explicit acceptance work until recorded evidence proves them.
