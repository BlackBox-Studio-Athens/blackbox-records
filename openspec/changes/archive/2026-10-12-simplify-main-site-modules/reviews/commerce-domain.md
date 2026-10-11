# commerce-domain received review

Reviewer thread: `01a1253c-0183-7fa1-b2e9-1ec1b0502a2e`.

Review source: complete Markdown handoff supplied by the human to the fresh module 17 implementer. Reviewer identity: `main`, HEAD `3355c335226838f996efb5536f55271f819a3e14`, module fingerprint `9f644fe75a095a9dc70e596c22d828b7809f0a3289b9fb62848a34b1b0378f4c`, source verification `2026-10-10T10:13:19Z`. The text below is the complete received review; it records historical review evidence, not fresh implementation acceptance.

---

What this change does: This is a read-only review of module 17/29, `commerce-domain`, in the existing `main` checkout at `C:/Users/SVall/WebstormProjects/blackbox-records`. The module validates commerce values, derives stock and pre-order states, fingerprints retry requests, creates order references, and defines repository contracts.

Three small, optional simplifications are supported by the evidence, with approximately **16 lines removable**. No source, test, project, or OpenSpec file was changed.

**Should fix**

**1. Delete the reference-leakage test already covered by the exact-output test.**

- **What this is:** [order-reference-token.test.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/domain/commerce/order-reference-token.test.ts:35), lines 35–45, checks that a generated reference does not contain three fragments of the input identifiers.
- **Problem and proof:** The retained test at lines 6–14 supplies exactly the same order ID, Checkout Session ID, and reference date, and requires the entire result to equal `BBR-2026-04-25-RAW-SHELF-CARRY`. That stronger assertion already rejects every identifier fragment checked by the later test. The later test exercises no additional input or branch.
- **Smaller change:** Delete only the test at lines 35–45 and its preceding blank line. Retain the exact dated output, the output without a date, and the repeated-call determinism test at lines 25–33.
- **Behavior to preserve:** Preserve the generator, dictionaries, seed calculation, UTC date formatting, prefix, and exported token type. The retained exact-output assertion preserves the removed test’s current non-leakage coverage for this fixture; neither test establishes that property for every possible input.
- **Caller evidence:** The formatter is used by `apps/backend/src/application/commerce/checkout/read-checkout-state.ts:31`, `orders/checkout-order-paid-event.ts:78`, `orders/paid-order-delivery.ts:106`, and `orders/preorder-estimate-notice.ts:77`. These consumers use the same exported formatter for shopper snapshots and email references. Their relevant functions were read.
- **Focused validation:** Run `pnpm test apps/backend/src/domain/commerce/order-reference-token.test.ts` and `pnpm test commerce-domain`. Confirm that the three distinct retained reference tests still pass.
- **If skipped / expected reduction:** The same reference fixture remains tested twice for overlapping output properties. Approximately **12 test lines removed**, with no production-code change.

**Nice to have**

**2. Remove the unreachable quantity tie-break from checkout fingerprint sorting.**

- **What this is:** [request-idempotency.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/domain/commerce/request-idempotency.ts:83), lines 83–88, compares item slug, variant ID, and then quantity when sorting fingerprint lines.
- **Problem and proof:** Lines 15–25 first merge lines into a `Map` keyed by the item/variant pair. Two distinct entries reaching the sort therefore cannot have both the same slug and the same variant ID. Quantity cannot distinguish two remaining entries. For example, quantities 1 and 2 for the same pair become one quantity-3 entry before sorting.
- **Smaller change:** Keep `compareCheckoutLines`, but return only `compareStrings(left.storeItemSlug, right.storeItemSlug) || compareStrings(left.variantId, right.variantId)`.
- **Behavior to preserve:** Keep merging, quantity addition, string comparison rules, JSON property order, newsletter normalization, URL fields, version 1, and both digest prefixes unchanged. These bytes participate in persisted retry identity. Do not replace the comparator with locale-sensitive sorting or remove the merge.
- **Caller evidence:** [start-checkout.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/commerce/checkout/start-checkout.ts:155), lines 147–165, supplies the lines and hashes the fingerprint before looking up a retained checkout attempt. Existing tests at `apps/backend/src/application/commerce/checkout/checkout-use-cases.test.ts:1874` and `:2054` check replay without another hold/provider session and conflict when the payload changes.
- **Focused validation:** Run `pnpm test commerce-domain` and `pnpm test checkout-core`. Recheck byte-for-byte fingerprint equality for permutations, split duplicate lines, different variants under one slug, and newsletter values. Fresh checks during this review compared **14,043 cases** against the current exported function; all matched the proposed comparator.
- **If skipped / expected reduction:** The comparator retains a condition that the preceding merge makes unnecessary. Approximately **4 production lines removed** after formatting. No measured latency improvement is claimed.

