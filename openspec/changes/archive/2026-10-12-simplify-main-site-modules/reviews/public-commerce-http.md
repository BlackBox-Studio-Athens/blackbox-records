# Public-commerce-http — complete received review

Reviewer thread: `01a125cc-6d51-7991-87b7-d1d8dccedbd9`.
Review turn: `01a125cc-78bb-7062-978d-3010c0f55ef8`.
Immutable source: `.codex-artifacts/simplification/28-public-commerce-http-review.result.json`.
Raw source SHA-256: `f76f134d6809176d5776705fbf5d65b358710070d92c7c8e787ed7d0b5fe0e7a`.
Implementer: `01a126b3-3cda-7830-a165-1c382f231fc2`.

The complete received review follows verbatim; findings are historical proposals. Current implementation decisions and combined precursor accounting are in `../implementations/public-commerce-http.md`.

What this module does: `public-commerce-http` composes the public commerce, newsletter, inquiry, withdrawal, internal catalog and Stripe webhook HTTP routes, their contracts, and paid-checkout persistence adapter. This read-only review covered the whole assigned module and identified four deletion-focused simplifications that preserve its existing behavior.

Work remained in the existing checkout on `main`. No source, test, project, task, report, artifact or graph files were written. No project tests, shared validation or hosted operations were started.

The human’s latest clarification is incorporated: the paid-line grouping rewrite is deferred because it would need additional meaningful regression coverage and does not establish a net code reduction.

**Expected reductions if the four findings are implemented**

| Finding                                           | Production lines removed, net | Test lines removed, net | Files added/deleted |
| ------------------------------------------------- | ----------------------------: | ----------------------: | ------------------: |
| 1. Reuse the existing cancel-URL policy           |                            29 |                       0 |                   0 |
| 2. Inline the one-use catalog identity projection |                            10 |                       0 |                   0 |
| 3. Remove fixture-only and subsumed assertions    |                             0 |                      17 |                   0 |
| 4. Consolidate identical unmatched-route requests |                             0 |                      15 |                   0 |
| **Total**                                         |                        **39** |                  **32** |               **0** |

The proposed changes affect four existing files and remove **71 lines net**. These counts come from literal in-memory edits against the captured sources. Formatting the sketches produced the same counts: **zero formatting credit**. Required audit Markdown is excluded. Nothing has been applied, and these are proposed reductions rather than implementation results.

1. **Should fix — delete the duplicated success-URL selection policy.**

   **Source and caller evidence:** [routes/public-checkout-return-url.ts:11](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/interfaces/http/routes/public-checkout-return-url.ts:11), lines 11–46, duplicates the policy in `createPublicCheckoutCancelUrl`, lines 48–83. Both functions resolve the same allowed targets, inspect the same referrer, normalize the same checkout path, select the same base URL, and perform the same Origin/request-URL fallback. Their output suffixes are the only difference. The private success-path constant is at line 9.

   The production caller is [routes/register-public-commerce-routes.ts:255](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/interfaces/http/routes/register-public-commerce-routes.ts:255), lines 255–269. It evaluates the cancel URL and then the success URL while constructing the same checkout command. Lines 376–387 translate a `CheckoutConfigurationError` into the existing logged `checkout_unavailable` HTTP 409 response; lines 391–392 retain cleanup.

   **Smaller change:** Keep both exported functions and their signatures. Replace the success function’s duplicated body with the existing cancel URL followed by the exact suffix `return/?session_id={CHECKOUT_SESSION_ID}`. Delete the now-unused private `CART_CHECKOUT_RETURN_PATH` constant. Leave the cancel function and its policy helpers unchanged. This uses an existing implementation and adds no abstraction.

   **Behavior to preserve:** The defaults for missing or blank configuration; normalization and filtering of configured targets; first-match selection when an origin appears more than once; approved-referrer priority; legacy item and cart checkout paths; encoded slugs; nested deployment base paths; trailing slashes; the literal Stripe session token; lazy request-URL parsing; and the exact error class and message. Preserve the caller’s evaluation order, logging, HTTP response and cleanup. Keep the exported `readAllowedCheckoutReturnOrigins` function.

   **Proof and focused validation:** A source-derived in-memory comparison checked 2,400 combinations of configuration, referrer, Origin and request URL. Existing and proposed forms produced equal URLs or equal error names/messages. The error class was stubbed for this pure probe, so it is not runtime acceptance. Existing regression evidence is in `routes/public-checkout-return-url.worker.test.ts:11–93` and `routes/public-commerce-routes.test.ts:697–733`, `823–850`, `1110–1141` and `1143–1174`. A fresh implementer should run those files through `pnpm test`, retaining the paired success/cancel, base-path and rejected-origin cases.

   **Expected net reduction:** 29 production lines; no test additions or deletions; zero files.

