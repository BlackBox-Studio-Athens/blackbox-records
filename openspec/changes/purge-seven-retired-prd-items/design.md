# Design

## Context

See proposal.md. All seven commerce entries are withheld. Four CMS entries are already purged; three remain drafts. Initial read-only checks found no orders or pending catalog operations. Ten known media IDs remain. The native media usage index is stale and cannot establish exclusive ownership.

## Goals / Non-Goals

Use installed EmDash content/media deletion handlers and a targeted D1 batch. Do not add a production deletion feature, deploy code, contact Stripe or alter unrelated concurrent work on main.

## Decisions

- Freeze exact identities, CMS revisions, accepted pointer, targeted commerce data and media keys in an ignored plan/backup. Check live state again before each stage; stop on order/pending-operation dependencies or unexpected changes.
- Inspect current content and retained revisions across the native collections plus the accepted snapshot, rather than trusting the stale media index. Preserve any shared media ID, original key or published byte hash.
- Native trash/permanent deletion cleans CMS metadata and revisions. Clear selected private price drafts through the installed plugin storage repository.
- Delete selected availability, stock/history/counts, offers, mappings, operations and catalog rows in a guarded D1 batch. Keep provider webhook deduplication receipts, detaching selected variants.
- Delete native media with storage cleanup, staff thumbnail keys and exclusive snapshot/approved-media hashes. Historical manifests and backup objects stay retained; restoring old images requires the scoped backup.
- Every stage is idempotent and checkpointed. Already missing selected records/objects count as complete. A scoped before/after comparison proves unrelated rows and active content remain unchanged.

## Risks / Trade-offs

- Cross-system operations are not atomic: scoped backups and per-record checkpoints enable recovery.
- Concurrent editing/publication can change references: verify pointer and remaining content fingerprints before media deletion; reject drift.
- Hosted budget: initial apply cap was 50,000 D1 reads, 1,000 D1 writes, 500 R2 reads and 100 R2 deletions. Repeated full commerce guards reached 50,074 reads and stopped before derived-object cleanup. After refreshed account analytics, recovery gets a separate 20,000-read ceiling and skips repeated commerce scans in per-image checks. Reserve two million D1 reads, 50,000 D1 writes, 20,000 Worker requests, and at least half the R2 operation allowances for ordinary service. Stop on excess usage and retain each attempt's measurements.
