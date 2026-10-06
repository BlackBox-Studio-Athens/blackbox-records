# CMS backup and recovery

CMS backups contain the complete D1 schema/data capture (including users, revisions and application publication records) and every media-bucket object with its metadata. They never read or restore `COMMERCE_DB`. JSON content export is not a substitute.

`apps/backend/scripts/cms-backup.mjs` stores immutable, checksum-addressed bytes in a separate private R2 bucket. It retains seven daily recovery points and the latest pre-upgrade point, sharing unchanged bytes. Each point contains one transactional D1 snapshot and every media object referenced by that snapshot. The capture lists and reads media on both sides of the D1 snapshot, so content edits and uploads can continue while it runs; media added after the snapshot may be retained as unreferenced extras. A missing or changed object referenced by the snapshot prevents publication of the recovery point. The initial recovery objective is at most 24 hours of editorial loss and manual same-day recovery.

## Local use

Run through the WebStorm terminal/run tooling:

```sh
node apps/backend/scripts/cms-backup.mjs --env local --backup-bucket blackbox-cms-backups-local
node apps/backend/scripts/cms-backup.mjs --env local --kind pre-upgrade --backup-bucket blackbox-cms-backups-local
```

Local commands use existing `apps/backend/.wrangler/state` persistence. They do not contact hosted storage. A capture is capped at 10,000 objects and 256 MiB by default; `--max-bytes` is an explicit reviewed override. The private backup bucket is not a Worker binding and must never receive a public domain or `r2.dev` access.

## Hosted daily capture

The committed `cms-backup.yml` workflow schedules daily capture at 02:30 UTC and supports manual pre-upgrade capture. Both repository variables `CMS_BACKUPS_ENABLED` and `CMS_BACKUP_BUDGET_REVIEWED` were enabled on September 15 after the user approved the dedicated credential. Manual daily capture `34935186823` passed for both environments through this workflow: UAT captured 386 objects and 423,157,810 database/media bytes; PRD captured zero objects and its 23-byte empty database. Both wrote recovery point `2026-09-15-daily`, retaining the existing pre-upgrade points. The credential has no expiration and is stored only as `CMS_BACKUP_API_TOKEN`; no credential was committed.

The current hosted ceiling is 2 GiB (`CMS_BACKUP_MAX_BYTES` = `2147483648`) per environment capture, including SQL. The initial ceiling was 512 MiB (`536870912`). PRD media passed it on 2026-10-02, and every daily run from 2026-10-02 through 2026-10-06 failed with `Backup exceeds the byte budget`. The ceiling was raised on 2026-10-06. Dispatched run `37505027251` then passed for both environments: UAT point `2026-10-06-daily` captured 589 objects and 435,185,794 bytes; PRD captured 1,191 objects and 565,083,844 bytes. PRD's first attempt hit a transient R2 error and passed on one rerun. See [Free-tier storage budget](#free-tier-storage-budget) before raising the ceiling again.

The account dashboard review at activation recorded 995.38 MB R2 storage, 1.07k Class A and 5.28k Class B operations in the billing period, 120.92k D1 rows read and 15.17k written today, and 6,383/100,000 Worker requests today. The initial run budget was 10,000 D1 reads, no source D1 writes, 400 R2 Class A, 1,200 Class B and 1,500 Worker requests, using existing private buckets and a 512 MiB per-environment capture ceiling. The prior full capture/restore was the bounded pilot; during the pilot, a failure meant disabling `CMS_BACKUPS_ENABLED` before retrying. Daily failures now follow the rerun rule below. Evidence is `.codex-artifacts/emdash-m1/backup-schedule-budget.json`.

Before enabling it:

1. Rehearse capture and isolated restore locally. Follow [the Free-tier operating rule](cloudflare-free-tier.md), measure current account usage and allow room for normal traffic.
2. Provision separate private buckets named `blackbox-cms-backups-uat` and `blackbox-cms-backups-prd`. Set `UAT_CMS_BACKUP_BUCKET`, `PRD_CMS_BACKUP_BUCKET`, `CLOUDFLARE_ACCOUNT_ID`, and an explicitly budgeted `CMS_BACKUP_MAX_BYTES` (currently `2147483648`).
3. Supply `CMS_BACKUP_API_TOKEN` through GitHub secrets with the permissions needed for CMS D1 export, source R2 reads and backup R2 writes. Do not give it commerce restore duties or expose it to browser builds.
4. Run one bounded manual pilot, inspect actual D1/R2 usage and retained bytes, then enable the daily job. Stop scheduling if quota headroom is lost. A configured flag is not itself usage evidence.

