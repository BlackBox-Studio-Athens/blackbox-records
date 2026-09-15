# EmDash cutover worksheet

## Production deployment/import — completed September 15, 2026

The user approved the deployment/import batch below. Release `34944541258` succeeded with accepted code `af93b371e4eaca0b1b418b62c59da86ad8e36f8c`; all 129 records and 152 media sources were imported and independently verified at `2026-09-15T08:06:48Z` in 858 requests. There were 149 new media objects; identical sources deduplicated. Commerce snapshots matched exactly before/after import. Disintegration remains EUR 28.00 inclusive, stock 15 physical / 12 online, and zero orders. The public artifact still uses its pre-publication content source; the first PRD CMS publication is separate work.

All 73 native, three application and three commerce migrations applied. The supported EmDash seed API registered the 13 generated collections and 76 fields in the empty PRD CMS without content or commerce seeds. Chrome Blackbox confirmed the protected staff workspace and imported artists. `PRD_CMS_ENABLED=true` now preserves this deployed runtime on future code promotions.

The first release attempt `34943643219` uploaded the combined Worker but could not replace the existing staff Pages domain. The approved route switch detached that custom domain from Pages, removed only its old proxied CNAME (`staff` → `blackbox-records-staff.pages.dev`, TTL Auto), and attached the exact hostname to `blackbox-records-backend-prd`. The Pages project and deployment history remain available. Subsequent combined PRD releases now use version upload/promotion and do not reconcile DNS. No Access application or policy was weakened.

Evidence is under `.codex-artifacts/emdash-m1/`: `prd-native-migration-apply.json`, `prd-application-migration-apply.json`, `prd-schema-initialized.json`, `prd-staff-pages-domain-recovery.json`, `prd-staff-domain-switched.json`, `prd-import-applied.json`, `prd-import-verified.json`, `prd-import-commerce-before.json`, `prd-import-commerce-after.json` and `prd-import-run.log`. `prd-publication-readiness.json` confirms the deployed source and disabled checkout.

### Prepared next batch: catalog linkage and first CMS publication

Read-only plan `34945254229` succeeded against source `03ff308f060ac123baa4995719d6dd3a9cd4371e`. Its catalog plan hash is `5a832e90880032e1ed41d5f4de27cf2df1fb1ff95d6e65a56e790b8c2ee038e1`: one update, zero applied. It links retained Disintegration to imported CMS ID `01M2J1HS3EKT7PXS24JDEWJ7WB`, initializing only the six runtime catalog fields. Existing Product/default Price and all stock/order tables are preserved by the existing transactional backfill. The exact 129-identity verification input is `prd-catalog-cms-report.json`.

The remaining setup requires separate approval for that live linkage and these PRD credentials: copy the already supplied GitHub live Stripe key directly into the PRD Worker for member price commands; create a PRD native read-only content/media export token and a PRD Access service token expiring September 15, 2027; create a repository-scoped GitHub Actions dispatch token with the maximum allowed expiry, and a matching random publication completion secret in GitHub and the PRD Worker. Limit the Access service policy to the existing PRD staff application, preserving member Google login. Store all values in GitHub/Worker secrets, never in chat, public build variables, or committed files.

After approved setup, publish the imported revisions and first immutable PRD snapshot with the already deployed source SHA. Use the existing 600-request capture ceiling proven by UAT, preserve the existing price/stock, and keep both shopper launch gates disabled. Only switch public content source after identity reconciliation; remove old writers and generation hooks after replacement acceptance. This is not authorization to promote a future unreviewed code artifact.

The workflow accepts the verified report and exact plan hash for linkage. Adding `confirm_cms_cutover=true` to that explicitly approved linkage run additionally installs the Stripe runtime secret; a read-only plan cannot do so. The narrow migration path skips repeated full build/test gates at the user's request, while retaining the existing provider reconciliation, hash, target and transaction checks. Six focused workflow checks passed through WebStorm.

### Approved batch scope and preflight

- Promote accepted candidate `34937507986`, source `af93b371e4eaca0b1b418b62c59da86ad8e36f8c`, through `pages.yml` with code promotion and CMS cutover confirmed. Deploy its retained combined Worker to `blackbox-records-backend-prd`, including protected `staff.blackboxrecordsathens.com`, and its retained public artifact to `blackbox-records-web`. Checkout remains disabled.
- Apply the 73 native CMS migrations to `e466f52b-46aa-4a76-9a09-0e304a3800b4`, fingerprint `4bd8ef389b3816f78b3d3d614a025a972156c0de908707a2bae8b31a51809108`, plus application migrations 0001–0003. Code promotion applies commerce migrations 0020–0022 to `de66a606-908d-446c-8415-39504e653f49`.
- Import the frozen 129 records and 152 media sources using plan `f0b4d7024639be728b01c5d363cf46434e59ce0aa4ac668e86185555d97f9e4c`. Target CMS D1 and media bucket are both `blackbox-records-cms-prd`. Verify the imported identities before any catalog linkage or first public CMS publication.
- Retain private pre-upgrade recovery point `cms/prd/points/2026-09-15-pre-upgrade.json` in `blackbox-cms-backups-prd`; preserve existing commerce balances, provider bindings, orders and reservations. Leave the old staff Pages project and public content source available until replacement acceptance.

