# checkout-core received review

Reviewer thread: `01a12574-be47-7662-a47f-0cf9e4827bf9`. Reviewer turn: `01a12574-c478-7672-b048-c15a34fed011`.

Immutable full report: [.codex-artifacts/simplification/21-checkout-core-review.result.json](../../../../.codex-artifacts/simplification/21-checkout-core-review.result.json). Raw SHA-256: `a9e883cdc08f72d31d92c99407d0e2d65ef86aa0c1d32b734024a6311db35264`. Original review HEAD and owned fingerprint are preserved below.

The complete received report follows. This record preserves the historical read-only review; execution results belong to the separate implementation report.

**What this change does:** This is a completed read-only review of module 21/29, `checkout-core`. Three behavior-preserving simplifications are supported by current source, callers, and tests: one repeated policy lookup and three duplicate test definitions, with approximately 73 lines removable. No implementation or task-record edits were made.

**Ownership and source identity**

- Checkout: `C:/Users/SVall/WebstormProjects/blackbox-records`, branch `main`.
- HEAD at opening and close: `3355c335226838f996efb5536f55271f819a3e14`.
- Owned root: `apps/backend/src/application/commerce/checkout`. No nested module roots were found.
- Closing snapshot: `2026-10-10T11:13:02Z`.
- All 24 owned files matched their opening SHA-256 hashes. The module’s working-tree status was clean at close.
- Module fingerprint: `e676b2dde213edd25b3749a5f75347cf9b4d99a93c0c6f1567002fe0a847fe3c`.

The fingerprint is SHA-256 over UTF-8 text containing ordinally sorted rows of repository-relative forward-slash paths, a tab, the lowercase file SHA-256, and a trailing LF for each row. It covers all 24 owned files, including `project.json`.

Key proof-file hashes:

| File                                  | SHA-256                                                            |
| ------------------------------------- | ------------------------------------------------------------------ |
| `checkout/start-checkout.ts`          | `2ace263b789cf2ad360d1a68da76881b935a0406801949fb52175071f289125e` |
| `checkout/checkout-use-cases.test.ts` | `4c918065db2e918244702b4484562756478c39e0466d3ca93c010b3e1771dcd7` |
| `checkout/project.json`               | `da23503c540218e467b21eae38c435e66d3a8481b3de516c0686a824da772c77` |
| `domain/commerce/monetary.ts`         | `9de39c2ff1225e57f3a90ebaf0050bce7563b2755e37e03a41da7c6b065d1906` |

The policy helper, public service composition, public route adapter, monetary tests, and public route tests also matched their captured hashes at close. Other modules already had concurrent changes; their implementation work was not reviewed or modified here.

**Numbered findings**

1. **Remove the second monetary-policy lookup in checkout validation.** Low-risk production simplification.

   **What this is:** [start-checkout.ts:249](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/commerce/checkout/start-checkout.ts:249), lines 249–256, validates the delivery quote and accepted monetary policy before creating a stock hold.

   **Proof and problem:** Line 253 calls `resolveTaxCollectionMode(reference)`. Line 254 immediately calls `isAcceptedDeliveryCategory(reference, tier)`, whose first operation performs the same lookup and returns false when it fails. The latter behavior is explicit in [monetary.ts:34](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/domain/commerce/monetary.ts:34), lines 34–41. Both policy tables are frozen data, and the lookup has no I/O or mutation. A valid reference therefore receives two equivalent lookups; an invalid reference is rejected by either validator.

   **Smallest change:** Delete the `!resolveTaxCollectionMode(options.monetaryPolicyReference)` condition and its now-unused import at line 16. Keep the missing-reference guard, delivery-quote guard, category validator, and `CheckoutUnavailableError` at the same stage.

   **Behavior and coverage to retain:** Public composition supplies the environment’s policy and packing configuration in [public-commerce-services.ts:188](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/interfaces/http/routes/public-commerce-services.ts:188), lines 188–204. Checkout tests at lines 621–683 cover accepted PRD manual tariffs, and lines 685–737 reject missing, blank, unknown, and unusable packing policies before hold or provider creation. The domain tests at [monetary.test.ts:22](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/domain/commerce/monetary.test.ts:22) separately retain manual-versus-parcel category restrictions. Preserve validation in the persisted-attempt request builder and Stripe gateway; those are separate boundaries.

   **Focused checks:** `pnpm test checkout-core`; the existing monetary test file is a useful additional policy check. The retained HTTP adapter continues mapping `CheckoutUnavailableError` to the same safe 409 response.

   **Expected reduction / if skipped:** Two source lines, including the import, and one policy lookup on an accepted new checkout. No measurable latency claim is made. Keeping it leaves a redundant check but does not create a correctness problem.