Each run captures schema, data, and media storage keys in one bounded D1 batch, lists source media twice around that snapshot, and reads each unchanged object once. It checks that every media key in the D1 snapshot has a verified backup blob before publishing the manifest. Retention also reads the kept manifests and deletes unreferenced backup objects. Budget those operations and failed attempts; there are no automatic inline retries. A transient R2 5xx through the remote binding (for example `get: Unspecified error`) fails the run: rerun the failed job once, as on 2026-10-06, and investigate if it fails again. Seven points do not necessarily require seven full copies, but changed large media still needs measured storage headroom.

### Free-tier storage budget

`CMS_BACKUP_MAX_BYTES` is the deliberate Free-tier guard. It caps one environment's captured database plus media per run. Backups are checksum-deduplicated and retention deletes unreferenced blobs, so that environment's backup footprint is roughly the cap at most, plus media deleted within the seven-day retention window.

Account storage is therefore about 2 × (UAT media + PRD media): each source bucket plus its backups. At the 2 GiB ceiling for both environments that is about 8.6 GB worst case, before other buckets, against the 10 GB R2 Free storage allowance. 2 GiB per environment is the highest ceiling that stays under it. Do not raise it further without first freeing storage. Overage is billed, and budget alerts do not stop usage ([Free-tier rule](cloudflare-free-tier.md)).

Measured on 2026-10-06 with `wrangler r2 bucket info`, before that day's points:

| Bucket                                 | Storage | Objects |
| -------------------------------------- | ------- | ------- |
| `blackbox-records-cms-prd` (PRD media) | 561 MB  | 1,189   |
| `blackbox-emdash-m1-uat` (UAT media)   | 433 MB  | 589     |
| `blackbox-cms-recovery-uat-20260915`   | 422 MB  | 386     |
| `blackbox-cms-backups-prd`             | 270 MB  | 873     |
| `blackbox-cms-backups-uat`             | 177 MB  | 359     |

That is about 1.86 GB of the 10 GB allowance. PRD media grew from 404 MB (09-30) to 467 MB (10-01) to 561 MB (10-06), driven by preorder and video media. Operations are not the constraint: each run reads every media object once (about 1.8k Class B reads a day today) and writes only unseen blobs, against 1M Class A and 10M Class B per month.

### When the warning appears

A successful run prints the GitHub Actions warning `CMS backup nearing its byte ceiling` once a capture exceeds 75% of the ceiling (1.5 GiB at 2 GiB). The final JSON result line also reports `maxBytes`. Act before runs fail. Levers, cheapest first:

1. The operator deletes the leftover rehearsal recovery bucket and D1 database `blackbox-cms-recovery-uat-20260915`. This frees about 422 MB and one of the ten D1 database slots; its evidence is recorded below. Permanent deletion is a user action.
2. Stop backing up UAT (test data) or back it up weekly. This halves backup growth.
3. Shrink media at upload. Video and large images drive the growth.
4. Only then consider a paid plan. That is a user decision.

## Isolated recovery

UAT recovery point `2026-09-15-pre-upgrade` is stored in `blackbox-cms-backups-uat` at `cms/uat/points/2026-09-15-pre-upgrade.json`. Its manifest SHA-256 is `39ba0003594ed142d008daa0750df9f98804a756d32af448e77309fbd64fc659`; capture started at `2026-09-15T00:46:44.751Z` using backup implementation `97399b6e`. Both database captures matched, and all 386 media objects were captured with unchanged inventories. The schema/data pair is 1,531,823 bytes, SHA-256 `76c71c9818bff1095adfdff74be879a2ad273b3f6fb30dfbea3474630b81a4c8`. Total captured bytes are 423,154,840; immutable deduplication retains only 152,084,437 bytes including the manifest. Evidence: `.codex-artifacts/emdash-m1/hosted-backup-point.json`.

The isolated restore target is `blackbox-cms-recovery-uat-20260915`, D1 ID `9157f31f-05d0-47fd-b206-35638c0fcd17`, with an equally named private R2 bucket. This uses the eighth of ten database slots. Its bounded restore budget is 386 R2 writes, fewer than 800 R2 reads and fewer than 10,000 D1 statements, with about 422 MB additional media storage. The restore completed successfully through WebStorm: the full database and all 386 media objects were restored after checksum verification. Post-restore database, media and public-render comparisons passed; evidence is recorded below. Application bindings, commerce data and PRD remained unchanged by this rehearsal. Daily scheduling was subsequently approved and enabled, as recorded above; do not repeat credential setup.

### Hosted budget checkpoint — 2026-09-15