Native migration preflight was refreshed against the existing PRD build without rebuilding or changing the running Local configuration. It reports the same fingerprint, 73 pending, no unknown or executed migrations. `migrate-cms.mjs --wrangler-config .emdash/prd-build/server/wrangler.json --env prd` selects that already built configuration; the exact environment/database guard still applies. Native check exit code 2 means pending migrations, not a failed API request. Evidence: `.codex-artifacts/emdash-m1/prd-native-migration-final.json`.

Chrome Blackbox account usage at approximately 07:27 UTC: Workers 8,015/100,000 requests today; D1 172,050 reads, 15,700 writes, 8/10 databases, 11.69 MB storage; R2 995.38 MB, 1,080 Class A and 6,500 Class B operations, no billable usage. Reserve for this batch at most 5,000 Worker requests, 100,000 D1 reads, 20,000 D1 writes, 1,000 R2 Class A and 2,000 Class B operations, and 500 MB additional media. This leaves over 86,000 daily Worker requests and 64,000 daily D1 writes for ordinary traffic. Reuse the successful UAT import/recovery pilot; inspect actual use after the initial media batch and stop on quota warnings or estimate overrun.

The actual PRD CMS IDs do not exist before import. Consequently the final catalog-linkage hash must be produced afterward from the read-only import report; it is not fabricated from UAT IDs. The workflow now accepts that report through `cms_import_report`, performs the existing read-only backfill, and requires its exact hash and live confirmation for apply. Six focused workflow checks passed through WebStorm; repeated full suites were skipped at the user's request. This preparation does not mark the remaining acceptance tasks complete.

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

Task 10.3 is complete. Tasks 10.4–10.5 and 11.1–11.5 remain open until their actual target evidence and required authorization exist.

## Verified state — September 15, 2026

UAT release `34926834942`, code `9e93faa857f0e8346bd65c484b8da00a4ff920ea`, completed candidate build, Worker deployment, Pages deployment and provider smoke successfully. The candidate passed unit tests and workspace checks, restored the existing publication and built both target artifacts. Retained smoke evidence in `.codex-artifacts/emdash-m1/uat-34926834942/uat-smoke-34926834942-1/` records both fixed-price and pay-what-you-want paid checkout, Resend delivery smoke and all four static scenarios passing. This does not establish paid-email retry or complete the remaining integrated acceptance.

The deployed staff fixes retain keyboard focus after Content requests and increase small stock-label contrast. Chrome Blackbox verification confirmed focus returns to the Section selector after loading Releases and the updated labels are deployed; evidence is `.codex-artifacts/emdash-m1/uat-accessibility-fixes.json`. Local keyboard evidence also covers item-price validation and stock required-field errors without changing prices or quantities. Representative desktop, narrow viewport and keyboard acceptance is complete; see task 6.5 and `setup-command-evidence.md`.

UAT content publication `34912760066` completed using approved deployed code. Public release identity and the protected receipt agree on request `3043fd73-b2e7-4c20-8509-1be2747b69c0` and snapshot `a6ad24d148046c1aef2c1e3d2a8206168bf26a707da867207adb8bc87bfc3cef`. All 129 original CMS records have published revisions; 104 Release/Distro item operations completed. The four subsequent UAT creation fixtures remain private drafts. Fresh public pages, metadata, sitemap, search and overlays have been checked. Active-playback continuity acceptance is complete; task 8.8 records the same-session cache limitation.

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

Before requesting one-run PRD apply approval, finish integrated UAT acceptance, record current account headroom, and prepare the exact final import/backfill reconciliation report. The frozen UAT import rehearsal is complete. No PRD schema/import/backfill, route switch, public-source switch or shopper launch is authorized by this worksheet.

The read-only commerce migration inventory additionally identifies `0020_runtime_catalog_fields.sql`, `0021_catalog_operation.sql` and `0022_item_publication_operation.sql` as pending; evidence is `.codex-artifacts/emdash-m1/prd-commerce-pending-migrations.json`. Include these alongside the 73 native and three application CMS migrations in the one-run report. The combined Worker must be available after schema preparation and before the native HTTP import; public-source switching follows successful import, catalog reconciliation and protected staff acceptance.

Historical setup attempts and superseded readiness observations remain in Git history and the OpenSpec evidence files; they are not instructions to repeat completed provisioning.

## Reviewed combined-runtime promotion path

The release workflow now accepts a false-by-default `confirm_cms_cutover` input alongside the existing exact-SHA code-promotion approval. For that approved run it deploys the already retained `prd/cms/server/wrangler.json` artifact under the existing release lock and skips the separate staff Pages upload. It does not apply native CMS migrations, import content, change catalog prices, or enable shopper checkout.

