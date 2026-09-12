# Release baseline — 2026-09-12

Inspected source: `00e874e6a86659b0359a1fd28652e5d198e93261` on `main`. This is section 1 preparation, not acceptance of a new hosted candidate. All account operations below were read-only; secret values were neither retrieved nor recorded.

## Catalog prerequisite

Synchronized the three `replace-catalog-promotion` deltas into the main `catalog-promotion-automation`, `static-site-and-deployment`, and `stripe-catalog-sync` specs. The prerequisite remains active and unarchived.

- `StripeCatalogGatewayClient.retrieveDefaultPrice` retrieves the bound Product with expanded `default_price`; invalid parent, recurring type, and provider-mode mismatch fail closed.
- `CatalogReconciler` selects that default and refreshes mapping/snapshot state. Existing Prices do not become competing candidates. Bootstrap reuses a stable UAT Product and an interrupted Price instead of creating duplicates.
- `migrate-catalog-product-bindings.ts` exports state and validates the complete proposed mapping set before provider writes. It preserves trusted amounts and requires separate PRD confirmation.
- UAT seed SQL uses `ON CONFLICT("variantId") DO NOTHING` for both Stock and ItemAvailability. Repeated releases preserve existing stock and pauses.
- `pages.yml` uses one source SHA, a non-cancelling release lock, and no bot commit, reset command, or cross-workflow deployment dispatch.

Validation: 25 runtime catalog/gateway tests and 13 Node catalog/workflow tests passed. `pnpm openspec -- validate --specs` passed all 44 specs, with pre-existing Purpose-placeholder warnings. Strict validation of this change, `pnpm environment:model:verify`, formatting of edited documents, and `git diff --check` passed. This session changed documentation only and did not repeat full unit/check/build gates, hosted migration, or paid-provider acceptance.

## Before / intended after

The after column describes the approved design, not installed infrastructure.

| Surface               | Observed before                                                                                                                                       | Intended after                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Local                 | `http://127.0.0.1:4321/blackbox-records/`                                                                                                             | Unchanged; mock and UAT-connected modes remain                                                                             |
| UAT public            | GitHub Pages reports `built`, workflow publishing, at `https://blackbox-studio-athens.github.io/blackbox-records/`                                    | Dedicated Pages project, proposed name `blackbox-records-web-uat`, root base `/`; actual returned origin still outstanding |
| PRD public            | Account lists `blackbox-records-web`, domains `blackbox-records-web.pages.dev` and `blackboxrecordsathens.com`, no Git provider integration           | Existing project retained; exact candidate promotion only; apex activation remains separately controlled                   |
| PRD holding           | Manual workflow uploads `dist-holding` to the public project's `holding` branch                                                                       | Unchanged, independent of candidate promotion                                                                              |
| Staff                 | Account lists `blackbox-records-staff`, domains `blackbox-records-staff.pages.dev` and `staff.blackboxrecordsathens.com`, no Git provider integration | Separate static artifact/project retained; no automatic PRD code deployment on main push                                   |
| UAT Worker            | GitHub variable `UAT_PUBLIC_BACKEND_BASE_URL` is `https://blackbox-records-backend-uat.blackboxrecordsathens.workers.dev`                             | Same isolated Worker; allowlist, email-brand/media URLs updated for verified UAT Pages origin                              |
| PRD Worker            | GitHub variable `PRD_PUBLIC_BACKEND_BASE_URL` is `https://blackbox-records-backend-prd.blackboxrecordsathens.workers.dev`                             | Same isolated Worker; compatible candidate artifact, independent launch controls                                           |
| D1                    | Config binds `COMMERCE_DB` separately to `blackbox-records-commerce-uat` and `blackbox-records-commerce-prd`                                          | Preserve isolation and operational state; no UAT-to-PRD data copying                                                       |
| Provider/email policy | Profiles use UAT Stripe test mode with managed UAT email sink; PRD live mode with direct routing                                                      | Unchanged                                                                                                                  |
| Main push             | Builds both public targets and staff; deploys UAT, PRD public, and staff                                                                              | Verify/build candidate and deploy UAT only                                                                                 |
| PRD code selection    | Optional `artifact_commit_sha`, falling back to triggering SHA; target defaults to `all`                                                              | Explicit full candidate SHA/run and false-by-default code confirmation; consume matching retained artifact                 |
| PRD catalog           | Separate false-by-default `confirm_live_catalog_changes` and CLI confirmation                                                                         | Unchanged and independent of code promotion                                                                                |
| Checkout              | Launch approval plus runtime feature gate                                                                                                             | Unchanged; code promotion cannot enable checkout                                                                           |

The Cloudflare Pages account inventory returned only the existing public and staff projects. The intended UAT project was absent. Local credentials support project listing; this does not prove the future GitHub UAT deploy credential's write scope. No proposed UAT origin was committed to runtime configuration.

The current profile in `apps/backend/src/env.ts` carries Worker/provider/email policy, but no static hosting target field. Static origins also appear in Astro config, workflow build env, `verify-environment-model.ts`, Wrangler checkout/email vars, and smoke defaults. Section 2 must reconcile those through existing helpers.