2. **Delete the offer-read test that repeats an already stronger test.** Duplicate coverage with no distinct regression value.

   **What this is:** [checkout-use-cases.test.ts:928](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/commerce/checkout/checkout-use-cases.test.ts:928), lines 928–947, tests that an ordinary Store Offer is ready and that reconciliation receives `apply: false` and `applyProductProjection: false`.

   **Proof and problem:** It uses the unchanged `beforeEach` fixture at lines 552–619, makes the same `readStoreOffer` call with the same repositories and slug, and changes no input. The retained test at [checkout-use-cases.test.ts:789](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/commerce/checkout/checkout-use-cases.test.ts:789), lines 789–821, asserts the complete ready-offer result, including the price, both readiness fields, identities and pre-order value. It also already checks both reconciliation flags and the supplied product projection. Every assertion in the later test is covered by that earlier test.

   **Smallest change:** Delete only the test at lines 928–947. No replacement helper, parameterization, or new assertion is needed.

   **Behavior and coverage to retain:** Keep the full result and flag assertions at lines 789–821. Also keep lines 949–984: that test uses the real catalog reconciler and spies on mapping, snapshot, Price, and Product writes when discovering a replacement price. Its evidence is distinct from the duplicated fake-reconciler assertions.

   **Focused checks:** Run `pnpm test apps/backend/src/application/commerce/checkout/checkout-use-cases.test.ts`, followed by the module check. Confirm the stronger test and the real-reconciler write-prohibition test remain selected and pass.

   **Expected reduction / if skipped:** Twenty lines and one duplicate test definition, excluding any adjacent blank-line removal. Keeping it adds another identical fixture execution and another place to maintain the same contract.

3. **Consolidate two ordinary checkout-success tests into the existing mapped-price test.** Retain their assertions in one stronger scenario.

   **What this is:** Two tests in the same owned file repeat ordinary single-item checkout:

   | Redundant test                                                          | Existing retained evidence                                                                                                                                                |
   | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | Lines 1043–1069, “starts checkout without a browser-selected locker…”   | Lines 1467–1517 already assert the same returned session/URL and persisted `shippingLocker: null`, `status: 'pending_payment'` state.                                     |
   | Lines 1071–1095, “can start checkout while refreshing D1 catalog state” | Lines 1467–1517 assert the same success result, complete mapped-price request, and persisted order. Carry its `options.apply === true` assertion into this retained test. |

   **Proof and problem:** All three start from the same reset fixture and submit the same legacy single-item command with the same URLs and identities. The wrapper at lines 25–32 supplies identical packing and monetary options. The explicit `undefined` feature-reader argument in the second test selects the same default as the omitted argument in the retained test. The manual-locker test’s assertions are a subset of the mapped-price test’s existing order assertion; the catalog-refresh test contributes only its reconciliation flag assertion.

   **Smallest change:** Retain [checkout-use-cases.test.ts:1467](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/commerce/checkout/checkout-use-cases.test.ts:1467), lines 1467–1517. Add `expect(catalogReconciler.calls[0]?.options.apply).toBe(true)` there, then delete the two redundant test blocks. A descriptive title can mention the retained manual-fulfillment and reconciliation assertions.

   **Behavior and coverage to retain:** Keep exact session/URL equality, the full authoritative line-item request, default newsletter behavior, and the persisted order’s session, identities, pending state and null locker. Preserve the current `apply: true` expectation; changing it would be a separate behavior decision. Keep the return-state test at lines 2683–2709, which exercises `readCheckoutState` after persistence, and the HTTP contract test at `public-commerce-routes.test.ts:697–733`, which verifies browser-safe input/output and Worker-owned return URLs.

   **Focused checks:** Run the owned checkout-use-cases test file and `pnpm test checkout-core`. Check that the retained test contains the transferred reconciliation assertion before deleting either block.

   **Expected reduction / if skipped:** Approximately 51 net lines: 27 and 25 lines deleted, less one transferred assertion, excluding blank-line cleanup. Two duplicate test definitions disappear. Keeping them repeats an ordinary success fixture three times without increasing retained behavioral coverage.