After successful PRD replacement acceptance, set repository variable `PRD_CMS_ENABLED=true` before subsequent promotions. This preserves the combined Worker on later software releases. Until that acceptance the default remains the existing PRD runtime; the old staff deployment path is retained only for the unfinished cutover. The workflow contract checks the approval default, mutually exclusive runtime branches, retained artifact path, shared staff decision and existing code-promotion gate. The final deletion remains task 11.5.

The frozen UAT import rehearsal now passes; see the final section of the UAT editorial import evidence. All 142 native editorial rows and 518 order rows were unchanged, including the four newer drafts. The existing price approval remains EUR 28.00 for Disintegration with stock 15/12. PRD apply still awaits the exact one-run report and approval.

## Latest release and live-price prerequisite

UAT candidate `34937507986`, code `af93b371e4eaca0b1b418b62c59da86ad8e36f8c`, passed all release jobs on September 15. Its retained smoke artifact proves both fixed/custom paid checkout, Resend smoke, and all four public/static scenarios. Evidence is `.codex-artifacts/emdash-m1/uat-34937507986/`.

A single protected Orders read at `2026-09-15T06:54:36.677Z` verified the latest two paid orders have current Greek fulfillment data and delivered shopper/operations notifications. The retained history also includes a shopper confirmation delivered on attempt two. This is observed retry history, not a new forced provider failure on this revision. Evidence: `uat-order-acceptance-read.json` in the same private evidence directory. Task 10.5 remains open for its complete integrated scope.

Read-only PRD plan `34938647042` successfully used the newly stored live Stripe key, but stopped with `price_authority:missing_price` for the existing Disintegration variant. No mutation occurred. The reconciler reads bound Product/default Price state and intentionally ignores generated expected prices in PRD; this report does not prove there are no matching unbound Products elsewhere in Stripe. Resolve the live Product/Price binding using explicit setup/migration at the approved EUR 28.00, preserving stock 15/12. Keep the UAT-only bootstrap guard; do not enable routine generated-price creation in PRD. The existing confirmed-live setup and price gateway can support the one-run preparation after its concrete report is approved. Evidence: `prd-plan-34938647042.log`.

## Initial live-price plan ready for one-run approval

Read-only run `34940044370` passed at `2026-09-15T07:07:10Z`, using source `f5b64e34d65e53cf98674638939742f12d88d13b`. Its complete bounded Stripe Product inventory found zero Products. The retained PRD Disintegration identity and physical/online stock 15/12 matched the plan. No provider or D1 write occurred.

Plan SHA-256: `cfb45f1d7068147fd43b16dcf0547e159f9fe55ab38717af44b676c2757e8e0a`. Apply creates Product `prod_blackbox_prd_variant_disintegration-black-vinyl-lp_standard`, the approved one-time EUR 28.00 VAT-inclusive Price, and its default selection through the existing confirmed-live setup/price gateway. It binds `variant_disintegration-black-vinyl-lp_standard` and refreshes its offer in commerce D1 `de66a606-908d-446c-8415-39504e653f49`. The operation ID `emdash-prd-disintegration-initial-20260915` supports recovery without duplicating Product/Price creation. Stock remains 15/12; no migrations, CMS import, route/deployment changes or shopper launch occur in this run.

The user approved this exact one-run live catalog preparation. Apply run `34940281722` passed on September 15 at `07:14:06Z`, using the reviewed source and hash with code promotion false. It also passed the full unit/check/build gates before applying. The separate post-apply read confirms one PRD item, EUR 28.00, physical/online stock 15/12 and zero orders. No deployment, schema migration, CMS import or shopper launch occurred. This approval is consumed by that preparation run and does not authorize the remaining PRD cutover.

Evidence: `.codex-artifacts/emdash-m1/prd-initial-price-plan-34940044370.log`, `prd-initial-price-apply-34940281722.log`, `prd-commerce-after-initial-price.json` and `prd-initial-price-checks.json`. The explicit migration command passed backend type-checking, lint and 11 focused tests through WebStorm before dispatch.

## UAT signed webhook replay

Chrome Blackbox replayed the original sandbox event `evt_1UFqDfV05bAFb7UbIOJKubgn` once to the existing UAT endpoint `we_1TY39FV05bAFb7UbKbYLSgQ7`. Stripe showed Delivered / HTTP 200 for the new attempt at `2026-09-15T07:14:45Z`. Before/after D1 reads proved exact equality of the paid order, line item, stock and three delivered notification rows for order `0d3c081f-cff0-46ae-aa01-cca5c3e080c1`. The replay neither deducted stock again nor duplicated notifications. Both evidence reads wrote zero rows; private snapshots are `uat-webhook-replay-before.json` and `uat-webhook-replay-after.json`. This extends task 10.5 without claiming the still-unfinished full cutover acceptance.
