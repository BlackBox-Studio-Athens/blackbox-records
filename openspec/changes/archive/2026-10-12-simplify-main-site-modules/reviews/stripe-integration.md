Review preservation: reviewer `01a1259d-cebc-7921-9d1a-aa11493d5937`, turn `01a1259d-d625-7e82-9a97-5d152059b436`. Immutable source: `.codex-artifacts/simplification/24-stripe-integration-review.result.json`, SHA-256 `fb42bba3356aab4dca488411ef93a7a374cd76f3ddfff901efa0b249076720e8`. The complete received Markdown report follows; its historical outcome and limitations are retained.

What this change does: This task reviews the whole `stripe-integration` module without editing it. The module constructs Stripe Checkout and catalog requests, converts provider data into internal contracts, and verifies signed webhook events.

The review found **five production simplifications and one cleanup of test scaffolding**. No test deletion is justified. All recommendations preserve the current interfaces, provider requests, validation, ordering, error handling, and persistence behavior.

**Source identity and review limits**

- Module: **24/29 — `stripe-integration`**, read-only review.
- Checkout: `C:/Users/SVall/WebstormProjects/blackbox-records`, branch `main`.
- Reviewer thread: `01a1259d-cebc-7921-9d1a-aa11493d5937`.
- HEAD: `3355c335226838f996efb5536f55271f819a3e14`.
- Closing source snapshot: `2026-10-10T14:59:07+03:00`.
- Owned-scope fingerprint, including `project.json`: `f2bc96dfe3082a16d901c6dc306ad7c917b824720f5292678469bdbd1a8901c9`.
- Captured caller/dependency fingerprint: `e7ec11cf94627e4e2884744837dbea7b5112b6c68e36655ffcf93cbc35761d07`.

All ten owned files matched their initial SHA-256 hashes at the closing snapshot. The 29 captured caller/dependency files also matched their earlier snapshot. HEAD remained unchanged, and Git reported no changes under the owned root. Changes elsewhere in the shared checkout were observed and left alone.

Each aggregate fingerprint is SHA-256 over sorted `relative/path:lowercase-file-sha256` entries joined with LF, without a terminal LF. Owned paths use `/` separators.

No repository file, OpenSpec task/report, graph, or generated output was written. No test, build, formatter, validation command, or provider acceptance scenario was executed. The parent and persistent verification thread retain ownership of report persistence, shared checks, and task updates.

**Inspected scope**

Ownership is `apps/backend/src/infrastructure/stripe`. There are five production TypeScript files, four owned test files, and the module declaration. No nested module root appeared in the inventory.

