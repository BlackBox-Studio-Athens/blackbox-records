# Orders — complete received review

- Reviewer thread: `01a125a0-bae1-7242-8489-c4d4b6bef69c`.
- Reviewer turn: `01a125a0-c5f2-7663-bbff-67c77adcfa9c`.
- Immutable source: `.codex-artifacts/simplification/25-orders-review.result.json`.
- Raw source SHA-256: `6cf7cda7fa3083c4247be1e71a9768993833db8f6d4c317d2eafa7c03bba8bbe`.
- Source review HEAD: `3355c335226838f996efb5536f55271f819a3e14`.
- Source owned fingerprint: `12cf43082c147e25e9d0277e0db86a9272bdbcd6d33f6b7efc1182bf685fe6bd`.

The complete report below is preserved from the verified immutable source. Its read-only status and historical check limitations are retained; later implementation decisions are recorded separately in `../implementations/orders.md`.

---

What this change does: This is a completed read-only review of module 25/29, `orders`. It identifies five bounded simplifications supported by current source, connected callers, and tests. No repository file, task record, graph, generated output, or service was changed.

**Source identity and review limits**

- Checkout: `C:/Users/SVall/WebstormProjects/blackbox-records`, branch `main`.
- HEAD at opening and closing: `3355c335226838f996efb5536f55271f819a3e14`.
- Reviewer thread: `01a125a0-bae1-7242-8489-c4d4b6bef69c`.
- Closing observation: `2026-10-10T15:06:15+03:00`.
- Owned scope: 20 production TypeScript files, 11 test files, and `project.json`; 2,248 production lines and 2,364 test lines.
- Review fingerprint: `12cf43082c147e25e9d0277e0db86a9272bdbcd6d33f6b7efc1182bf685fe6bd`. This is SHA-256 over sorted, normalized `path:file-SHA256` entries, joined with LF and a trailing LF, including all 32 owned files.
- All 32 owned file hashes matched the opening snapshot. Fifteen critical caller/dependency files matched their earlier capture; an expanded set of 24 files matched across closing snapshots. HEAD remained unchanged. Unrelated working-tree edits were present throughout.

The closed boundary in [project.json](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/commerce/orders/project.json:1) exposes `index.ts`, `register-internal-order-routes.ts`, and `run-paid-order-delivery-schedule.ts`. The proposals below preserve those entrypoints, exported types, result variants, dependencies, and response schemas.

The assumed load is the repository’s documented low-traffic store. Scheduled work has a shared five-row limit; order list requests allow at most 100 rows, and search caps the requested page at 50. No latency measurements were taken.

**Should fix**

**1. Consolidate the two identical delivery-result adapters.**

Location: [paid-order-delivery.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/commerce/orders/paid-order-delivery.ts:127), lines 127–145; callers at lines 47, 56, and 81.

**What this is:** `emailAttemptResult` and `newsletterAttemptResult` translate application results into the same durable-delivery result.

**Problem and proof:** Both return `{ kind: 'delivered', providerMessageId: null }` on success. Both otherwise copy `retryable` and use `providerSafeReason ?? 'unknown'`. Their only difference is the success label: `sent` versus `registered`. [Email result types](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/email/types.ts:33) define the closed status sets, and `transactional-email.ts:42–57` and `newsletter-registration.ts:38–51` construct those statuses explicitly. These are application-generated results, rather than raw provider status strings.

**Smaller implementation:** Rename the existing private adapter to `deliveryAttemptResult`, accept `EmailOperationResult | NewsletterRegistrationResult`, and recognize the two success labels:

```ts
return result.status === 'sent' || result.status === 'registered'
  ? { kind: 'delivered', providerMessageId: null }
  : {
      kind: 'not_delivered',
      retryable: result.retryable,
      safeReason: result.providerSafeReason ?? 'unknown',
    };
```

Use it at the three existing call sites and delete the second adapter. No shared utility or additional layer is needed.

**Behavior and coverage to retain:** Preserve newsletter consent rejection before provider work, newsletter logging before result conversion, independent shopper/ops delivery, sink routing, idempotency keys, thrown-error handling, and the existing null provider-message ID. `paid-order-delivery.test.ts:53–135` covers shopper failure, ops/newsletter success, stable identities, and missing consent. The processing tests protect retry and review outcomes.

**Focused checks:** Run the owned delivery and processing tests. Verify failed newsletter conversion and the missing-safe-reason fallback alongside the existing success cases.

