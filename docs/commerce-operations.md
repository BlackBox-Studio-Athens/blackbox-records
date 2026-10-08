# Commerce operations runbook

This is the launch runbook for paid orders, review exceptions, delivery, and manual Greece-only BOX NOW fulfillment. The label must name the on-duty operator and backup before launch; owner approval and hosted rehearsals remain launch gates. Local test results do not approve PRD checkout.

## Pre-orders in Selling

Enter the number of expected copies as the ordinary stock quantity and set how many may be bought online. In Selling, switch Pre-order on and choose a ship month (optionally Early, Mid or Late) or an exact date, then Save pre-order. Saving checks the stock revision; refresh and retry a conflict. This changes neither quantities nor stock history.

Current Stock separates Copies on hand, Allocated online, Available to buy online and Held for checkouts. Buyable stock is the smaller of on-hand and online allocation, minus pending checkout holds, clamped at zero. Count stock edits allocation; it does not clear checkout holds. Show copies left uses buyable stock and appears only when enabled and one to five copies are available. Stock reads and changes refresh the Selling summary immediately, without publishing content.

An overdue hold remains reserved until its payment state can be verified. A missing Stripe session is not proof of nonpayment; reconcile the reference with the correct provider account before repairing the order. Increasing the allocation to hide unresolved holds can oversell copies.

### Resetting UAT test checkouts

With the UAT Stripe test key in `STRIPE_SECRET_KEY`, run `pnpm checkout:expire:uat -- --variant-id <variant>` to inspect matching pending checkouts. Add `--apply` to close open unpaid test Sessions through Stripe, then release their holds. Already expired unpaid Sessions can release directly. A mixed cart closes as a whole. Paid, processing, mismatched or unverifiable Sessions remain untouched; concurrent payment/order changes prevent the local update.

For obsolete UAT references that Stripe returns as missing, explicitly add `--retire-missing --apply`. Only overdue test references with no recorded payment are moved to the existing `needs_review` state, retaining history and payment correlation without assigning an invented review reason. This intentionally removes their test reservations without asserting they expired or were unpaid. Investigate any later payment as a review exception. This option is for disposable UAT tests only.

The command defaults to dry-run, accepts no environment/database/provider override, and targets only `blackbox-records-commerce-uat`. It processes at most 25 checkouts for the named variant, prints redacted counts, changes neither stock quantities nor order lines, and adds no endpoint or deployment. To test Disintegration use `variant_disintegration-black-vinyl-lp_standard`; after clearing reservations, set one to five buyable copies and enable Show copies left in Staff UAT.

The browser cart reserves nothing. Starting payment checkout creates a fixed 31-minute deadline: Stripe's native 30-minute minimum plus one minute for creation and transport. Retries preserve that deadline; the bound order retains Stripe's accepted expiry. Signed `checkout.session.expired` delivery releases unpaid holds without another shopper attempting checkout. A delayed or failed webhook can delay stock recovery; resend failed deliveries through the existing procedure below. Existing sessions retain their accepted expiry, and uncertain payment states remain reserved. A shorter 15-minute policy would require independent server-side expiration, not a browser timer.

Change the estimate while the copies are delayed. A month estimate remains open until Copies arrived; once the month passes, shoppers see Pre-order without a date. An exact date ends the pre-order automatically on that Athens calendar date, whether or not the copies arrived. Use it only when sure, and update it before that date if the plant slips.

When copies arrive, press Copies arrived (or switch Pre-order off), then count stock again to reconcile the physical copies and online quantity. Orders from that pre-order stop awaiting stock. A later pre-order starts a new cycle and does not hold earlier orders again.

### Estimate-change notices

Editing an open pre-order's estimate queues one shopper email per paid order and item, using the estimate saved when ordered and the new estimate. Starting a pre-order queues no notices; ending it removes pending notices. A later edit replaces the pending estimate and starts a new retry identity.

The Worker orders application owns this outbox. Its existing 15-minute schedule shares five processed rows per run between paid-order deliveries and estimate notices, with paid-order deliveries first. Transient provider failures retry after 15 minutes with the same idempotency key; five attempts, a 24-hour window, permanent errors or uncertain provider acceptance stop automatic delivery and mark the notice needs review. An order that is no longer paid or lacks the saved pre-order line also goes to review without sending.

The on-duty operator checks `preorder_estimate_notice_schedule_outcome` in the [Worker logs](worker-observability.md). Estimate notices with `status = 'needs_review'` are retained in the environment's D1 `PreorderEstimateDelivery` table; the staff Orders notification filters show paid-order delivery rows only. Use an authorized private D1 read and provider records to investigate the notice's safe reason and sequence before any manual contact. Scheduled recovery does not resend needs-review notices or authorize a new payment or stock change. See the [delivery schedule](../apps/backend/src/application/commerce/orders/run-paid-order-delivery-schedule.ts) and [notice processor](../apps/backend/src/application/commerce/orders/preorder-estimate-notice.ts).

