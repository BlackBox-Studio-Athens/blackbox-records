# Commerce operations runbook

This is the launch runbook for paid orders, review exceptions, delivery, and manual Greece-only BOX NOW fulfillment. The label must name the on-duty operator and backup before launch; owner approval and hosted rehearsals remain launch gates. Local test results do not approve PRD checkout.

## Daily checks

The on-duty operator checks the correct Stripe account and Product Environment, failed webhook deliveries, protected `/api/internal/orders?status=needs_review`, and paid orders with pending or exhausted delivery attempts. Use Access-protected reads and provider dashboards. Keep addresses, contact details, payment references, and raw payloads out of public evidence and logs. Record environment, accepted commit, redacted order reference, outcome, operator, and time.

## Staff order workspace

Open `/orders/` on the protected staff hostname, or choose Orders beside Stock. The workspace is read-only and uses the same Access identity as stock operations. The root landing page still opens Stock.

Deploy the staff artifact through `.github/workflows/pages.yml` (`target=staff` for a staff-only release). The hosted staff build clears `PUBLIC_BACKEND_BASE_URL` so both workspaces call same-origin `/api/internal/*` through the existing Access session. The shared release also rebuilds staff after the public build to prevent the public Worker URL from leaking into the staff artifact.

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

Packing assumptions live in `apps/backend/src/application/commerce/checkout/packing-policy.ts`. Local mode and owner-authorized UAT with a Stripe test key explicitly assign every current variant the same synthetic protected-LP profile. Synthetic CD and boundary examples are tests only. Replace assignments and package measurements in this file after measuring real goods, and record the evidence and effective seller/regime in the private reference before setting the hosted policy reference. PRD and UAT without a test key reject unmeasured packing. UAT uses `synthetic-uat-inclusive-v1`; keep Stripe Tax settings and registrations in test mode. Synthetic dimensions enable provider testing but do not establish physical shipping or fiscal acceptance.

Fiscal/provider setup is pending. DDD Invoices is the first candidate for a Stripe-connected Fiscal Document channel; Marosa is the first filing/remittance candidate. Neither is treated as installed, proven, licensed for this specific flow, or working. Do not write a custom myDATA integration or enable paid invoice creation to fill that gap. The owner/accountant must supply the actual issuer/channel, supported document types (retail, credits and applicable dispatch documents), myDATA deadlines and acknowledgements, retention period, costs, customer delivery mechanism and demonstration method. Confirm fixed/custom amounts, foreign billing with Greek shipping, permitted territories and shipping-VAT mapping before hosted acceptance.

Keep one private provider-side record per accepted payment containing order reference, Checkout Session/PaymentIntent, Fiscal Document identity, myDATA acknowledgement/status, customer document-delivery status, issuer and issue date. For each refund retain its provider refund reference, original document, credit identity and acknowledgement. Check missing and duplicate documents by payment reference before retrying; use the provider's supported retry/credit workflow. Do not issue a second sale document or delete an acknowledged document to repair a failure. Provider tools must prove routine automation without manual re-entry; this procedure is a handoff requirement, not evidence that automation exists.

Name the operator and backup for daily exceptions and an accountant/filing owner for all required Stripe and non-Stripe inputs, reconciled returns/credits, filing deadlines and remittance funding. Deadlines, legal identity, receipt/refund-email settings, provider credentials and actual service costs remain unverified. An order confirmation is not a Fiscal Document; Stripe payment receipts and fiscal documents have separate delivery owners. Verify those owners and avoid duplicate document creation before enabling either service.

Shared local results and remaining acceptance facts are tracked in [VAT and delivery evidence](../openspec/changes/greek-vat-and-shipping-charges/evidence.md). This also supplies the handoff for launch-parent tasks 2.7–2.9 and 3.8. Approved seller identity, shipping timing, withdrawal/defect rules and returns/uncollected terms remain parent selling-information work; the current delivery-information page does not claim to complete those legal terms.

[Paid-order reconciliation evidence](../openspec/changes/fix-paid-order-reconciliation/evidence.md) records local signed HTTP 503/D1 tests and old-account UAT shipping, provider resend, sink-only delivery, controlled shortage, and historical-order inspection. Test review orders remain terminal; no refunds or customer contact were performed. New-account acceptance, named ownership, and launch acceptance remain pending in `production-go-live-readiness`.