**Expected reduction / if skipped:** Approximately 8–10 production lines and one private function. Keeping both requires maintaining two copies of the same mapping.

**2. Replace the readback tests’ second order repository with focused stubs.**

Location: [order-readback.test.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/commerce/orders/order-readback.test.ts:19), fake repository at lines 19–83, setup at lines 85–120, tests at lines 122–151.

**What this is:** Three readback tests build pending records, transition them, sort them, and filter them through a locally implemented repository.

**Problem and proof:** The tested production functions only parse a session ID or forward a query to the repository. The sort/filter behavior asserted by two tests is implemented in the fake’s `listRecent` at lines 51–55. Its creation and transition methods are called directly by setup, so they do not establish production persistence coverage. The actual query implementation resides in `PrismaOrderStateRepository.listRecent`, lines 246–300.

**Smaller implementation:** Delete the fake class and its creation/transition setup. Reuse the existing `currentPaidCheckoutOrder` fixture, override the two records’ identities/statuses/dates as needed, and supply a typed repository object with `vi.fn` methods. Keep all three scenarios, with assertions that:

- Session read forwards the parsed session ID and returns the supplied record.
- Recent read forwards the limit and normalizes omitted status to `null`, while preserving the supplied records and their order.
- Filtered read forwards the selected status and returns the repository result.

Unused repository methods can remain typed mocks. No new fixture abstraction is required.

**Behavior and coverage to retain:** Keep the current record-field expectations and the three distinct readback scenarios. `order-use-cases.test.ts:162–175` already protects combined search/awaiting/notification forwarding. [order-search.worker.test.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/infrastructure/persistence/prisma/order-search.worker.test.ts:153), lines 153–205, exercises actual D1-backed filtering, tied-date ordering, limits, and cursor pagination. Its earlier cases protect open-cycle filtering before pagination. Those persistence tests must remain.

**Focused checks:** Run `order-readback.test.ts` and `order-use-cases.test.ts`. Retain and verify the persistence order-search suite when reviewing the resulting test reduction.

**Expected reduction / if skipped:** Approximately 75–100 test lines, with all three readback scenarios retained. Keeping the fake maintains a second implementation of persistence behavior and obscures what this module’s tests actually prove.

**Nice to have**

**3. Delete three guard terms already covered by preceding checks.**

Locations: [apply-paid-checkout-reconciliation.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/commerce/orders/apply-paid-checkout-reconciliation.ts:125), line 125 and lines 241–246; [reconcile-monetary-snapshot.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/commerce/orders/reconcile-monetary-snapshot.ts:21), lines 21–25.

**What this is:** Paid reconciliation contains overlapping rejection conditions.

**Problem and proof:** After `Number.isInteger(value)` succeeds, a falsy numeric value can only be zero or negative zero, both already rejected by `value < 1`. Thus `!amountTotalMinor` at line 125 and `!providerFinalizedLineItem.lineAmountMinor` at line 245 add no rejected value. In monetary reconciliation, `!mode` already rejects every falsy policy reference: `resolveTaxCollectionMode` in `domain/commerce/monetary.ts:24–25` returns `null` unless the reference is truthy and belongs to the accepted policy table. The later `!order.monetaryPolicyReference` is therefore redundant.

Current callers supply plain mapped session/line objects and plain repository records: `stripe-webhook-services.ts:65–82`, `stripe-checkout-gateway.ts:164–190`, and the persistence record mappers establish this input shape.

**Smaller implementation:** Delete only those three terms. Keep `Number.isInteger`, the positive lower bounds, EUR validation, `!mode`, accepted-category validation, and every remaining monetary consistency check.

**Behavior and coverage to retain:** Preserve the exact error message for incomplete payment details and the durable `line_mismatch` outcome for invalid lines. Keep zero collected VAT valid only under the existing no-collection policy. Do not replace `Number.isInteger` with `Number.isSafeInteger` as part of this refactor; that would change the accepted domain.

**Focused checks:** Run paid reconciliation and monetary snapshot tests, plus the relevant checkout integration cases. Compare the old and proposed guard decisions for null, undefined, zero, negative zero, negatives, fractions, NaN, infinities, strings, and positive integers. This is an equivalence check, not a reason to add tests that merely repeat the predicate.

**Expected reduction / if skipped:** Two standalone condition lines and one inline condition disappear. Retaining them has a small maintenance cost; no broader validation removal is justified.