## Notify me availability alerts

When a variant reads Coming Soon or Repressing, its Store item page offers Notify me. A shopper leaves an email with an unticked one-off consent; the Worker stores one pending alert per variant and address in the D1 `AvailabilityAlert` table, lower-cased and trimmed, with the consent copy version. A repeat request returns the same success. A variant holds at most 2,000 waiting alerts; further addresses get a retryable `503` and nothing is stored. Addresses never go to a Resend Contact, Segment or Topic and never appear in logs or staff screens. Stock detail shows only the waiting count.

The scheduled delivery run sends alerts last, in the rows paid-order deliveries and estimate notices left (five per run in all). An alert is due once its published variant can be bought: buyable stock after pending checkout holds, as an ordinary item or an open pre-order. The oldest request goes first. The email names the item with its title and artist from the accepted content publication, never the Stripe product name; an item the publication does not name yet waits for a later run and logs `availability_alert_item_unnamed`. It says the item can be bought, or can be pre-ordered with the Ship Estimate shoppers see, links the Store item page and says the address is deleted. It names no price or copies left. UAT recipients route to the managed sink.

PRD alerts additionally require Worker variable `PRD_AVAILABILITY_ALERTS_APPROVED=true` and both existing checkout controls: `PRD_LAUNCH_APPROVED=true` and an enabled `native_checkout_enabled` gate. Keep the alert approval absent or false throughout closed preparation and restricted beta; enable it only after separate approval for public selling. Missing, false or invalid alert approval, closed checkout, and checkout-flag evaluation failure suppress sends. Suppression leaves pending consent/retry records and send-day counters unchanged, while normal retention cleanup, paid-order delivery and estimate notices continue. Local and UAT alert delivery remain unchanged. Deploy and verify this guard before PRD account rebinding; code preparation alone does not establish hosted suppression.

Alert sending stops at 40 emails per Europe/Athens day, counted before each attempt in `AvailabilityAlertSendDay`. This leaves room for order email on the shared Resend Free quota (100 a day across UAT and PRD). Remaining due alerts wait for the next day without being dropped. A transient provider failure retries with backoff (15 minutes, 1 hour, 6 hours, 24 hours) under the same idempotency key; after the fifth attempt, or on a permanent failure, the alert is deleted.

Retention: an alert is deleted when delivered, after its final failed attempt, or 12 months after the request, whichever comes first. The on-duty operator checks `availability_alert_schedule_outcome`, `availability_alert_budget_exhausted` and `availability_alert_delivery_failed` in the [Worker logs](worker-observability.md). See the [alert processor](../apps/backend/src/application/commerce/orders/availability-alert-delivery.ts).

## Daily checks

The on-duty operator checks the correct Stripe account and Product Environment, failed webhook deliveries, protected `/api/internal/orders?status=needs_review`, and paid orders with pending or exhausted delivery attempts. Use Access-protected reads and provider dashboards. Keep addresses, contact details, payment references, and raw payloads out of public evidence and logs. Record environment, accepted commit, redacted order reference, outcome, operator, and time.

## Request retry identity

Maintained checkout and stock clients send a UUIDv4 Idempotency-Key only on checkout creation, stock changes, and stock counts. The Worker stores only a SHA-256 digest and input fingerprint with the existing order or ledger row; raw keys never belong in logs, URLs, StoreCart, or D1 payloads. Delivery quotes and existing item, price, publication, and setup request IDs are separate contracts.

The same key and input replays the original effect. A changed input returns a safe 409 conflict; an in-progress checkout returns a retryable 409; an expired, paid, reviewed, or otherwise closed attempt returns a terminal 409 and requires an explicit new checkout. Stock replay returns the original ledger identity while the staff UI refetches current authoritative stock. A recount whose original revision is stale still requires reassessment and a new intent.

The server supports a short compatibility bridge when COMMERCE_IDEMPOTENCY_KEYS_REQUIRED is unset; keyless calls retain the old non-deduplicated behavior and are outside the retry guarantee. Maintained Local, UAT, and PRD runtime configurations set COMMERCE_IDEMPOTENCY_KEYS_REQUIRED=true, so a stale client receives idempotency_key_required instead of a server-generated key. The additive fields remain durable through rollback, and no KV, queue, cleanup job, or paid service is required.

## Staff order workspace

Open `/orders/` on the protected staff hostname, or choose Orders beside Stock. The workspace is read-only and uses the same Access identity as stock operations. The root landing page still opens Stock.

