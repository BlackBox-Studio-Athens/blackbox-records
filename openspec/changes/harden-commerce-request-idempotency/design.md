## Context

See [proposal](proposal.md) and the 2026-09-14 discussion. At the 2026-09-17 review, `start-checkout.ts` still creates a random order ID per request, and stock request schemas still lack retry identity while StockCount retains `expectedRevision`. Checkout already handles holds, order-derived provider keys, uncertainty and webhook recovery, and now persists accepted parcel tier, delivery amount and monetary-policy reference. EmDash item/price journals and `cms/runtime-publication.ts` selected-record/batch requests already reject conflicting actor/environment/input reuse and recover the original request. Do not replace those mechanisms or rerun hosted publication just to demonstrate them.

## Goals / Non-Goals

Protect retries of the same explicit intent across response loss/restarts without suppressing distinct purchases or stock movements. Preserve pending-order holds, webhook finalization, recount conflicts, and EmDash's journal. No generic idempotency service, global content-based deduplication, new queue/KV binding, account login, or automatic background write retries.

## Decisions

### Use a request identity for the intent, not a hash of the cart

Selected checkout and operator stock POSTs accept `Idempotency-Key`, a client-generated UUIDv4. Document and validate it in their OpenAPI contracts and allow that header through the existing CORS allowlist. Scope stored lookup to Product Environment and operation, plus verified actor for protected writes. Public checkout is anonymous: use the unguessable key as narrowly scoped retry capability, never as authorization to read order/PII. Store only its cryptographic digest and a normalized-input fingerprint, not tokens in logs/URLs.

Build the fingerprint from the validated caller intent: aggregate and deterministically sort CartLines using existing checkout normalization, retain quantity/consent and the validated return context, and include all applicable stock fields. Do not include a newly fetched price, stock balance, server timestamp, or newly generated expiry: those can change between retries. Persist the originally accepted provider parameters separately. Use native serialization/hash primitives with an explicitly fixed field order, not a new generic canonicalization dependency.

The checkout UI generates a key before first submission and retains it with the attempt fingerprint in `sessionStorage`, outside StoreCart. Same-tab reload/network retry reuses it. Changed validated CartLines/quantities, newsletter consent or return context, or explicit new checkout create a new attempt; do not rotate the key because a request failed. The current StartCheckout body does not accept a browser-selected shipping tariff or tax policy: do not add those fields for fingerprinting. A new server price/tariff is not itself a changed caller intent. Known terminal completion clears browser attempt state only after Worker-owned order state confirms it; preserve existing truthful pending/review handling. Cancel navigation alone does not prove a payable Session is expired. Independently intentional attempts in separate tabs remain independent purchases.

### Reuse durable order and ledger ownership

Persist the checkout digest/fingerprint with the existing pending CheckoutOrder and enforce uniqueness before provider work. Do not create a second hold/reservation model. Persist sufficient original command/provider parameters to reproduce the same existing provider request, including accepted expiry, return URLs, monetary policy, and consent, through the existing recovery seam. Duplicate lookup must precede a new reservation; concurrent duplicates converge through database constraints and a conditional claim if provider execution needs exclusion. Do not rely on a single Durable Object's in-memory serialization across awaits/restarts.

Reuse the existing accepted monetary fields and line snapshots; add only missing replay data. Retry lookup must precede new price reconciliation, delivery quoting and reservation work after request validation and applicable gates, so the original attempt does not consume its own hold or adopt today's tariff. Replay provider creation with the original ordered lines, accepted parcel tier/delivery amount, monetary-policy reference and all provider parameters. Preserve fixed multi-line/quantity and current single-line/single-quantity custom-price restrictions. Existing paid-order/review finalization, monetary snapshots and outbox deduplication remain unchanged. The delivery-quote POST is a read-only quote, not a checkout effect, and is outside required idempotency-key enforcement.

Persist stock request digest/fingerprint with its existing StockChange or StockCount row, including verified actor scope. Quantity mutation and ledger identity commit atomically. Successful replay resolves the original ledger effect; the UI performs a fresh stock read rather than displaying an old mutation response as current stock. A same-key/different-input request returns a conflict with no mutation. A first StockCount execution still checks the submitted revision; a recognized committed retry is replayed before comparing that old revision again. An uncommitted stale recount requires explicit reassessment and a new identity.

Retain digests/fingerprints with their parent order/ledger records under existing retention policy. At three initial purchases per day, this is 1,095 new successful purchase-associated identities in 365 days; attempts/abandonments and operator writes must be measured separately and can exceed that figure. Do not add scheduled expiration/cleanup. If future parent deletion requires changing retry guarantees, address it explicitly rather than silently allowing a deleted key to start a new charge. No PII or raw full-response cache is required.

### Preserve live gates and provider uncertainty

Same key with the same request resolves to the original attempt. Replay of an open session must recheck launch/capability gates and use the existing Session state/recovery path; it must not reserve stock again or count its own hold as a new request. Completed, expired, or review-required attempts return a safe `409` problem directing an intentional new attempt or operator review, never a fresh payable session under the old key. A concurrent still-running attempt can return a retryable `409` problem with bounded retry guidance instead of blocking a Worker indefinitely.

Keep the original provider idempotency key and exact persisted request parameters on retry. A timeout/5xx is not permission to rotate the key or release the hold. Stripe can prune its keys after at least 24 hours; after that window, recover by known durable Session identity or the existing scoped reconciliation mechanism. If existence cannot be established, leave the hold/review state intact and report uncertainty instead of blind creation. Continue existing webhook and paid-order deduplication.

### Handle independent deployment compatibility honestly

Use an additive nullable-field migration, then deploy server support for optional keys, then the updated clients. Keyless legacy requests retain existing behavior during this bridge and are explicitly outside the new retry guarantee. Verify old/new combinations in UAT. When all maintained clients are migrated, require keys for new operations and report stale keyless clients with a safe refresh-required error; do not silently issue server-random keys while claiming retry protection. Final acceptance requires this enforcement stage. Exclude live payment creation from diagnostic tests; use Local/mock and explicitly authorized UAT test mode.

## Risks / Trade-offs

- Duplicate request creates two provider calls → atomic identity/claim plus one stable provider key and immutable request parameters.
- Stale replay looks like current stock → return original effect identity and refetch authoritative state.
- Anonymous key becomes a data lookup token → high entropy, digests, no logs/URLs/PII response, and endpoint scoping.
- Retention and deployment bridge have limits → document them and never claim keyless calls or deleted identities are deduplicated.

## Migration Plan

After RFC 9457 acceptance, reuse completed EmDash/runtime-publication evidence, audit the remaining checkout/stock gap, add only missing fields/constraints, migrate clients, then enforce. Align with `greek-vat-and-shipping-charges` and `fix-paid-order-reconciliation` implementation contracts without closing their separate acceptance tasks. Run duplicate/concurrency/acknowledgement-loss/restart/provider-uncertainty and tariff-change tests with real Local D1 transactions. Budget any hosted test operations separately. Rollback must retain populated fields, pending holds, accepted monetary snapshots and keyed-request support once enforcement is active.

## References

- [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests): same-key response/parameter behavior and provider retention; read via Stripe CLI on 2026-09-14.
- Existing `checkout-stock-reservations`, `orders-stock-operator`, and completed EmDash operation-journal requirements remain authoritative.