| Owned file                               | Inspection                                                                                                                                                                                                                  |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`                               | All public exports and exported types; compatibility with runtime and operational consumers                                                                                                                                 |
| `project.json`                           | Closed boundary, `./index.ts` entry point, test targets, and allowed dependencies                                                                                                                                           |
| `stripe-catalog-gateway.ts`              | Entire source: account migration, setup inspection/creation, replacement-price recovery and selection, default/individual Price reads, UAT bootstrap, Product Projection updates, pagination, converters, and error helpers |
| `stripe-checkout-gateway.ts`             | Entire source: monetary-policy validation, legacy request fallback, request payload, expiry/idempotency, creation failures, Session reads/expiry, line pagination/conversion, and client configuration                      |
| `stripe-checkout-session-state.ts`       | Entire source: monetary evidence, customer fallback, collected shipping, metadata, PaymentIntent identity, and null/string handling                                                                                         |
| `stripe-webhook-verifier.ts`             | Entire source: configuration/signature errors, raw-body verification, event allowlists, and returned discriminated shapes                                                                                                   |
| `stripe-catalog-gateway.worker.test.ts`  | Entire source: timeout, absence/error distinction, interrupted bootstrap, default authority, creation parameters, custom amounts, and request evidence                                                                      |
| `stripe-checkout-gateway.worker.test.ts` | Entire source: client configuration, shipping/tax policies, missing evidence, pagination, malformed lines, SDK retries, failure classification, accepted identity, and Checkout payload                                     |
| `stripe-price-change.worker.test.ts`     | Entire source: fixed/custom recovery, historical-price preservation, conflicts, default races, bounded inspection, invalid money, and tax-code rejection                                                                    |
| `stripe-setup-product.worker.test.ts`    | Entire source: lost acknowledgements, live/test mode, input fingerprints, paused Products, and uncertain retrieval failures                                                                                                 |

The production files contain 1,222 lines and the owned tests contain 1,319 lines by the closing `Get-Content` counts.

The module permits dependencies on `catalog-sync`, `checkout-core`, `commerce-domain`, and `backend-platform`. None of the recommendations changes that boundary or its public entry point.

Connected caller bodies and interfaces were inspected in the public commerce services, webhook services/routes/acknowledgement, internal setup/price/publication composition, Checkout request construction and reconciliation, catalog reconciliation/setup/initialization/price changes/publication, and catalog mutation-context helpers. Operational consumer reads included `migrate-stripe-account.ts`, `migrate-catalog-product-bindings.ts`, `backfill-runtime-catalog.ts`, `stripe-catalog-verify.ts`, and webhook-endpoint verification.

Connected regression evidence included the complete Session-state shipping test, webhook-route test, and webhook-simulator test, plus relevant account-migration recovery/conflict cases and the paid-finalization shipping/replay case. Those external tests and consumers are outside this module’s editing scope.

**Should fix — proven redundancy**

1. **Use the SDK’s existing Price type instead of duplicating it.**

   **Locations:** [stripe-catalog-gateway.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/infrastructure/stripe/stripe-catalog-gateway.ts:26), lines 26–28, 415–419, 536, 569, and 699.

   **What this is / problem:** `StripePriceWithExpandedProduct` intersects `Stripe.Price` with a `product` field that already has exactly that type. The alias then requires two unnecessary assertions and repeats the type in converter signatures.

   **Proof:** Installed Stripe version `22.6.2` declares `Price.product` as `string | Product | DeletedProduct`; `prices.retrieve` returns `Response<Price>` and `prices.list` returns `ApiListPromise<Price>`. The local declaration at `apps/backend/node_modules/stripe/esm/resources/Prices.d.ts:88` matches the [official Stripe 22.6.2 source](https://raw.githubusercontent.com/stripe/stripe-node/v22.6.2/src/resources/Prices.ts). The alias is private and adds no expanded-product guarantee—it still allows a string.

   **Smaller implementation:** Delete the alias, remove both `as StripePriceWithExpandedProduct` assertions, accept `Stripe.Price` in `toCatalogPrice`, and use `Stripe.Price['product']` in `getActiveProduct`.

   **Behavior and coverage to retain:** Keep both expansion requests, the string/deleted-product handling, metadata filtering, tax-code normalization, and request/idempotency evidence. Catalog reconciliation and migration consumers receive the same mapped fields. This changes only types and assertions; emitted runtime behavior is unchanged.

   **Focused checks / expected reduction:** Run the owned catalog, price-change, and setup suites, followed by guarded affected type checking through the persistent verifier. Approximately **four declaration/blank lines and two assertions** disappear. If skipped, the duplicated SDK contract remains a maintenance burden.

2. **Map finalized Checkout lines directly.**

   **Location:** [stripe-checkout-gateway.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/infrastructure/stripe/stripe-checkout-gateway.ts:164), lines 164–190.

   **What this is / problem:** `readCheckoutSessionLineItems` uses `flatMap`, but every successful callback returns an array containing exactly one converted object. It creates a temporary array for every line and performs flattening that is never needed.

   **Proof:** The callback either throws for an incomplete line or returns one object. It never filters a line or expands one into multiple results. Pagination first appends provider pages to `stripeLineItems` in order. `stripe-webhook-services.ts:65–82` passes the resulting line array to paid reconciliation, where cardinality, order, quantities, and monetary evidence matter.

   **Smaller implementation:** Replace `flatMap` with `map` and return the existing object directly. Keep the callback’s guard and every field expression unchanged.

   **Behavior and coverage to retain:** Preserve complete pagination before conversion, repeated/incomplete cursor errors, malformed-line rejection, branded quantity/Price-ID parsing, custom bounds, null monetary evidence, and all tax/discount fields. Retain the owned pagination/custom-bound case at test lines 206–241, malformed-line case at 243–257, and exact finalized-line result at 526–564.

   **Focused checks / expected reduction:** Run `stripe-checkout-gateway.worker.test.ts` and the connected paid-reconciliation checks selected by the verifier. Approximately **two source lines**, one temporary array per returned line, and the flattening operation disappear. No latency improvement is claimed without measurement. If skipped, the unnecessary allocations remain.

**Nice to have — smaller internal work**

3. **Let the existing optional-string helper validate and trim once.**

   **Location:** [stripe-checkout-session-state.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/infrastructure/stripe/stripe-checkout-session-state.ts:29), lines 29–31 and 75–76.

   **What this is / problem:** The fallback email is checked with `typeof` before reaching `readOptionalString`, which performs the same check. For each nonblank string, the helper calls `trim()` twice.

   **Proof:** Passing a non-string directly to the helper still returns `null`; converting it to `null` first adds no validation. For native strings, both current trim calls produce the same value. Every caller of this private helper uses its string-or-null result, including names, contact fields, shipping fields, URLs, and selected metadata.

   **Smaller implementation:** Use `readOptionalString(session.customer_email)` for the fallback. The helper can be `return typeof value === 'string' ? value.trim() || null : null;`.

   **Behavior and coverage to retain:** Keep the helper’s runtime type check, whitespace-to-null behavior, primary `customer_details.email` preference, and `??` fallback. Shipping continues to come exclusively from `collected_information.shipping_details`. The connected shipping test covers missing/unsupported shipping and empty recipient names; the paid-finalization case preserves committed shipping facts on replay.

   **Focused checks / expected reduction:** Run the owned Checkout suite and `stripe-checkout-session-state.worker.test.ts`. Verify blank/whitespace primary email, trimmed fallback email, non-string values, and null shipping remain equivalent at the public converter boundary. This removes one duplicated precheck and one trim call per nonblank value; formatting may remove **up to two lines**. If skipped, the repeated validation and string scanning remain.

4. **Avoid uppercasing an already normalized private Price value.**

   **Location:** [stripe-catalog-gateway.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/infrastructure/stripe/stripe-catalog-gateway.ts:632), lines 632–645; producer at 581 and callers at 467 and 667.

   **What this is / problem:** `matchesCatalogPriceInput` uppercases `price.currencyCode`, although both of its callers pass values just produced by `toCatalogPrice`, which already uppercases that field.

   **Proof:** Interrupted bootstrap receives converted entries from private `listPrices`; replacement validation creates its own converted value before matching. There is no production path supplying an external `StripeCatalogPrice` directly to this private matcher. Its currency is therefore uppercase or `null`; null still mismatches every string currency input.

   **Smaller implementation:** Compare `price.currencyCode !== input.currencyCode.toUpperCase()` while retaining the preceding Price-kind condition and input normalization.

   **Behavior and coverage to retain:** Preserve case-insensitive input currency matching, null-currency rejection, tax behavior, Price kind, and fixed/custom amount comparisons. Do not remove normalization from `toCatalogPrice` or its public result.

   **Focused checks / expected reduction:** Run the catalog and replacement-price suites, including interrupted-bootstrap matching and fixed/custom recovery. Check lowercase input currency remains accepted where currently supported. This removes **one redundant uppercase operation per match**, with no expected line reduction or measured latency claim. If skipped, the duplicate normalization remains.

5. **Expose the existing not-found predicate’s object guarantee to TypeScript.**

   **Location:** [stripe-catalog-gateway.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/infrastructure/stripe/stripe-catalog-gateway.ts:219), lines 219–224 and 756–757.

   **What this is / problem:** After `isStripeNotFoundError(error)` succeeds, `inspectSetupProduct` checks again that `error` is an object and is non-null. Those checks repeat guarantees already established by the helper.

   **Proof:** The helper can return true only after `typeof error === 'object'`, `error !== null`, a `statusCode` property, and numeric 404 comparison all succeed. The caller still separately requires `code === 'resource_missing'` before treating the Product as absent.

   **Smaller implementation:** Change the existing helper’s return annotation to `error is object`, leaving its runtime body unchanged. Remove only the repeated `typeof` and null clauses from `inspectSetupProduct`.

   **Behavior and coverage to retain:** Keep the object/status validation in the helper and both `'code' in error` and the exact `resource_missing` comparison in the caller. Preserve `Number(statusCode)` coercion, propagation of unrelated 404s, and every other caller’s behavior. The owned catalog test at lines 28–54 explicitly distinguishes a missing resource, a deleted Product, an unpriced Product, service failure, and a wrong-endpoint 404.

   **Focused checks / expected reduction:** Run that catalog suite and guarded affected type checking. Approximately **two lines and two redundant comparisons on the successful predicate path** disappear. If skipped, the repeated guards remain; there is no correctness defect from retaining them.

6. **Remove eight unused SDK method mocks from focused tests.**

   **Locations:** [stripe-checkout-gateway.worker.test.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/infrastructure/stripe/stripe-checkout-gateway.worker.test.ts:418), lines 419–421 and 540–543; [stripe-catalog-gateway.worker.test.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/infrastructure/stripe/stripe-catalog-gateway.worker.test.ts:174), lines 177 and 285.

   **What this is / problem:** Two Checkout tests construct unused SDK methods: the creation test supplies `expire`, `retrieve`, and `listLineItems`; the finalized-line test supplies `create`, `expire`, and `retrieve`. Two catalog-creation tests also supply unused `prices.update` mocks.

   **Proof:** The gateway constructors only retain their arguments. The exercised Checkout creation path calls `sessions.create`; the finalized-line path calls `sessions.listLineItems`. Catalog bootstrap uses Price listing/creation and Product creation/update, never `prices.update`. None of these eight mock methods is read or asserted by its test case.

   **Smaller implementation:** Delete only those eight mock-property declarations. Retain the used SDK methods, complete requests/results, and every test assertion.

   **Behavior and coverage to retain:** Keep fixed quantities, newsletter metadata, shipping/contact collection, forbidden request fields, finalized null sentinels, inclusive fixed/custom creation parameters, and request evidence. These are scaffolding deletions, not test deletions. An unexpected future call to an omitted SDK method will fail instead of silently reaching an unasserted empty mock.

   **Focused checks / expected reduction:** Run both owned gateway suites. **Eight declaration lines** can be removed before any formatter effects. If skipped, the irrelevant fixture surface remains.

**Tests to retain and risky ideas rejected**

- The parameterized inclusive-Price creation test checks outgoing fixed/custom request fields. The separate custom-Price test checks the provider-returned custom bounds, null fixed amount, custom Price kind, and omitted `unit_amount`. They are not interchangeable and should both remain.
- Preserve repeated Product/default reads around replacement creation and selection. The price-change test at lines 126–139 changes the default before selection and simulates an update that does not persist; these reads detect real races.
- Preserve migration/setup distinctions. Account migration supports inactive objects and nullable custom bounds; new-item setup requires different confirmation, identity, and amount rules. Merging those paths would risk changing accepted inputs or recovery behavior.
- Preserve bounded replacement recovery, both active/inactive inspections, unknown-Price rejection, stable Product identity, operation/input fingerprints, and child idempotency keys. Provider idempotency is not a substitute for the existing durable recovery checks; Stripe documents the purpose of [idempotent requests](https://docs.stripe.com/api/idempotent_requests), while the owned and migration tests cover recovery without an idempotency cache.
- Preserve manual Checkout pagination guards. Replacing the loop with SDK auto-pagination would require separate proof of repeated/incomplete cursor failures and current ordering.
- Keep the bootstrap inventory cache on the gateway instance. Moving it into module-global mutable state would change cache lifetime and request isolation; Cloudflare’s [Worker guidance](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/) warns against global request state.
- Keep public factories, the exported migration client/input, legacy single-item request support, and existing metadata. Their interfaces and connected consumers establish compatibility obligations even where normal Checkout now constructs line arrays.
- Preserve raw-body signature verification, crypto-provider use, all allowlisted event types, distinct error classes, and unsupported-event response shape. The connected webhook test deliberately changes only a trailing newline and expects rejection; Stripe requires the [unmodified request body for signature verification](https://docs.stripe.com/events/manage-webhook-endpoints#signature-errors).
- Do not revise expiry policy in this cleanup. Current source sends the saved request deadline and the tests retain it through delay and SDK retries. The baseline spec describes a 35-minute target calculated immediately before creation; resolving that discrepancy is separate behavior work.
- Do not upgrade the SDK/API version, tighten configured URL protocol handling, broaden shipping, change tax policy, or alter provider confirmations as part of these simplifications.

**Verification handoff**

The primary focused command for an implementation is `pnpm test stripe-integration`. For converter/caller acceptance, the verifier should additionally select the Session-state shipping test, webhook-route test, and relevant paid-reconciliation/catalog-migration cases through `pnpm test <module|file>`. New coverage, if needed, belongs only in directly owned tests; external suites remain verification inputs.

The persistent verification thread owns guarded `pnpm validate`, affected lint/type checks, graph refresh after the implementation batch, and OpenSpec updates. No raw runner, whole-project bypass, hosted smoke, or provider mutation is needed to complete this review.

Graphify was queried at budget **2500**. The broad traversal truncated; focused file/factory/verifier explanations and the catalog-factory path narrowed the relevant relationships. Some explanation lists also capped neighbors, so CodeGraph and exact caller/source reads supplied the necessary evidence. CodeGraph omitted parts of large files and did not return the two describe-only gateway suites in lexical exploration; exact bounded reads completed those gaps. No graph was initialized, refreshed, or enriched.

`stripe docs` returned HTTP 401 for documentation reads. Public official documentation and the installed SDK declarations provided the required fallback. CLI login, upgrades, and provider-account inspection were not performed.

**Verdict:** The assigned read-only review is complete. Findings 1–6 are concrete candidates for independent implementation verification. Expected reduction is approximately **8–10 production lines plus eight unused mock declaration lines**, with every test case and meaningful assertion retained.

**Not checked:** Tests, compilation, Worker/mock runtime, browser behavior, and hosted/provider acceptance were not executed. The report establishes source-backed equivalence proposals, not runtime or release acceptance.
