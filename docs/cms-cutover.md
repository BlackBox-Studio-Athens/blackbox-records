# EmDash cutover worksheet

Prepared from repository configuration on 2026-09-15. This is a planning worksheet, not a successful PRD dry-run or authorization to apply. No hosted request or mutation was made to prepare it. Verify deployed resource identities before execution.

## Exact targets

| Resource             | UAT                                  | PRD                                  |
| -------------------- | ------------------------------------ | ------------------------------------ |
| Staff hostname       | staff-uat.blackboxrecordsathens.com  | staff.blackboxrecordsathens.com      |
| CMS D1 name          | blackbox-emdash-m1-uat               | blackbox-records-cms-prd             |
| CMS D1 ID            | 1e308981-165d-4ce3-bd43-9c2e2ece2868 | e466f52b-46aa-4a76-9a09-0e304a3800b4 |
| CMS media R2         | blackbox-emdash-m1-uat               | blackbox-records-cms-prd             |
| Commerce D1 ID       | a1459267-096e-4b8c-8826-f3e5d4131cfd | de66a606-908d-446c-8415-39504e653f49 |
| Public Pages project | blackbox-records-web-uat             | blackbox-records-web                 |

PRD Worker name is `blackbox-records-backend-prd`. CMS identities come from `apps/backend/cms-resources.json`; commerce identities come from `apps/backend/wrangler.jsonc`. The commerce-only PRD configuration covers `/api/internal/*`; the prepared combined CMS configuration additionally owns the full staff hostname as a custom domain. Combined staff routing and its exact Access issuer/audience must be verified before any route switch; the PRD CMS resource entry now contains the existing Access issuer and audience, read from application b1390ecf-4ad4-4cdf-8650-b9dcc240b63d on September 15. This records existing protection and does not change the hosted application.

## Before requesting PRD approval

1. Finish the integrated UAT creation, publication, paid checkout, webhook replay, order and email-retry acceptance. Reconcile retained catalog bindings without reseeding stock or prices. Preserve the report's code SHA and content identity.
2. Follow [the Free-tier operating rule](cloudflare-free-tier.md): record current account usage, operation estimates, ordinary-traffic headroom and the bounded pilot result. A previous day's allowance is not current evidence.
3. Capture and restore the target CMS using [the backup runbook](cms-backup.md). Record the private recovery-point key, manifest hash, capture time, database/media resource IDs and compatible runtime code SHA. Verify restored public rendering before relying on that recovery point. The existing Local point `2026-09-14-daily` is rehearsal evidence, not a PRD backup.
4. Freeze Sveltia editorial writes and identify the final source commit. Keep that freeze through reconciliation and source switching. Prepare a final inventory of source identities, CMS identities, references, revisions and media hashes. Record current commerce identity mappings, stock, prices and historical order references for comparison; CMS recovery must never restore commerce data.
5. Produce a read-only PRD migration/backfill report against those exact targets. Include the reviewed migration fingerprint, catalog plan hash, source commit, backup references and every proposed resource/route change. Resolve all conflicts before requesting one-run approval.

Prepare a PRD plan locally with `node --import tsx scripts/import-cms-content.mjs --preparePrd .codex-artifacts/emdash-m1/prd-import-preparation`. Preparation validates source content/media and writes plan.json plus the existing browser import function; it performs no hosted requests. The returned planSha256 identifies the exact serialized plan. The shared import function accepts the exact PRD hostname; an apply additionally requires `confirmLiveCmsChanges: true` and `reviewedPlanSha256` matching that plan. Supply these only after one-run approval of the concrete report. Do not relabel a UAT plan. Authenticated hosted preflight, quota budgeting and the PRD rehearsal remain outstanding.

## Authorized execution order

Release candidates retain the combined PRD CMS build under `prd/cms`, including its generated configuration and protected staff assets. The manifest hashes that directory and pins both CMS resource configuration and Astro build configuration. The ordinary PRD promotion still deploys the existing commerce artifact until the separately approved CMS cutover; retaining the CMS build does not switch routes or apply migrations. Use the retained combined artifact from the accepted candidate for that cutover, not a fresh local rebuild.

List application-owned CMS migrations with `pnpm --filter @blackbox/backend cms:application-migrations --env uat` (or `prd`). Add `--apply` only for the reviewed target; PRD also requires `--confirm-live-cms-changes` for that run. These migrations use `_blackbox_app_migrations` in `CMS_DB`, separate from native EmDash history and commerce migrations. Local remains the default and supports the existing `--persist-to` option.