**4. Find each finalized line once when building the finalization command.**

Location: [apply-paid-checkout-reconciliation.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/commerce/orders/apply-paid-checkout-reconciliation.ts:143), lines 143–152.

**What this is:** The command mapper obtains VAT and tax rate from the matching finalized provider line.

**Problem and proof:** Lines 146 and 148 execute the same `finalizedLineItems.find` predicate for the same persisted line, with no intervening mutation or await. The gateway constructs ordinary objects for this array, and the connected service passes that array directly into reconciliation.

**Smaller implementation:** Use a block-bodied mapper with one local lookup:

```ts
const finalized = finalizedLineItems.find((item) => item.stripePriceId === line.stripePriceId);
```

Then use `finalized?.lineVatMinor ?? null` and `finalized?.taxRatePercent ?? null` in the existing command object.

**Behavior and coverage to retain:** Preserve first-match selection, line ordering, null fallbacks, quantities, amounts, and the finalizer call. Do not replace this with a last-write-wins map: legacy reconciliation can aggregate duplicate price rows, while these two lookups currently select the first row’s tax fields. The monetary integration cases at `d1-paid-checkout-finalization-repository.worker.test.ts:73–163` protect the saved VAT/rate and replay behavior.

**Focused checks:** Run the owned paid reconciliation tests and relevant D1 finalization integration cases. Compare command payloads for multiple lines, absent tax fields, and duplicate price rows on the legacy path.

**Expected reduction / if skipped:** Two searches become one per reconciled line, halving comparisons in this specific lookup operation. The change adds roughly one source line and removes repeated work. No end-to-end latency improvement is claimed.

**5. Remove the rejection override that duplicates the publication-name failure case.**

Location: [availability-alert-delivery.test.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/commerce/orders/availability-alert-delivery.test.ts:138), lines 138–159, especially line 142.

**What this is:** One test intends to cover both an unnamed published-item lookup and a failed publication lookup.

**Problem and proof:** The first setup uses `unpublished-item`, which the existing `publishedNames` map does not contain. Its default `itemNames` implementation at line 61 already returns `null`. Line 142 overrides that result with a rejection, and line 144 makes the second setup reject too. Both currently exercise the exception path.

**Smaller implementation:** Delete line 142 and remove `itemNames` from the first destructuring. Keep the second setup’s rejection and both sets of assertions.

**Behavior and coverage to retain:** The first run then exercises a successful lookup returning no name; the second still exercises a rejected lookup. Both must send nothing, reserve no daily budget, refund the attempt, and reschedule for the same time. Keep the missing-item warning assertion. This matches `availability-alert-delivery.ts:75–80`, where rejection and a null result converge on the same handling.

**Focused checks:** Run the availability alert delivery test file. Preserve both cases and their no-send/no-budget assertions.

**Expected reduction / if skipped:** One setup line and an unused destructured binding disappear. Keeping the override duplicates the rejection case and leaves the intended null-result case unexercised in this test.

**Rejected reductions**

- **Remove apparently test-only public functions or result variants:** `createPendingCheckoutOrder`, `finalizePaidCheckoutWithRepositories`, transition APIs, and reconciliation result variants are exported contracts. The webhook acknowledgement adapter also branches on published result kinds. Their interfaces must remain.
- **Remove paid-review write/readback checks:** `apply-paid-checkout-reconciliation.ts:87–99` distinguishes a failed review write from a competing terminal transition. The D1 tests at lines 292–349 demonstrate why those outcomes differ.
- **Remove pre-order notice lease revalidation or elapsed-time checks:** `preorder-estimate-notice.test.ts:69–158` covers replacement/deletion, changed ownership, expired leases, and delivery-window expiry during awaited reads. These checks have distinct regression value.
- **Unify all four delivery drains:** Paid delivery, estimate notices, withdrawal messages, and availability alerts have different eligibility, identities, failure policies, and budget behavior. A common processor would add machinery and risk side-effect ordering.
- **Remove fulfillment or monetary checks because inputs are typed:** Nullable provider data and historical persisted records remain trust boundaries. Greek shipping identity, complete consent, accepted money, zero-versus-unknown VAT, and current paid-line completeness must remain validated.
- **Capture withdrawal time once:** The public caller omits `now`; the current function evaluates defaults around awaited digest operations. Capturing a single time would change observable hash/timestamp timing and needs a separate behavior decision.
- **Index every small scan:** Scheduler result arrays contain at most five rows. No evidence justified a new counting abstraction or a broader indexing change. Finding 4 removes an immediately repeated search without adding an index.
- **Change response/reference formatting, historic-line fallback, retry behavior, or shipping policy:** These are observable contracts, not simplification opportunities in this assignment.