Deploy the staff artifact through `.github/workflows/pages.yml` (staff assets ship inside the combined CMS Worker of every release). The hosted staff build clears `PUBLIC_BACKEND_BASE_URL` so both workspaces call same-origin `/api/internal/*` through the existing Access session. The shared release also rebuilds staff after the public build to prevent the public Worker URL from leaking into the staff artifact.

The list requests the latest 100 orders by creation time, across all payment statuses by default. Payment filters run on the protected API; notification filters cover only those returned orders. An empty subset is not a global all-clear, and older orders updated recently may be missing. Keep the daily provider and exception checks above.

To inspect an older order, enter its exact Checkout Session in “Find a Checkout Session”. A session-bound detail can be reopened at `/orders/?checkoutSessionId=<encoded-value>`. Rows without a session remain inspectable for that visit but have no permanent detail link; return to and refresh the list to read them again. Not found is not proof that no payment occurred.

Full-page detail separates payment, fulfillment-data completeness and notifications. Historical null amounts are unknown. Delivered email is neither parcel dispatch nor proof of reading. Consult the private dispatch record before packing, even when paid data is complete. References and timeline expand within the protected detail.

Use Refresh for a new read. Failed refreshes show stale data and the last successful read time with Retry; a failed new query does not show old results as its answer. Access denial clears private list and detail data and requires signing in again. Do not copy personal order facts into public evidence. The workspace stores no order payload in browser storage and has no refund, resend, contact, dispatch or stock-write controls; the manual procedures below retain their existing owners.

## Failed webhook delivery and resend

1. In Stripe Workbench, identify the failed event at the environment's configured webhook endpoint. Match its Checkout Session and PaymentIntent to the protected order read. Do not create another payment.
2. For HTTP 503, repair the failed persistence/configuration or session-binding recovery first. A `missing_order` log is not proof of durable recovery. If the order remains missing, retain the failed event for investigation; do not fabricate a paid order or decrement stock manually.
3. Resend that same event using Workbench. Stripe also retries automatically, but retries are finite. Confirm a successful response plus a persisted paid or terminal review outcome. A 200 response alone is insufficient evidence.
4. For a paid result, verify one stock decrement per line and one delivery row per kind. A duplicate resend must preserve the order, address, stock, and delivery uniqueness. Delivery-provider failures after the paid commit belong to the existing outbox.