**3. Remove the second `canBuy` condition after the classifier has already handled a selling pause.**

- **What this is:** [stock-availability.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/domain/commerce/stock-availability.ts:25), line 25, tests `availability.canBuy` again before returning `stocked`.
- **Problem and proof:** Line 22 has already returned `unavailable` whenever status is `available` and `canBuy` is false. At line 25, an `available` record consequently already has a truthy `canBuy`. A `sold_out` record still returns `unavailable` for positive stock through the status comparison.
- **Smaller change:** Change only the final return to `availability.status === 'available' ? 'stocked' : 'unavailable'`. Keep both earlier returns exactly as they are.
- **Behavior to preserve:** Preserve missing-availability and selling-pause handling before stock classification, the missing-stock Sold Out default, all zero-stock choices, and non-buyable positive-stock handling. Preserve labels, expected-month output, low-stock output, and pre-order output.
- **Caller evidence:** The direct consumers are `apps/backend/src/application/commerce/checkout/read-store-offer.ts:108`, `checkout/readers/store-listing-price-reader.ts:39`, and the owned `availability-alerts.ts:29`. Their interacting paths were read. Persistence constructs ordinary records in `prisma-item-availability-repository.ts:11` and `prisma-store-offer-snapshot-repository.ts:116`, rather than supplying stateful property getters.
- **Focused validation:** Run `pnpm test commerce-domain` and `pnpm test apps/backend/src/application/commerce/checkout/readers/store-listing-price-reader.test.ts`. Retain the classifier and alert tests covering pauses, missing records, depleted stock, and positive stock. Fresh checks compared **80 availability/stock combinations** against the current exported classifier; all matched the proposed return.
- **If skipped / expected reduction:** The classifier repeats a condition already established by an earlier return. **One Boolean term removed; no net line reduction** is expected.

**Rejected changes**

- **Removing fingerprint merging because `startCheckout` already merges:** The exported fingerprint function accepts duplicate lines and currently canonicalizes them. Removing that behavior would change its interface behavior and potentially persisted retry identity.
- **Removing identifier `.min(1)` checks, quantity validation, real-date validation, or catalog-operation schemas:** These checks participate in validation at boundaries and error behavior. The catalog repository parses inputs and stored results through the owned schemas, including `prisma/d1-catalog-operation-repository.ts:39`, `:46`, `:53`, and `:633`.
- **Removing paid-fulfillment checks because fields have TypeScript types:** Persisted records can contain null, blank, invalid, or historical values. `repositories/order-state-repository.ts:166–225` establishes the stronger current-paid contract before delivery. Its table-driven tests have distinct regression value, and `orders/paid-order-delivery-processing.ts:135–142` relies on that classification.
- **Deleting old monetary policy references or nullable historical fields:** The policy table preserves sale-time agreements. Current checkout retries and delivery use retained policy and order data; changing these types or references would exceed behavior-preserving cleanup.
- **Replacing estimate selection with sorting:** `latestShipEstimate` preserves the first entry on equal sort keys and returns null when any estimate is withheld. The existing tests cover month/date ordering and the late-month tie. A shorter sort-based implementation would need additional equivalence proof.
- **Removing alert budgets, consent constants, retry limits, leases, or retention handling:** These enforce operational and privacy behavior. Their fixed-value and edge-case tests are meaningful contract checks.
- **Inlining every private helper or changing exported quantity aliases:** The remaining helpers express specific formatting, validation, or domain responsibilities. No concrete benefit justified those changes.

**Inspected owned files**

All **36 files** under `apps/backend/src/domain/commerce` were read: **28 source files, 7 tests, and `project.json`**, totaling 2,379 lines. No nested module roots or generated files occur in this owned inventory.

The following paths are relative to that module root:

```text
availability-alerts.ts
availability-alerts.test.ts
ids.ts
index.ts
monetary.ts
monetary.test.ts
order-reference-token.ts
order-reference-token.test.ts
preorder.ts
preorder.test.ts
quantities.ts
request-idempotency.ts
stock-availability.ts
stock-availability.test.ts
value-objects.test.ts
zero-stock-state.ts
project.json
repositories/availability-alert-repository.ts
repositories/catalog-operation-repository.ts
repositories/checkout-stock-hold-repository.ts
repositories/item-availability-repository.ts
repositories/operator-stock-repository.ts
repositories/order-state-repository.ts
repositories/order-withdrawal-repository.ts
repositories/paid-checkout-fulfillment.test.ts
repositories/paid-order-delivery-repository.ts
repositories/preorder-estimate-delivery-repository.ts
repositories/request-identity.ts
repositories/spi.ts
repositories/stock-change-repository.ts
repositories/stock-count-repository.ts
repositories/stock-repository.ts
repositories/store-item-option-repository.ts
repositories/store-offer-snapshot-repository.ts
repositories/stripe-catalog-webhook-event-repository.ts
repositories/variant-stripe-mapping-repository.ts
```

