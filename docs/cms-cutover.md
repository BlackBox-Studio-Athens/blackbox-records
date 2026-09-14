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

PRD Worker name is `blackbox-records-backend-prd`. CMS identities come from `apps/backend/cms-resources.json`; commerce identities come from `apps/backend/wrangler.jsonc`. The source PRD route currently covers only `/api/internal/*` on the staff hostname. Combined staff routing and its exact Access issuer/audience must be verified before any route switch; the PRD CMS resource entry does not yet contain those Access settings.

## Before requesting PRD approval

1. Finish the integrated UAT creation, publication, paid checkout, webhook replay, order and email-retry acceptance. Reconcile retained catalog bindings without reseeding stock or prices. Preserve the report's code SHA and content identity.
2. Follow [the Free-tier operating rule](cloudflare-free-tier.md): record current account usage, operation estimates, ordinary-traffic headroom and the bounded pilot result. A previous day's allowance is not current evidence.
3. Capture and restore the target CMS using [the backup runbook](cms-backup.md). Record the private recovery-point key, manifest hash, capture time, database/media resource IDs and compatible runtime code SHA. Verify restored public rendering before relying on that recovery point. The existing Local point `2026-09-14-daily` is rehearsal evidence, not a PRD backup.
4. Freeze Sveltia editorial writes and identify the final source commit. Keep that freeze through reconciliation and source switching. Prepare a final inventory of source identities, CMS identities, references, revisions and media hashes. Record current commerce identity mappings, stock, prices and historical order references for comparison; CMS recovery must never restore commerce data.
5. Produce a read-only PRD migration/backfill report against those exact targets. Include the reviewed migration fingerprint, catalog plan hash, source commit, backup references and every proposed resource/route change. Resolve all conflicts before requesting one-run approval.

Prepare a PRD plan locally with `node --import tsx scripts/import-cms-content.mjs --preparePrd .codex-artifacts/emdash-m1/prd-import-preparation`. Preparation validates source content/media and writes plan.json plus the existing browser import function; it performs no hosted requests. The returned planSha256 identifies the exact serialized plan. The shared import function accepts the exact PRD hostname; an apply additionally requires `confirmLiveCmsChanges: true` and `reviewedPlanSha256` matching that plan. Supply these only after one-run approval of the concrete report. Do not relabel a UAT plan. Authenticated hosted preflight, quota budgeting and the PRD rehearsal remain outstanding.

## Authorized execution order

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

Local preparation on 2026-09-15 produced 129 records and 152 media objects, plan SHA-256 e7aa6f8a50e916a3557fd6fe7f09f1b40abf2aff5d280446d2de6b550fd70000. Evidence: .codex-artifacts/emdash-m1/prd-import-preparation-final.json. This is a source plan, not proof of deployed PRD reconciliation. Synthetic approval-boundary tests passed through WebStorm without network access; no live approval was supplied or consumed.

## Hosted readiness observation — 2026-09-15 local time

Read-only Cloudflare dashboard inspection in Chrome Blackbox confirmed the configured PRD CMS and UAT CMS database IDs, the combined UAT staff route, and the retained separate staff Pages application. PRD still displays the internal API staff route. Seven D1 databases now exist (dashboard limit ten), totaling 7.67 MB; the older six-database budget must not be reused. D1 displayed 86.14k rows read and 268 rows written for September 14, with zero billable usage. R2 billing displayed 208 Class A operations, 768 Class B operations and 0.01 GB-month storage for September 2–14, all included. Worker billing displayed 9.88k requests and zero billable usage for the current cycle; this is not a daily remaining-request measurement.

No resource, route, binding, plan or data was changed. Dashboard counters can lag. Before hosted recovery, finish the current operation estimate and verify Durable Object/current request headroom; budget recovery databases within the three remaining slots. The dashboard table-count column displayed zero even for populated databases, so it is not accepted as schema evidence.