Stripe documents delivery inspection and manual resend in its [webhook guidance](https://docs.stripe.com/webhooks#manual-retries).

## Terminal order review

Protected reads expose `needsReviewReason` and `stripePaymentIntentId`. New reasons are `stock_unavailable`, `line_mismatch`, and `incomplete_fulfillment`; a legacy null reason requires manual investigation.

1. Match the verified payment to the order in the correct provider account. Review stock/line facts or collected shipping, depending on the reason. Billing details never substitute for shipping.
2. For shortage, contact the customer through the approved operational channel and arrange a manual refund or another explicitly agreed resolution. Confirm the existing payment/refund state before any refund to prevent duplication. Do not ask the customer to pay again.
3. An authorized operator performs any refund in Stripe Dashboard and records its result in the private exception record. A refund does not restock goods automatically: reconcile actual returned physical stock separately through `/stock/`.
4. Preserve the terminal order and its original payment correlation/reason. Do not reopen it, bulk rewrite immutable paid history, create normal fulfillment delivery for it, or use webhook resend as a way to force fulfillment. Record resolution outside the immutable order facts.

For incomplete or suspect historical shipping, record whether customer contact/manual correction is needed before fulfillment acceptance. Retain the original stored snapshot and keep any verified correction in the private manual dispatch record.

## Paid delivery and manual dispatch

1. Verify paid persisted order state and complete collected Greek recipient/address plus shopper contact. Check shopper confirmation and ops fulfillment delivery summaries; investigate exhausted attempts. Scheduled outbox recovery owns transient email failures and does not authorize another stock decrement or payment.
2. Confirm the Greek BOX NOW destination with the customer where needed, then create the shipment manually in the authorized partner portal. No BOX NOW credentials or raw portal payloads belong in this repository.
3. Before dispatch, check the private dispatch record by order reference. Record operator, date, verified destination, and shipment handoff once so another operator cannot ship twice. A rehearsal is not evidence of a physical shipment.
4. For returns, verify actual receipt before recording a stock delta or recount. Use current revision/state and reassess any stale-count conflict.

## Rehearsal evidence

### Inclusive VAT and delivery handoff

The local implementation uses Stripe Tax, explicit inclusive EUR Prices and one Worker-selected BOX NOW charge: Small €2.50 or Medium €3.50, both gross. These charges are collected once. Merchandise prices keep their existing gross amounts. New Sessions recompute packing and current prices; accepted orders retain their original tier, charge and private monetary-policy reference. Never add VAT or a carrier-cost top-up to an accepted order.

Protected order reads expose merchandise gross, delivery gross/VAT, total VAT and line gross/VAT/rates. Merchandise net is merchandise gross minus summed line VAT; delivery net is delivery gross minus delivery VAT. Use the stored snapshot for normal dispatch and confirmation retries. Historical null fields mean unknown, not zero or exempt. `line_mismatch` also covers monetary/tax/discount inconsistencies; a payment in review still requires fiscal accounting and resolution even though normal fulfillment is held.

Packing assumptions live in `apps/backend/src/application/commerce/checkout/packing-policy.ts`. Local/test-key UAT retains its synthetic protected-LP catch-all and UAT reference `synthetic-uat-inclusive-v1`; UAT without a test key remains unavailable. Under the [2026-10-08 authority](../openspec/changes/migrate-stripe-to-blackboxrecords/evidence.md#owner-decisions--2026-10-08), PRD explicitly assigns the assumed protected LP only to `variant_disintegration-black-vinyl-lp_standard` and `variant_barren-point_standard`, with `allowSynthetic=false` and reference `owner-assumed-vinyl-packing-inclusive-tariff-prd-2026-10-08-v1`. This covers 2 of 98 Store Items in the October 1 accepted PRD snapshot; 96 remain unassigned and fresh hosted drift acceptance remains open. CD/cassette, generic/ambiguous vinyl, double/multi-LP and other packaging receive no fallback. Keep footprint/outer-geometry/height/weight/cart/stock safeguards, including the existing nine-per-line quantity constraint. Actual measurements and contractual capacities remain Unknown. The reference records assumed packing and the known inclusive tariff, not verified Tax registration or fiscal acceptance; existing provider checks and launch controls still apply. See [implementation and evidence](../openspec/changes/greek-vat-and-shipping-charges/evidence.md#assumed-prd-packing-implementation--2026-10-08).

Fiscal/provider setup is pending. DDD Invoices is the first candidate for a Stripe-connected Fiscal Document channel; Marosa is the first filing/remittance candidate. Neither is treated as installed, proven, licensed for this specific flow, or working. Do not write a custom myDATA integration or enable paid invoice creation to fill that gap. The owner/accountant must supply the actual issuer/channel, supported document types (retail, credits and applicable dispatch documents), myDATA deadlines and acknowledgements, retention period, costs, customer delivery mechanism and demonstration method. Confirm fixed/custom amounts, foreign billing with Greek shipping, permitted territories and shipping-VAT mapping before hosted acceptance.

Keep one private provider-side record per accepted payment containing order reference, Checkout Session/PaymentIntent, Fiscal Document identity, myDATA acknowledgement/status, customer document-delivery status, issuer and issue date. For each refund retain its provider refund reference, original document, credit identity and acknowledgement. Check missing and duplicate documents by payment reference before retrying; use the provider's supported retry/credit workflow. Do not issue a second sale document or delete an acknowledged document to repair a failure. Provider tools must prove routine automation without manual re-entry; this procedure is a handoff requirement, not evidence that automation exists.

The [2026-10-08 private attestation](../.codex-artifacts/stripe-migration-delegation/owner-decisions-20261008/private-inputs.json) supplies one necessary operating owner for payout/refund exceptions, manual fulfillment/support, public-content inputs and deferred fiscal/filing follow-up. Add no separate staffing/backup requirement without an observed need. Actual Tax facts, fiscal-provider deadlines/channel/costs and filing/remittance proof remain unknown/deferred for the requested uncapped scope; this is no compliance claim. The migration records persisted payment/refund receipt switches, while effective live delivery remains unproved. An order confirmation is not a Fiscal Document; retain separate payment/fiscal evidence and prevent duplicate documents when fiscal service is later configured.

Shared local results and remaining acceptance facts are tracked in [VAT and delivery evidence](../openspec/changes/greek-vat-and-shipping-charges/evidence.md). This also supplies the handoff for launch-parent tasks 2.7–2.9 and 3.8. Approved seller identity, shipping timing, withdrawal/defect rules and returns/uncollected terms remain parent selling-information work; the current delivery-information page does not claim to complete those legal terms.

[Paid-order reconciliation evidence](../openspec/changes/archive/2026-09-22-fix-paid-order-reconciliation/evidence.md) records local signed HTTP 503/D1 tests and old-account UAT shipping, provider resend, sink-only delivery, controlled shortage, and historical-order inspection. Test review orders remain terminal; no refunds or customer contact were performed. New-account and launch acceptance remain pending in `production-go-live-readiness`; necessary operational ownership is supplied by the current private attestation. Preserve the archive's recorded acceptance limits rather than requiring a second archive cycle.
