# Runtime catalog persistence

## Additive schema checkpoint

Migration `0020_runtime_catalog_fields.sql` extends the existing `StoreItemOption` table with CMS source linkage, physical item type, supported price kind, Product Projection JSON, catalog availability, and a nonnegative revision. Existing rows receive null catalog details, `withheld` availability, and revision zero. Their existing source ID, Store Item slug, variant ID, timestamps, provider bindings, and manual availability remain unchanged.

The existing source/slug/variant uniqueness constraints remain in place. A new `(sourceKind, cmsSourceId)` unique index prevents duplicate linkage while allowing unbackfilled rows to remain null. SQL checks reject blank linkage/type, unsupported price kinds or availability, malformed/non-object projection JSON, and negative/fractional revisions. The new fields do not store selling amounts, stock quantities, reservations, or historical order facts. Merch continues to use the existing Distro source/type policy.

The supported Prisma 7.10.0 client was regenerated from the schema. The current repository identity reads remain unchanged; runtime consumers will switch only after the reviewed backfill. Before deploying a Worker built with this client, apply the additive migration to that target database. No hosted migration, catalog backfill, provider write, or Worker deployment occurred in this checkpoint.

## Verification

- The SQLite migration test starts with existing identity, provider mapping, and paused availability data, applies the migration, and proves those rows are preserved. Invalid catalog values fail at the database boundary.
- The actual D1/Prisma repository test round-trips all new fields and rejects duplicate source, CMS linkage, Store Item slug, and variant identities. Existing repository reads still return the same application identity.
- The migration was applied to Local `COMMERCE_DB` using the existing Wrangler command. The local mock checkout readiness check passes for all three currently selected mock items.
- Required unit/check/build evidence is under `.codex-artifacts/emdash-m1/runtime-catalog-{unit-serial,check,build}.log`. The initial concurrent unit run hit the existing ten-second migration setup timeout in five suites; its log is retained separately as `runtime-catalog-unit.log`.
- Targeted and Local logs are `runtime-catalog-migration-test.log`, `runtime-catalog-repository-test.log`, `runtime-catalog-prisma-generate.log`, `runtime-catalog-local-migrations.log`, and `runtime-catalog-mock-readiness.log` in the same directory.

Client generation initially found an empty installed `@prisma/engines` directory. Normal and forced frozen-lockfile installs did not restore it. The exact official 7.10.0 archive was restored only after its SHA-512 matched the existing lockfile, its paths were checked, and the destination was confirmed empty and inside this workspace's `node_modules`. No dependency version, lockfile constraint, or runtime package code was changed.

## Remaining work

Local continuation now prepares the runtime Product Projection reader behind the existing repository boundaries. It queries all four application identity fields together and validates published state, initialized revision, source linkage, supported price kind, and projection shape. Missing, incomplete, unpublished, or mismatched data returns no projection. The reader does not cache records or access CMS, Stripe, or hosted KV. Existing offer, checkout, and webhook callers now await projection reads.

The isolated D1 regression constructs the reader before inserting an entirely new item, then verifies immediate reads, changed titles, fixed/custom policy, identity mismatch rejection, and rejection of incomplete or unpublished records. Existing deployed composition still selects the compiled reader until task 4.2 backfill is verified. This is preparatory task 4.3 work, not runtime cutover or new-item checkout acceptance; both tasks remain open. Persistent Local data and hosted services are untouched.

This reader checkpoint passes `pnpm test:unit`, `pnpm check` (including module and commerce boundaries), `pnpm build`, and strict OpenSpec validation. Logs are `.codex-artifacts/emdash-m1/runtime-reader-{unit,check,build}.log`. CodeGraph supplied caller/impact evidence; WebStorm MCP was unavailable in this session.

Task 4.2 must reconcile trusted D1/provider state and populate these fields without changing prices, balances, reservations, pauses, or order references. Task 4.3 then replaces compiled catalog consumers with validated runtime repository reads. The schema checkpoint alone does not make newly created items buyable or activate CMS-backed public publication.

## Backfill planning checkpoint (task 4.2 remains open)

`scripts/plan-runtime-catalog-backfill.ts` now produces catalog-only changes from migration sources, existing Prisma rows, and same-environment read-only catalog reconciliation. It rejects missing or duplicate identities, reused CMS linkage, invalid supported prices, blocking provider issues, partial backfills, and changed staff catalog data. It uses the reconciled current default Price kind rather than the manifest's former desired price or opening stock. Matching completed records produce no update. Every proposed update retains the complete original row for the apply step's concurrency comparison.

The planner has no database or provider write capability. Its regression test proves unchanged inputs, custom pricing despite an old fixed-price manifest, duplicate-free repeat planning, and rejection of environment, identity, linkage, and price conflicts. This is not a CLI or a completed migration. No additional database or provider mutation occurred in this checkpoint. Task 4.2 stays unchecked.

The final planner tree passes `pnpm test:unit`, `pnpm check`, and `pnpm build`; logs are `.codex-artifacts/emdash-m1/catalog-backfill-{unit-final,check,build}.log`. Strict OpenSpec validation also passes. Local mock source inspection confirms only three explicitly selected slugs have mock checkout enabled; other source entries must not receive invented bindings or opening stock during backfill.

## Guarded D1 apply checkpoint (task 4.2 remains open)