After the exact report receives one-run approval: apply the reviewed schema/import/backfill, reconcile the recorded identities and balances, deploy compatible combined runtime code, verify protected staff, then switch public builds to the accepted target snapshot through the existing release/publication workflows. Preserve the reviewed code SHA and target mutation lock described in [catalog promotion](catalog-promotion.md).

Verify fresh pages, metadata, sitemap, search and overlays, plus existing checkout returns and order links. Leave both shopper launch gates unchanged: code/content cutover does not grant `PRD_LAUNCH_APPROVED=true` or enable `native_checkout_enabled`.

Only after replacement acceptance remove Sveltia writers, Git OAuth and old admin bootstrap/preview paths; remove compiled-catalog runtime/build inputs and retire the separate staff Pages deployment route. Keep explicit import/recovery fixtures and recoverable provider history. Unfreeze editing in exactly one CMS after the replacement is accepted.

## Failure decisions

| Failure point                                        | Response                                                                                                                                                                                    |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Before apply                                         | Leave PRD unchanged; resolve the report and obtain a fresh approval if the proposed operation changes.                                                                                      |
| Import or reconciliation mismatch                    | Keep editing frozen. Preserve both data sets and stop the source switch. Resolve the specific mismatch; never reset commerce or blindly repeat provider writes.                             |
| Public build/deployment fails                        | Keep the last accepted public artifact and inspect the retained publication status. Retry through the existing publication workflow after fixing the cause.                                 |
| Combined runtime fails after new content/items exist | Roll forward or deploy a known compatible runtime-catalog revision. Never restore a compiled-catalog-only Worker.                                                                           |
| CMS data recovery needed                             | Restore into isolated resources, verify identities/media/rendering, then review the binding switch. Keep original resources available. Never restore `COMMERCE_DB` as part of CMS recovery. |

Tasks 10.3–10.5 and 11.1–11.5 remain open until their actual target evidence and required authorization exist.

## Verified state — September 15, 2026

UAT release `34926834942`, code `9e93faa857f0e8346bd65c484b8da00a4ff920ea`, completed candidate build, Worker deployment, Pages deployment and provider smoke successfully. The candidate passed unit tests and workspace checks, restored the existing publication and built both target artifacts. Retained smoke evidence in `.codex-artifacts/emdash-m1/uat-34926834942/uat-smoke-34926834942-1/` records both fixed-price and pay-what-you-want paid checkout, Resend delivery smoke and all four static scenarios passing. This does not establish paid-email retry or complete the remaining integrated acceptance.

The deployed staff fixes retain keyboard focus after Content requests and increase small stock-label contrast. Chrome Blackbox verification confirmed focus returns to the Section selector after loading Releases and the updated labels are deployed; evidence is `.codex-artifacts/emdash-m1/uat-accessibility-fixes.json`. Local keyboard evidence also covers item-price validation and stock required-field errors without changing prices or quantities. The full representative accessibility acceptance remains open.

UAT content publication `34912760066` completed using approved deployed code. Public release identity and the protected receipt agree on request `3043fd73-b2e7-4c20-8509-1be2747b69c0` and snapshot `a6ad24d148046c1aef2c1e3d2a8206168bf26a707da867207adb8bc87bfc3cef`. All 129 original CMS records have published revisions; 104 Release/Distro item operations completed. The four subsequent UAT creation fixtures remain private drafts. Fresh public pages, metadata, sitemap, search and overlays have been checked. Active-playback publication acceptance remains open.

UAT publication credentials and the 600-request capture ceiling are configured. The Access service token and native read-only export token expire September 15, 2027; the repository-scoped Actions dispatch token has no expiration. Their creation and secret-storage evidence is retained in `.codex-artifacts/emdash-m1/`. Do not recreate these credentials to repeat a setup step. The Chrome extension blocking issue is resolved.

Local acceptance covers all four creation paths, focused editing and stale-save recovery, publication, paid mock checkout, duplicate signed webhooks, mock notifications, draft rejection and reservation/paid-return continuity after unpublish. See [implementation evidence](../openspec/changes/replace-sveltia-with-emdash-operations/setup-command-evidence.md). The canonical WebStorm launcher preserves existing stock and prices. Local mock sessions remain process-local across restarts.

The complete isolated UAT recovery drill matched 76 tables, 1,079 rows and all 386 media objects/checksums, then rendered 349 public pages. See [backup and recovery](cms-backup.md). The user approved the dedicated backup credential on September 15; it is now stored as `CMS_BACKUP_API_TOKEN`. Daily scheduling is enabled following the current account-budget review. Scheduled-path capture `34935186823` passed for both UAT and PRD, creating `2026-09-15-daily` recovery points while retaining pre-upgrade backups.

## Prepared PRD state — no live apply authorized