Webhook replay and transaction protection also agree with the current official requirement to handle repeated and concurrent fulfillment calls. [Stripe fulfillment guidance](https://docs.stripe.com/checkout/fulfillment?payment-ui=checkout-form).

**Inspected owned scope**

Every source and test file under `apps/backend/src/application/commerce/orders` was inspected. No nested module or generated source was found inside that root.

| Area                          | Production files inspected                                                                                                                                                                   |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lifecycle and exports         | `index.ts`, `errors.ts`, `order-state.ts`, `create-pending-checkout-order.ts`, `transition-checkout-order.ts`                                                                                |
| Reconciliation and paid facts | `apply-non-paid-checkout-reconciliation.ts`, `apply-paid-checkout-reconciliation.ts`, `paid-checkout-finalization.ts`, `checkout-order-paid-event.ts`, `reconcile-monetary-snapshot.ts`      |
| Protected reads               | `read-checkout-order.ts`, `read-recent-checkout-orders.ts`, `internal-order-services.ts`, `register-internal-order-routes.ts`                                                                |
| Delivery and scheduling       | `paid-order-delivery.ts`, `paid-order-delivery-processing.ts`, `preorder-estimate-notice.ts`, `availability-alert-delivery.ts`, `order-withdrawal.ts`, `run-paid-order-delivery-schedule.ts` |

Owned tests inspected in full: `order-state.test.ts`, `order-use-cases.test.ts`, `order-readback.test.ts`, `non-paid-checkout-reconciliation.test.ts`, `paid-checkout-reconciliation.test.ts`, `reconcile-monetary-snapshot.test.ts`, `paid-order-delivery.test.ts`, `paid-order-delivery-processing.test.ts`, `preorder-estimate-notice.test.ts`, `availability-alert-delivery.test.ts`, and `order-withdrawal.test.ts`.

Connected evidence included the webhook service and acknowledgement flows; the D1 paid finalizer; internal and withdrawal route registration; the commerce runtime’s scheduled entrypoint; Prisma order reads/transitions; the D1 paid-delivery lease implementation; checkout gateway/types; email result producers and paid-email routing; the existing paid-order fixture; and the staff internal-order API consumer.

Connected test evidence included full internal-order route, webhook-service, schedule, and order-search suites. Relevant checkout acknowledgement cases and D1 finalization cases/fixtures were inspected, including money, immutable pre-orders, concurrent reconciliation, durable review, shipping identity, replay, outbox creation, stock preservation, and rollback. Stock-only portions of the large integration file were outside this orders review.

**Graph and tool gaps**

Both existing graphs were consulted. The initial Graphify query used budget 2500 and was truncated. Focused file and function explains recovered the relevant finalization, reconciliation, delivery, route, and schedule relationships. Some explain output still condensed ancillary edges; actual source established those flows.

CodeGraph succeeded, but omitted some barrel/import spans and test `describe`/`it` bodies, sometimes despite labeling its selected source complete. Bounded exact reads supplied the missing owned source and test spans. Graph edges guided navigation; they were not used as deletion proof. No graph was initialized, rebuilt, or enriched, and no paid API or hosted service was invoked.

**Verification handoff**

No tests, lint, type checks, formatting, OpenSpec commands, or validation commands were executed in this read-only role. Existing tests were inspected as evidence of intended coverage, not reported as passing.

The separate implementer should verify each accepted finding against the then-current source and run `pnpm test orders`, with focused files during editing. Production reconciliation changes also warrant `pnpm test checkout-integration` and relevant `public-commerce-http` cases. Preserve the persistence order-search and backend schedule coverage. The persistent verification thread owns shared checks, task/report writes, any Local stack acceptance, graph refresh, final `pnpm validate`, and strict OpenSpec validation.

Verdict: Review complete. Five concrete candidates are ready for independent implementation review.

Lean: approximately 85–110 net lines are removable, mostly test-fixture machinery, plus one repeated lookup per reconciled line. No test with distinct regression value is proposed for deletion.

Not checked: execution of the proposed changes, runtime/provider acceptance, browser acceptance, or release readiness. No known owned-source inspection gap remains.