**Connected flows inspected**

| Flow                                                              | Source evidence read                                                                                                                                                       |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Checkout values, merging, fingerprinting, and retry identity      | `checkout/start-checkout.ts`; replay and changed-payload ranges in `checkout/checkout-use-cases.test.ts`                                                                   |
| Stock changes, counts, and pre-order cycles                       | `stock/record-stock-change.ts`, `record-stock-count.ts`, `set-stock-preorder.ts`; Prisma stock and availability mapping                                                    |
| Listing/detail availability and shopper estimates                 | `checkout/read-store-offer.ts`, `readers/store-listing-price-reader.ts`, and Prisma listing snapshot mapping, including pending-hold subtraction                           |
| Alert eligibility, normalization, consent, retention, and retries | `checkout/request-availability-alert.ts` and `orders/availability-alert-delivery.ts`                                                                                       |
| Order references and paid-fulfillment consumption                 | `checkout/read-checkout-state.ts`; `orders/checkout-order-paid-event.ts`, `paid-order-delivery.ts`, `paid-order-delivery-processing.ts`, and `preorder-estimate-notice.ts` |
| Catalog-operation schema and retained-operation contracts         | Relevant mapping, begin, claim, publication, and advance paths in `persistence/prisma/d1-catalog-operation-repository.ts`                                                  |
| Withdrawal repository compatibility                               | `orders/order-withdrawal.ts` and `persistence/d1-order-withdrawal-repository.ts`                                                                                           |

Large connected files were read in the relevant graph contexts or bounded ranges; this review does not claim a full audit of other modules.

**Graph and instruction evidence**

The required AGENTS/imported preferences, map, software/Windows/graph/Codex rules, agent workflow/reference, relevant commerce/shipping/pre-order/boundary specs, module metadata, and both saved Ponytail guides were read. Cloudflare, Worker, and Stripe guidance was loaded; the current [Cloudflare Workers best-practices reference](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/) was consulted.

Both existing graph tools were used. Graphify queries used budget **2500**. The initial broad query was truncated; focused explanations established complete relationships for `createCheckoutRequestFingerprint` and `classifyStoreStockAvailability`. Broad barrel/fulfillment explanations retained partial hub output, so their omitted edges were not treated as proof. CodeGraph supplied current source; barrels and symbol-free tests omitted by its matching were read directly. No graph was initialized, rebuilt, or enriched, and no paid API was called.

**Validation and source identity**

- `pnpm test commerce-domain` exited **0**. Nx reused **1/1 cached task**, whose recorded result was **7 test files and 123 tests passed**. This was not a fresh Vitest execution.
- Fresh, read-only Node assertions passed for **14,043 fingerprint cases** and **80 classifier combinations**. They imported the current functions and compared them with the proposed smaller forms entirely in memory; no files were written.
- Assigned-module `git diff --stat` and `git status --short` were empty. Other workers’ checkout changes were left untouched.
- Branch: `main`. HEAD: `3355c335226838f996efb5536f55271f819a3e14`.
- Module fingerprint, unchanged between the recorded baseline and final verification: `9f644fe75a095a9dc70e596c22d828b7809f0a3289b9fb62848a34b1b0378f4c`.
- Fingerprint method: sort all 36 relative paths case-sensitively using `/` separators; form `path|lowercase SHA-256 of raw file bytes` records; join with LF and a trailing LF; SHA-256 that UTF-8 manifest. This includes `project.json`.
- Source verification timestamp: `2026-10-10T10:13:19Z`.

The implementation handoff is limited to findings 1–3 in the owned files above. Reconfirm the fingerprint and callers, run `pnpm openspec:guard` before implementation, use native `apply_patch`, and record implementation evidence in `openspec/changes/simplify-main-site-modules`. Future shell and launcher calls should use explicit `C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe` with `login:false`, following the user’s runtime instruction.

Verdict: Ship within the review scope; findings 1–3 are optional cleanup. Lean: approximately **16 lines removable**, plus one redundant Boolean term.

Not checked: fresh full Vitest execution, all tests in connected modules, whole-project validation, browser behavior, Local provider scenarios, hosted/provider/release acceptance, and performance timing. Those results are not established by this read-only review.