At 00:39 UTC, bounded inventories found 386 UAT objects totaling 421,623,017 bytes and an empty PRD media bucket. Account D1 usage showed 20.58k rows read, 2.5k written, 8.38 MB stored and seven of ten database slots used. R2 billing remained at 208 Class A and 768 Class B operations, with no billable usage; those delayed billing counters do not include every recent publication operation. The account has only the two CMS media buckets.

The initial UAT capture ceiling is 512 MiB (`536870912` bytes), including SQL. Budget fewer than 400 Class A and 800 Class B operations for its first capture, two bounded database captures, and no commerce writes. Reserve 10,000 D1 reads for the exports and leave at least 90% of daily D1 allowances for ordinary activity. A small private-object pilot precedes full capture. Seven daily points plus one pre-upgrade point at this ceiling occupy at most 4 GiB per environment before deduplication; enable both schedules only after measuring actual retained bytes and preserving account-wide storage headroom. A backup bucket has no public route, domain, or Worker binding. Scheduling remained disabled until the pilot and credentials were ready; the hosted ceiling is now 2 GiB (see [Hosted daily capture](#hosted-daily-capture)).

Create an empty recovery database and bucket with names starting `blackbox-cms-recovery-`. Use their actual IDs; do not substitute a production ID under a different name. For example:

```sh
node apps/backend/scripts/cms-backup.mjs --env local --mode restore --backup-bucket blackbox-cms-backups-local --point YYYY-MM-DD-daily --recovery-database blackbox-cms-recovery-local --recovery-id RECOVERY_DATABASE_UUID --recovery-bucket blackbox-cms-recovery-local
```

Hosted commands additionally require `--hosted-budget-reviewed` after the quota review. The command rejects configured application database IDs, non-empty databases and non-empty destination buckets. It verifies every checksum before restoration, restores media, then restores database rows with bound statements in one transaction. A failed restore leaves only the isolated recovery resources incomplete; recreate those empty resources before retrying.

Before any cutover, run the compatible CMS build against recovery bindings and compare users, content, references, revisions, image checksums and public rendering. Preserve the original environment until that acceptance passes. Recovery never authorizes PRD cutover, payment launch or commerce rollback. Do not roll back to an obsolete compiled-catalog Worker after runtime items exist.

Hosted D1 native export rejects databases containing FTS5 tables. The implementation uses the existing D1 binding to capture schema and SQL-encoded values in a bounded batch, including virtual-table row IDs while excluding generated shadow tables. Node's built-in SQLite reader restores the resulting schema/data pair. This avoids deleting live search indexes to perform a backup. Recovery creates tables before inserting data through bound D1 statements, avoiding both foreign-key ordering and D1's SQL-literal size limit. It installs triggers after the captured rows so restoration does not alter maintenance state; subsequent edits still run the restored triggers. Foreign keys remain enforced in the destination. The single recovery transaction is capped at 10,000 statements; larger sites need a reviewed dependency-aware batching strategy. Hosted bucket provisioning, schedule activation and the full recovery rehearsal remain explicit acceptance work until recorded evidence proves them.

The September 15 hosted database comparison passed against the captured backup: all 76 regular/virtual tables and 1,079 rows matched, including virtual-table row identities. The reference capture's SHA-256 was verified before comparison. Evidence: `.codex-artifacts/emdash-m1/hosted-recovery-database-parity.json`. The check used direct Wrangler D1 reads through WebStorm after the remote-binding comparison stalled; no commerce database was queried or restored. The subsequent media and rendering comparisons are recorded below.

The follow-up recovery checks also passed: the full destination inventory contains exactly the 386 expected keys and byte sizes, and a direct read of every restored object matches its SHA-256 checksum (421,623,017 total media bytes). Evidence: `.codex-artifacts/emdash-m1/hosted-recovery-parity.json` and `hosted-recovery-media-parity.json`. The original remote-binding comparison eventually completed too. Public rendering against the recovered data also passed. The verified database produced 129 published records and 123 referenced media in snapshot `08a75b92765e80659e23c7d6c0ecef12cc9837e4e08d727c034f45d2e7b36746`. Using code `22a5dd11`, Astro built 349 pages in isolated output; all 18 Artist/Release/News detail and overlay pages contained their recovered titles, all 42 checked image references resolved, and fixed pages plus sitemap were present. Media inputs matched the independently verified restored-object checksums. Evidence: `.codex-artifacts/emdash-m1/hosted-recovery-render.json`. Task 10.2 is complete; this is static rendering evidence, not a pixel comparison or authorization to switch application bindings.