2. **Nice to have — delete the one-use catalog object identity adapter.**

   **Source and caller evidence:** [routes/stripe-webhook-acknowledgement.ts:77](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/interfaces/http/routes/stripe-webhook-acknowledgement.ts:77), lines 77–92, already binds `const object = event.catalogObject`. Line 83 calls the private `readCatalogObjectIdentity` helper solely to pass its two returned properties into `recordCatalogWebhookEvent` at lines 86–87. The helper at lines 255–262 only reads `catalogObject.id` and evaluates `catalogObject.object === 'price' ? 'price' : 'product'`. This is its sole caller.

   The connected verifier is `apps/backend/src/infrastructure/stripe/stripe-webhook-verifier.ts:23–43` and `76–130`. The HTTP route verifies the raw payload before acknowledgement in `routes/register-stripe-webhook-routes.ts:28–50`. The projection performs no additional validation, provider access, normalization or persistence.

   **Smaller change:** Pass `object.id` and the existing exact price/product ternary directly to `recordCatalogWebhookEvent`. Delete the local `catalogObjectIdentity` binding and the private helper. Keep the service input type and other interfaces.

   **Behavior to preserve:** Keep the ternary’s existing fallback to `'product'`; do not substitute a differently interpreted discriminator. Preserve product-parent resolution, the store-item lookup, event timestamp conversion, journaling before duplicate handling, duplicate-success acknowledgement, ignored-event handling, drift reconciliation, failure marking and retries. Raw-body signature verification remains untouched. Stripe’s documented requirements for the original payload and duplicate-event handling support retaining those boundaries. [Stripe webhook documentation](https://docs.stripe.com/webhooks)

   **Focused validation:** Run `routes/stripe-webhook-acknowledgement.worker.test.ts` and `routes/stripe-webhook-routes.test.ts`. Retain the price/product event cases around acknowledgement-test lines 133–158, unbound/duplicate/retry/drift cases at 160–206, and signed route cases at 592–660. No new test is needed merely to preserve this two-field projection.

   **Expected net reduction:** 10 production lines; no test changes; zero files.

3. **Should fix — delete assertions that inspect only their own fixture or repeat complete JSON expectations.**

   **Source evidence:** [routes/public-commerce-routes.test.ts:480](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/interfaces/http/routes/public-commerce-routes.test.ts:480) contains three independently proven removals:

   - **Lines 539–547:** The `allowed` array and `Object.keys(record)` assertion inspect the locally constructed fixture at lines 529–535. They do not inspect parsed output or an HTTP response. The fixture’s keys are already written explicitly in that test. Keep `schema.parse([record]).toEqual([record])` at line 536 and the missing-preorder rejection at lines 537–538.
   - **Lines 480–482:** The private-field regex follows a complete deterministic JSON response expectation at lines 457–479. The response has been JSON-parsed, and the retained expectation fixes all represented keys and values; none of its expected values matches the forbidden alternatives. A represented extra private field or forbidden value already fails that expectation.
   - **Lines 1275–1279:** Five serialized-body privacy assertions follow the complete checkout-state expectation at lines 1266–1274. Its preorder values come from the fixed matrix at lines 1244–1248, and its locker fixture is fixed. Keep the response/schema compatibility check at lines 1280–1281, missing-preorder rejection at 1282–1291, and exact reader-call assertion at 1292.

   **Smaller change:** Delete only those 17 assertion/scaffolding lines. Delete no test case, fixture matrix, production code, schema assertion, request assertion or meaningful privacy case.

   **Behavior and coverage to preserve:** Keep HTTP status, no-store caching, links, reader scope, complete response projections and preorder requirements. Do not generalize this removal to privacy checks beside `toMatchObject`, `expect.any(String)` or other unconstrained expectations, or to independent logging-redaction checks. Those can have distinct regression value.

   **Focused validation:** Run `pnpm test apps/backend/src/interfaces/http/routes/public-commerce-routes.test.ts`. Confirm the complete JSON expectations and schema rejection checks remain in their existing scenarios. The public frontend consumer, `packages/api-client/src/public-client.ts`, continues to receive the same contract and no-store responses; no client or generated-contract edit is proposed.

   **Expected net reduction:** 17 test lines; zero production lines; no test cases removed; zero files.

4. **Nice to have — combine three identical unmatched-route requests while retaining every assertion.**

   **Source and connected evidence:** [app.worker.test.ts:39](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/interfaces/http/app.worker.test.ts:39), lines 39–70, creates three fresh apps and sends the same request to `http://backend.test/nope`, without method, headers or bindings differences. The cases separately check HTTP 404/no-store, the complete problem-details body/no-store, and `application/problem+json`.

   The implementation registers the fallback handlers in `app.ts:61–62`. The connected `apps/backend/src/platform/interfaces/http/not-found-handler.ts:6–11` delegates to the shared JSON error response; `responses.ts:355–367` supplies the problem response and no-store behavior. These three test requests exercise one identical fallback path.

   **Smaller change:** Retain the full-body case at lines 48–62. Add the existing status and content-type assertions to that case, before consuming the body. Delete the other two request/setup wrappers. Retain the no-store helper assertion and complete problem body.

   **Behavior and coverage to preserve:** Preserve HTTP 404, the exact RFC problem-details JSON, `Cache-Control: no-store`, and the problem JSON content type. Keep the separate `/api/...` fallback, request-ID/logging, CORS, preflight and internal stock UI-boundary tests: their request paths or conditions differ.

   **Focused validation:** Run `pnpm test apps/backend/src/interfaces/http/app.worker.test.ts`. The three cases become one case with all meaningful assertions retained, removing two duplicate app constructions and requests.

   **Expected net reduction:** 15 test lines; zero production lines; zero files.

**Rejected or deferred ideas**

- **Paid-line grouping rewrite deferred.** `routes/d1-paid-checkout-finalization-repository.ts:613–639` uses three maps and two first-line searches per variant. A single existing `GroupedLineItem` map can preserve the first VAT/rate, last unit amount, input-order sums, first-seen variant ordering and deferred aggregate quantity validation. An in-memory comparison found no differences across 2,118 cases; 100 synthetic unique lines reduced the `.find` predicate count from 10,100 to zero. However, the sketch removes only five production lines. Existing owned finalizer coverage in `setup-provider-recovery.worker.test.ts:182–227` and connected checkout integration coverage do not establish all legacy duplicate-line and multi-variant ordering behavior. Adding those meaningful tests would add code, and no material end-to-end performance benefit was measured. It is therefore excluded from the actionable findings and all reduction totals.
- **Keep D1 pre-reads, conditional statements and post-write reads.** `d1-paid-checkout-finalization-repository.ts:212–300` distinguishes missing, paid, non-pending, stock-unavailable, concurrent replay and transitioned outcomes. Its monetary checks, including duplicate-line rejection at line 244, and batch fences at lines 303–510 are persistence and concurrency safeguards. Removing or merging them is not proven redundant.
- **Keep checkout selector validation.** `contracts/public-contracts.ts:203–211` permits optional line/legacy selector fields. The primary-line rejection in `register-public-commerce-routes.ts:200–239` therefore handles a reachable input; it is not a dead internal check.
- **Keep fresh stock reads and provider policies.** `public-commerce-services.ts:74–85` combines stock and holds; delivery quotation at lines 125–163 performs its own current validation. Reusing an earlier offer result could change availability. Public reconciliation’s bounded provider policy and checkout’s different retry policy are intentionally covered by `public-commerce-services.worker.test.ts`.
- **Keep authentication, schema and same-origin ordering.** The price, setup and publication routes contain similar origin checks, but a new generic middleware could move rejection ahead of existing validation and change 400/403 precedence, construction or work performed. Nested operator-auth and operator-stock implementations remain outside this assignment.
- **Keep lazy construction, cleanup, provider rereads and outbox ordering.** Moving service construction into or out of catches can alter error translation. The Prisma binding scope can retain a shared client while standalone clients retain cleanup responsibilities. Webhook provider rereads, recovery, journaling, finalization and retryable failures are behavior-bearing; committed delivery failures and withdrawal background delivery also have distinct acknowledgement semantics.
- **Keep separate CMS gateways and trust-boundary projections.** Source selection, setup fallback and publication acceptance have different identifier/fingerprint requirements, 404 behavior, conflict translation and response-body cancellation. Publication forwarding deliberately restricts credentials. Newsletter, inquiry and withdrawal validation, limits and public projections are not removable merely because another layer also validates data.
- **Do not unify CORS with checkout defaults.** `app.ts:67–75` accepts its configured origin list. The checkout helper supplies Local/UAT defaults under different conditions. Sharing that implementation could broaden browser access.
- **Retain meaningful delegated tests.** Internal orders/stock HTTP tests, authenticated boundary cases, signed webhook verification, OpenAPI separation, provider recovery, immutable replay, preorder and redaction cases exercise distinct behavior. None is proposed for deletion.

**Inspection coverage**

Ownership was established from `apps/backend/src/interfaces/http/project.json`, the nested auth/stock project roots and the module-boundary contract. The owned set contains **43 files: 22 production TypeScript files, 20 test files and one project definition**. Every owned production and test body was inspected. Nested `auth/` and `stock/` implementations were excluded from edits and read only where connected behavior required it. Generated code, migrations, content, staff/CMS implementation changes and operational tooling changes are excluded.

The following inventory is relative to `apps/backend/src/interfaces/http/`:

- **Root:** `app.ts`, `project.json`; tests `app.worker.test.ts`, `email-runtime-services.worker.test.ts`, `internal-order-routes.test.ts`, `internal-price-routes.worker.test.ts`, `internal-stock-routes.test.ts`, `internal-stock-ui-boundary.worker.test.ts`, `operator-access-middleware.worker.test.ts`, `public-services-inquiry-routes.worker.test.ts`, `setup-provider-recovery.worker.test.ts`, `withdrawal-routes.worker.test.ts`.
- **Contracts/OpenAPI:** `contracts/public-contracts.ts`, `contracts/services-inquiry-contract.worker.test.ts`, `openapi/api-documents.ts`, `openapi/api-documents.worker.test.ts`.
- **Route production:** `routes/cms-item-publication-gateway.ts`, `cms-item-source-gateway.ts`, `d1-paid-checkout-finalization-repository.ts`, `public-checkout-return-url.ts`, `public-commerce-services.ts`, `public-newsletter-services.ts`, `public-services-inquiry-services.ts`, `register-internal-price-routes.ts`, `register-internal-publication-routes.ts`, `register-internal-routes.ts`, `register-internal-setup-routes.ts`, `register-public-commerce-routes.ts`, `register-public-newsletter-routes.ts`, `register-public-routes.ts`, `register-public-services-inquiry-routes.ts`, `register-stripe-webhook-routes.ts`, `register-withdrawal-routes.ts`, `stripe-webhook-acknowledgement.ts`, `stripe-webhook-services.ts`.
- **Route tests:** `routes/cms-item-source-gateway.worker.test.ts`, `initialize-catalog-price.worker.test.ts`, `public-checkout-return-url.worker.test.ts`, `public-commerce-routes.test.ts`, `public-commerce-services.worker.test.ts`, `stripe-webhook-acknowledgement.worker.test.ts`, `stripe-webhook-routes.test.ts`, `stripe-webhook-services.worker.test.ts`.

Connected flow reads traced entry/preflight routing into the persistent commerce runtime; public offer, quotation and checkout readers; checkout URLs and error translation; operator authorization and delegated stock/order routes; CMS setup and publication gateways; signature verification and provider reconciliation; D1 paid transition/replay/concurrency; email/outbox lifetime; and the browser client. The full connected D1 finalization integration suite and internal setup HTTP integration test were also inspected. CMS worker reads were limited to the relevant routing consumers.

**Source identities and stability**

The checkout was `main`, HEAD `1dc943972e0c8cd28bc82c3d16bc964909d37963`, at the closing Git audit. Owned Git status was empty. All 43 owned and 41 selected connected file hashes still matched at **2026-10-10 13:04:18.038 UTC**; no owned path was added or removed. This establishes the reviewed source bytes, not stability of unrelated concurrent work.

| Captured set                                       | Files | SHA-256 aggregate                                                  |
| -------------------------------------------------- | ----: | ------------------------------------------------------------------ |
| Owned module, excluding nested auth/stock roots    |    43 | `c7b0274cec51a50d633ac656331b61f989ab92d57ae5d0682e967d282d768c60` |
| Immediate imports and selected connected consumers |    32 | `15f8939c42794b78da23e564e3732c310cbad97e72fcb1dc2f33c25fe2ce62ef` |
| Additional implementation bodies                   |     9 | `f014e2c3477b9d8cb7b90568c3d3e8ced1f35b3b4b8206faf263b011f8f5cd31` |
| Combined selected connected set                    |    41 | `68e725e190567cde4097197358fb4e5d3be86c2c45c2e13e451d29d9f07a1153` |

Each file identity is SHA-256 of its bytes. Aggregates hash UTF-8 rows containing relative path, NUL, file hash and LF in sorted order; the combined connected set uses JavaScript `localeCompare(..., 'en')` path ordering. Owned stability spans 12:36:13.806–13:04:18.038 UTC; the 32-file and nine-file connected baselines were captured at 12:47:46.967 and 12:57:01.519 UTC respectively.

| Actionable target, relative to the owned root | File SHA-256                                                       |
| --------------------------------------------- | ------------------------------------------------------------------ |
| `routes/public-checkout-return-url.ts`        | `783e76d72da3af60b71cc9b54bbb1b7845550b62df4eaad6d8fa7cad4e0eed71` |
| `routes/stripe-webhook-acknowledgement.ts`    | `033471d3bcdb86c47a316d2ec01ba9c8ad5e7441863e2324405f91e20fbba18e` |
| `routes/public-commerce-routes.test.ts`       | `edfa2cd72392e5c7f5aff41b64eedf33212b2805f070e0322fc0f8656bfaa792` |
| `app.worker.test.ts`                          | `505d84d8ea5493e927a1b2c404e49c1e40c213089f455657c3b7b151dd418d48` |

The selected connected set consists of these exact repository-relative paths:

```text
apps/backend/src/application/commerce/catalog-sync/index.ts
apps/backend/src/application/commerce/checkout/feature-flags/index.ts
apps/backend/src/application/commerce/checkout/index.ts
apps/backend/src/application/commerce/checkout/readers/index.ts
apps/backend/src/application/commerce/checkout/read-store-offer.ts
apps/backend/src/application/commerce/checkout/request-availability-alert.ts
apps/backend/src/application/commerce/orders/index.ts
apps/backend/src/application/commerce/orders/register-internal-order-routes.ts
apps/backend/src/application/commerce/orders/paid-checkout-finalization.ts
apps/backend/src/application/commerce/orders/apply-paid-checkout-reconciliation.ts
apps/backend/src/application/commerce/orders/reconcile-monetary-snapshot.ts
apps/backend/src/application/email/index.ts
apps/backend/src/cms-worker.ts
apps/backend/src/domain/commerce/index.ts
apps/backend/src/domain/commerce/repositories/spi.ts
apps/backend/src/domain/commerce/quantities.ts
apps/backend/src/index.ts
apps/backend/src/infrastructure/persistence/d1-availability-alert-repository.ts
apps/backend/src/infrastructure/persistence/d1-checkout-stock-hold-repository.ts
apps/backend/src/infrastructure/persistence/d1-order-withdrawal-repository.ts
apps/backend/src/infrastructure/persistence/d1-paid-order-delivery-repository.ts
apps/backend/src/infrastructure/persistence/prisma/index.ts
apps/backend/src/infrastructure/persistence/prisma/create-prisma-client.ts
apps/backend/src/infrastructure/resend/index.ts
apps/backend/src/infrastructure/stripe/index.ts
apps/backend/src/infrastructure/stripe/stripe-webhook-verifier.ts
apps/backend/src/interfaces/http/auth/index.ts
apps/backend/src/interfaces/http/auth/operator-access-middleware.ts
apps/backend/src/interfaces/http/stock/internal-contracts.ts
apps/backend/src/interfaces/http/stock/register-internal-stock-routes.ts
apps/backend/src/platform/env.ts
apps/backend/src/platform/interfaces/http/error-handler.ts
apps/backend/src/platform/interfaces/http/not-found-handler.ts
apps/backend/src/platform/interfaces/http/responses.ts
apps/backend/src/platform/observability/index.ts
apps/backend/test/fixtures/current-paid-checkout-order.ts
apps/backend/test/integration/catalog-sync/internal-setup-routes.worker.test.ts
apps/backend/test/integration/checkout/d1-paid-checkout-finalization-repository.worker.test.ts
apps/backend/test/support/commerce-value-objects.ts
packages/api-client/src/public-client.ts
scripts/fixtures/prose.ts
```

**Evidence limits and fresh implementation handoff**

Both existing Graphify and CodeGraph were used before substantive source investigation. Graphify queries used budget 2500. An initial lexical traversal truncated; focused explains and complete bounded incident-edge reads resolved the relevant public-route, webhook-service, service-factory, app and internal-route relationships. No graph was initialized, rebuilt, refreshed or enriched by this thread. CodeGraph source/test elisions were filled with exact bounded reads; a final setup-test query returned unrelated symbols, so its requested source was read directly.

The saved Ponytail review guidance, applicable harness/repository instructions, relevant commerce/domain specs and module project definitions were read. Cloudflare, Workers, Durable Objects and Stripe guidance was consulted. Stripe’s documentation CLI returned HTTP 401; official public documentation supplied the fallback. Cloudflare’s guidance was used to retain response-affecting work and background-work distinctions. [Cloudflare Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)

No project test, lint, type, D1 integration, browser, provider or release acceptance is claimed. The pure probes and formatting sketches only support the stated local equivalence and deletion counts. A fresh implementation thread should recheck these source identities, independently verify the four findings, run the required OpenSpec guard before edits, and obtain focused `pnpm test public-commerce-http` evidence or the affected file-level evidence described above. Shared validation and task acceptance remain with the assigned verifier.

**Verdict:** Four proven, isolated deletion-focused findings are ready for fresh implementation review. Expected reduction is **39 production lines plus 32 test lines, 71 net lines and zero net files**, with exact behavior and meaningful regression coverage retained.