`scripts/apply-runtime-catalog-backfill.ts` adds an internal, dry-run-default executor. The caller must select the matching database/environment; PRD apply additionally requires the one-run live catalog confirmation. One SQL update materializes every eligible source identity and initial catalog revision before applying any changes. A stale identity, catalog revision, or initialized field prevents the entire update. Database uniqueness or validation failures roll back the transaction. Only the six new catalog columns are assigned; existing timestamps are retained.

Before and after table reads share the update's native D1 transaction. The executor compares every application table exactly, allowing only the planned catalog fields to differ, and returns counts and SHA-256 evidence rather than order/customer payloads. A verification error reports that committed state needs inspection before retrying. There are no provider calls in this executor.

The actual D1/Prisma test applies two items while retaining an untargeted third item. It includes existing stock/online allocation and stock history, a paused availability row, provider mapping, a selling-price snapshot, a pending-payment reservation, and a paid order with historical Price references. All protected table hashes match. A stale second item leaves the first unchanged; duplicate CMS linkage rolls back both; reusing the old plan is rejected; wrong-environment and unconfirmed PRD apply are rejected. Evidence is under `.codex-artifacts/emdash-m1/backfill-apply-targeted.log`.

Source/CMS/provider acquisition and the operator command still need wiring, followed by actual Local/UAT before/after migration evidence. This checkpoint only writes isolated test D1 data. No persistent Local, hosted D1, CMS, or provider data was changed, and task 4.2 remains unchecked.

Required unit/check/build gates pass; logs are `.codex-artifacts/emdash-m1/backfill-apply-unit.log`, `backfill-apply-check-final.log`, and `backfill-apply-build.log`. The first check found a missing generic result type on `D1Database.batch`; the explicit row type fixes compilation without changing execution. Strict OpenSpec validation passes. Transaction semantics follow the [native D1 batch contract](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch).

## Backfill command checkpoint (task 4.2 remains open)

`pnpm catalog:backfill` connects the planner and guarded executor through Wrangler's native D1 proxy. It selects the exact configured commerce database, preserves the Local persistence directory, and enables remote bindings only for explicitly selected UAT/PRD. The Node command reuses the existing SQL catalog reader and repository mapping because the Worker-targeted Prisma WASM client cannot initialize in Node. The production Prisma client is unchanged. Reconciliation runs with `apply: false` and repository writes disabled; no expected manifest amounts are passed to Stripe.

The command consumes the prepared CMS import plan and its complete read-only verification report. It checks target, record counts, source identities, slugs, CMS IDs, and physical format using existing format helpers. These are reviewed migration artifacts; regenerate both after source or CMS changes. It does not claim that a saved file independently authenticates current CMS state. Hosted Stripe keys must already be supplied through the authorized execution environment, with the appropriate test/live prefix; this command does not extract Worker secrets or copy them into local files.

Example Local preparation against a compiled CMS running on port 8799:

```powershell
pnpm cms:import:local -- --base http://127.0.0.1:8799 --prepareLocal .codex-artifacts/emdash-m1/backfill-local-import-plan
node --import tsx scripts/import-cms-content.mjs --base http://127.0.0.1:8799 --verifyOnly > .codex-artifacts/emdash-m1/backfill-local-cms-verified.json
pnpm catalog:backfill --env local --cms-plan .codex-artifacts/emdash-m1/backfill-local-import-plan/plan.json --cms-report .codex-artifacts/emdash-m1/backfill-local-cms-verified.json
```

A successful dry-run writes `catalog-backfill-<environment>/dry-run.json` under `.codex-artifacts/emdash-m1`. Apply requires the same arguments plus `--apply --plan-sha256 <reviewed fingerprint>` and re-reads D1/provider state before comparing the fingerprint. PRD also requires the existing one-run `--confirm-live-catalog-changes`. A completed apply writes `apply.json` with table counts and preservation hashes. None of these controls authorizes shopper launch.

Actual Local execution found 108 persisted identities/mappings, including four outside the current 104-entry manifest. The selected current entries include 101 real Stripe test bindings and three mock bindings. Local mock migration now stops before sending non-mock IDs to stripe-mock and records their application identities in `catalog-backfill-local/blocked.json`. The earlier diagnostic attempt reached the mock service and returned reconciliation errors; those errors are not evidence about real Stripe objects. No catalog apply or mapping/price/stock/order mutation occurred.

The persistent Local CMS was empty and now contains the verified 129 source records and 149 deduplicated media objects covering 152 source paths. The existing importer completed successfully, followed by the full read-only verifier. Evidence files are `backfill-local-cms-import.json`, `backfill-local-cms-verified.json`, and `backfill-command-local-dry-run.log` in the same ignored artifact directory. Temporary Local CMS and stripe-mock processes were stopped. Hosted databases and providers were not changed.

Remaining task 4.2 work includes resolving the pre-existing mixed Local bindings without resetting them, a successful end-to-end apply/repeat run, and authorized UAT migration evidence. The command's preflight tests and actual rejected Local run do not establish successful hosted backfill.

The command checkpoint passes `pnpm test:unit`, `pnpm check`, `pnpm build`, and strict OpenSpec validation. Logs are `backfill-command-{unit,check,build}.log`; the targeted command tests and type checks are recorded separately. The newly reported account-wide KV PUT exhaustion resets at 2026-09-14 00:00 UTC. This checkpoint used Local D1/CMS/mock services and did not issue hosted KV writes; the notification alone does not identify which Worker consumed the allowance.