**Rejected simplifications and behavior that must remain**

- **Delete the empty-cart guard:** Rejected. `legacySingleCheckoutLine` returns an empty array when either legacy identity is absent (`start-checkout.ts:78–79`). The guard at lines 151–153 handles a reachable invalid-input path.
- **Remove stock checks because D1 rechecks availability:** Rejected. The early stock read rejects before catalog/provider work; the D1 conditional insert accounts for pending holds and concurrent requests. These checks protect different stages and preserve failure ordering.
- **Flatten claims, binding recovery, expiration, and release into one happy path:** Rejected. The owned tests cover concurrent keyed requests, ambiguous creation, missing URLs, failed binding, and failed/open expiration outcomes. D1 recovery also distinguishes an existing matching session from a new binding. These branches preserve recoverability and prevent unsafe stock release.
- **Treat a completed Session as paid, or release holds from local time alone:** Rejected. Payment status and Session status remain separate inputs. Stripe documents that a completed Session can still have payment processing in progress. [Stripe Checkout Session reference](https://docs.stripe.com/api/checkout/sessions/object).
- **Parallelize per-line work or move awaited persistence/provider operations into background work:** Rejected. That changes ordering, error precedence, or the work completed before the response. The response-dependent operations should retain their awaits, consistent with [Cloudflare’s promise guidance](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/#always-await-or-waituntil-your-promises).
- **Delete measured packing, assumed profiles, or synthetic profiles because default PRD checkout uses quantity bands:** Rejected. `PackingPolicy` and `quoteDelivery` are exported contracts. Owned tests explicitly exercise `quantityBased: false`, parcel limits, rotation, overflow, provenance, synthetic restrictions, and alternate charges.
- **Delete `StoreOfferReader`, feature-flag helpers, or the array-shaped variant-offer wrapper:** Rejected. They remain declared exports with meaningful contract tests. The variants HTTP endpoint consumes the wrapper’s array/null shape. The scheduled orders caller also consumes the feature-flag entrypoint for PRD availability-alert authorization.
- **Remove paid-order snapshot, legacy-row, quantity, or identifier validation based on TypeScript types:** Rejected. Persisted records and public input are trust boundaries. The owned tests protect missing identities, delayed persisted payment state, immutable pre-order cycles, and shopper-safe output.
- **Merge read and checkout catalog reconciliation settings:** Rejected. Their current arguments and coverage differ. Normalizing them would exceed this behavior-preserving review.
- **Remove concurrency, retry, failure, custom-price, monetary, packing or privacy tests:** Rejected. Those tests exercise distinct externally meaningful outcomes. Only the three duplicate definitions identified above are proposed for removal.

**Inspected scope**

Every owned production and test file was inspected in full: 17 TypeScript production files, six test files, and `project.json`. That is 1,615 production lines and 3,610 test lines, plus module metadata.

Production files, relative to the owned root:

- `errors.ts`, `feature-gates.ts`, `index.ts`, `spi.ts`, `types.ts`.
- `start-checkout.ts`, `read-store-offer.ts`, `read-checkout-state.ts`, `reconcile-checkout-session.ts`, `request-availability-alert.ts`.
- `packing.ts`, `packing-policy.ts`.
- `readers/index.ts`, `readers/store-offer-reader.ts`, `readers/store-listing-price-reader.ts`.
- `feature-flags/index.ts`, `feature-flags/cloudflare-feature-flag-reader.ts`.

Owned tests inspected:

| Test                                                          | Lines |
| ------------------------------------------------------------- | ----: |
| `checkout-use-cases.test.ts`                                  | 2,710 |
| `checkout-reconciliation.test.ts`                             |   138 |
| `packing.test.ts`                                             |   204 |
| `readers/store-listing-price-reader.test.ts`                  |   301 |
| `readers/store-offer-reader.test.ts`                          |   128 |
| `feature-flags/cloudflare-feature-flag-reader.worker.test.ts` |   129 |

Connected evidence included the public commerce service composition and route adapter, their route and Worker tests, Stripe webhook composition and acknowledgement, the scheduled feature-gate caller, the checkout hold repository contract and D1 operations, the Stripe checkout gateway and provider-state mapper, environment gate functions, monetary policy and tests, request fingerprinting, quantities, and stock-availability helpers. Connected implementation roots were read for compatibility and were not editing targets.

The review assumed concurrent Worker requests with shared D1 commerce authority, per-line cart quantities of 1–9, and the existing five-candidate bound on stale-hold recovery. No hosted load or latency benchmark was performed.

Required agent instructions, software/tool references, saved Ponytail instructions, task proposal/design/tasks, checkout and shipping requirements, relevant boundary and language requirements, and the simplification baseline were read. Module metadata remains closed, with the existing root, reconciliation, readers, feature-flags and checkout SPI entrypoints and declared dependencies preserved.

**Graph and tool evidence**

- Both existing Graphify and CodeGraph indexes were used before substantive source investigation. No graph was initialized, rebuilt, enriched, or saved.
- The initial Graphify query used budget 2500 and was truncated to 59 of 530 nodes. A targeted backend `startCheckout` lookup resolved name ambiguity; its capped connection output was completed by a read-only in-memory traversal of all 35 incident edges. Extracted and inferred edges were kept distinct. Unrelated omitted nodes were not treated as evidence.
- CodeGraph supplied current source, symbol relationships and caller information. Its trimmed source ranges and omitted anonymous test files were completed with bounded exact reads. Findings rely on source and assertions, rather than graph inference.
- Stripe CLI documentation retrieval returned HTTP 401. Public official Stripe documentation supplied the fallback; no login or provider-state operation was performed.
- Cloudflare Worker guidance and installed Workers/Flagship/OpenFeature definitions were consulted. Installed versions were `@cloudflare/workers-types` 5.20260926.1, `@cloudflare/flagship` 0.5.0 and `@openfeature/server-sdk` 1.23.0. No packages or generated types were downloaded or changed.

**Existing specification discrepancies**

These are context for the parent, not proposed fixes:

- `commerce-checkout/spec.md:762–805` still describes a 35-minute expiry calculated near the provider call. Current source uses a fixed 31-minute hold deadline; the owned test at lines 1519–1554 and `docs/commerce-operations.md:23` expressly preserve that behavior. Do not change timing under this refactor.
- `commerce-checkout/spec.md:746–760` describes mutation-free public reconciliation. Current `startCheckout` passes `apply: true` at lines 212–215, and the owned test at lines 1071–1095 asserts that argument. Finding 3 transfers that assertion intact. Any reconciliation-policy correction needs separate resolution.

**Verification handoff**

No tests, validation commands, Local scenarios, provider smoke, formatting, OpenSpec mutations, or generated-output commands were run in this read-only role. The report establishes review evidence, not passing execution or release acceptance.

The implementation thread should independently recheck findings against the recorded source identity, run the required OpenSpec guard before editing, and use the focused owned file/module tests. The existing monetary test and public route test are additional checks for finding 1. The persistent verification thread owns shared validation, graph refreshes, task updates and any coordinated Local mock acceptance; no hosted/provider mutation is needed or authorized here.

**Verdict:** Thorough review completed. Findings 1–3 are suitable for independent implementation verification; broader simplifications were rejected where they would weaken contracts or alter behavior.

**Lean:** Approximately 73 lines and three duplicate test definitions removable, with no new dependency, abstraction, or public interface change.

**Not checked:** Test execution, Local/browser acceptance, hosted provider behavior and release acceptance remain unverified. This full report is returned for the parent to retrieve; no report file or task update was saved.