## Credential names and scope

| Store                          | Observed secret names                                                                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub repository              | `CLOUDFLARE_API_TOKEN`, `DECAPBRIDGE_AUTH_ENDPOINT`, `DECAPBRIDGE_AUTH_TOKEN_ENDPOINT`                                                 |
| GitHub `catalog-promotion-uat` | `CLOUDFLARE_API_TOKEN`, `STRIPE_SECRET_KEY`                                                                                            |
| GitHub `catalog-promotion-prd` | No environment secrets returned                                                                                                        |
| GitHub `prd-holding`           | `CLOUDFLARE_API_TOKEN`                                                                                                                 |
| UAT Worker                     | `RESEND_API_KEY`, `RESEND_NEWSLETTER_TOPIC_ID`, `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| PRD Worker                     | `CF_ACCESS_POLICY_AUD`, `CF_ACCESS_TEAM_DOMAIN`, `RESEND_API_KEY`, `RESEND_NEWSLETTER_TOPIC_ID`                                        |

CI also references non-secret `CLOUDFLARE_ACCOUNT_ID`, `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID`, `SVELTIA_AUTH_BASE_URL`, and the separate UAT/PRD backend URL variables. Public/staff deploy jobs currently use the repository Cloudflare credential without a GitHub environment; catalog jobs use their target environments. Presence of a secret name does not establish its permission scope or provider readiness. PRD Stripe secrets were absent from the Worker listing; no live preparation was attempted.

## Workflow and planning reconciliation

- `pages.yml` already owns `smoke-uat`, following `deploy-uat`, with fixed-price and pay-what-you-want paid scenarios, newsletter smoke, and static smoke from the selected source SHA.
- `uat-smoke.yml` is manual-only. It retains a stale `github.event.workflow_run.head_branch` concurrency expression and cancellation enabled. It must not become a second candidate-acceptance invocation.
- `uat-static-smoke.yml` is also manual-only and defaults to the existing GitHub Pages URL. Its static checks are read-only.
- `prd-holding-page.yml` is manual, isolates `dist-holding`, and uses the `prd-holding` environment for its optional deploy.
- This change's tooling delta still explicitly requires a downstream `workflow_run` smoke invocation, contradicting the completed catalog replacement's single-workflow ownership. Requested decision: retain the existing in-workflow smoke and update this delta before implementing its dependent promotion contract.
- Section 1.3 requests tests that fail against today's automatic PRD path; section 3 owns the implementation that makes those assertions pass. Any change to that section boundary or acceptance-test staging must be explicit; no skipped or inverted tests were added to disguise missing behavior.
- Scoped inspection found no literal GitHub Pages origin in the active production-go-live planning artifacts. Its exact-SHA launch and independent approval rules remain relevant. `complete-shopper-purchase-information/evidence.md` records the current hosts as evidence; retain that historical observation. No unrelated task status, approvals, or historical evidence was edited.

Account inventory used GitHub metadata/secret-name listing and the documented [Wrangler Pages project listing command](https://developers.cloudflare.com/workers/wrangler/commands/pages/). No project, credential, DNS, Access policy, Worker, D1, or provider state was changed.

## Section 1 continuation — 2026-09-12

The user authorized correcting this and subsequent planning errors without another routine approval pause. The tooling delta and design now preserve `pages.yml` as the single candidate smoke owner. Section 1.3 now explicitly pairs its tests with initial request guards; full artifact promotion remains section 3 rather than being represented as complete.

- Added a workflow contract regression, observed it fail against the previous `target=all` behavior, then made it pass with UAT as the default and explicit PRD public/staff deployment conditions. Both deployment conditions exclude pushes and require independent code confirmation, explicit source SHA, and candidate run ID.
- A pre-checkout guard validates full SHA/numeric run ID and uses GitHub's run API to verify successful completion, exact SHA, canonical workflow, `main`, supported event, and matching repository/head repository before provider mutations can pass their unit-test dependency. The selected-source guard has no triggering-SHA fallback. A read-only check of recorded run `34667202133` confirmed the API fields used by the guard.
- Tests retain separate live-catalog confirmation and reject code confirmation as a substitute for it. Neither launch approval nor runtime checkout enablement is written by the workflow.
- Updated only the affected go-live design, exact-tree scenario, and task 4.7. Every existing go-live checkbox state and historical evidence file remains unchanged. No separate active validation change was present in the inventory.
- `pnpm test:unit`, `pnpm check`, and `pnpm build` passed, including workflow contracts, module/dependency/commerce boundaries, static cache policy, and public/staff route isolation. Both affected changes pass strict OpenSpec validation; formatting and `git diff --check` passed. Existing deprecation notices were unrelated to this slice. Section 1 is complete (4/22 tasks overall).

This intermediate workflow still rebuilds from the selected SHA; it does not yet consume retained candidate artifacts or prove current UAT/configuration identity. It must not be accepted as the completed Software Release promotion mechanism. Cloudflare UAT provisioning, cutover, and all hosted acceptance remain outstanding. Nothing was pushed or deployed.