The combined PRD artifact builds with its full staff custom domain, existing Access issuer/audience, isolated CMS bindings and no KV. Ordinary PRD promotion still uses the existing commerce artifact until cutover is explicitly approved.

The read-only commerce baseline at `2026-09-15T03:34:38.361Z` found one Store Item, `disintegration-black-vinyl-lp`, variant `variant_disintegration-black-vinyl-lp_standard`, with physical stock 15 and online stock 12. It has no bound Stripe Product/Price or offer snapshot; there are zero checkout orders. The query read three rows and wrote zero. Evidence: `.codex-artifacts/emdash-m1/prd-commerce-before-cutover.json`; deployed column inventory: `prd-commerce-schema-before-cutover.json` in the same directory. PRD has not yet received the runtime CMS-linkage columns.

This baseline cannot pass `planRuntimeCatalogBackfill`: that planner requires existing runtime identities and a reconciled active bound default Price. Prepare the missing live catalog identities/provider bindings as an explicit part of the reviewed plan before backfill. Do not copy UAT Price IDs, assume all source items already exist in PRD, or replace the retained 15/12 stock with generated opening quantities. The snapshot is preparation evidence; re-read it during the final write freeze.

On September 15 the user approved an initial live selling price of EUR 28.00 for Disintegration and confirmed they are the only editor, with content editing paused for the final rehearsal. The updated offline catalog preparation records 2,800 minor units, preserves stock 15/12, and has SHA-256 `f6507e43f2dbd2492946d16dabfda8892634229bff7cbe2cc131a9334af8ffbb`. The price decision and editing pause do not substitute for one-run approval of the final PRD apply report.

The frozen read at `2026-09-15T06:08:04.197Z` again found exactly one PRD item and zero orders. UAT reconciliation verified all three new runtime items with their original quantities and EUR 25 test prices, one mapping/setup each, and all four editorial drafts; none were published or overwritten. Evidence: `.codex-artifacts/emdash-m1/prd-commerce-frozen.json` and `uat-creation-frozen.json`. This read-only comparison is not a claim that the final import rehearsal has been executed.

The native CMS migration report targets `e466f52b-46aa-4a76-9a09-0e304a3800b4`: fingerprint `4bd8ef389b3816f78b3d3d614a025a972156c0de908707a2bae8b31a51809108`, no applied migrations, 73 pending. Application migrations `0001_publications.sql`, `0002_publication_dispatch.sql` and `0003_local_publication_receipt.sql` are also pending. Revalidate these reports before applying.

The empty PRD CMS backup is in private bucket `blackbox-cms-backups-prd`, point `cms/prd/points/2026-09-15-pre-upgrade.json`, with zero media and 23 bytes of schema/data JSON. This captures the empty pre-import state; it is not a populated PRD recovery rehearsal.

The prepared source import contains 129 records and 152 media sources, from source commit `2ed74dc7`, targeting `https://staff.blackboxrecordsathens.com`. Plan SHA-256: `f0b4d7024639be728b01c5d363cf46434e59ce0aa4ac668e86185555d97f9e4c`. Files: `.codex-artifacts/emdash-m1/prd-import-preparation/`. Preparation performed no hosted writes.

Before requesting one-run PRD apply approval, finish integrated UAT acceptance and the editorial-write freeze rehearsal, record current account headroom, and prepare the exact final import/backfill reconciliation report. No PRD schema/import/backfill, route switch, public-source switch or shopper launch is authorized by this worksheet. Keep the original execution order and failure decisions above.

Historical setup attempts and superseded readiness observations remain in Git history and the OpenSpec evidence files; they are not instructions to repeat completed provisioning.

## Reviewed combined-runtime promotion path

The release workflow now accepts a false-by-default `confirm_cms_cutover` input alongside the existing exact-SHA code-promotion approval. For that approved run it deploys the already retained `prd/cms/server/wrangler.json` artifact under the existing release lock and skips the separate staff Pages upload. It does not apply native CMS migrations, import content, change catalog prices, or enable shopper checkout.

After successful PRD replacement acceptance, set repository variable `PRD_CMS_ENABLED=true` before subsequent promotions. This preserves the combined Worker on later software releases. Until that acceptance the default remains the existing PRD runtime; the old staff deployment path is retained only for the unfinished cutover. The workflow contract checks the approval default, mutually exclusive runtime branches, retained artifact path, shared staff decision and existing code-promotion gate. The final deletion remains task 11.5.

The frozen UAT import rehearsal now passes; see the final section of the UAT editorial import evidence. All 142 native editorial rows and 518 order rows were unchanged, including the four newer drafts. The existing price approval remains EUR 28.00 for Disintegration with stock 15/12. PRD apply still awaits the exact one-run report and approval.
