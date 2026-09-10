## Why

The storefront, Stripe Checkout, and persisted paid orders do not yet have an explicit, verified VAT and delivery-charge contract. `production-go-live-readiness` tasks 2.7–2.9 correctly block launch on these decisions, but contain no implementation plan for inclusive pricing, shipping tax, monetary reconciliation, or Greek fiscal-document handoff.

## What Changes

- Use the current Stripe account as the owner's authoritative seller/business record. The 2026-09-11 decision selects ordinary taxable sales and treats existing advertised EUR amounts as final consumer prices with VAT included. The earlier undecided seller/exemption alternatives are superseded; do not require the owner to re-enter details already held in Stripe.
- Present final consumer item prices in EUR, with accurate VAT wording and BOX NOW postage of **€2.50 for Small or €3.50 for Medium**, including any applicable VAT, charged once per eligible order according to its packed size. Greece-only manual locker fulfillment is confirmed; show the applicable charge and payable total before the payment commitment.
- Select Stripe Tax with explicit inclusive Prices and one inclusive native Shipping Rate through existing catalog and checkout seams. Calculate Small/Medium eligibility from protected item dimensions, quantities, weight and two measured packaging profiles using the bounded stacking algorithm in `design.md`. Later tariff changes affect new checkout agreements, not existing order history.
- Persist and reconcile verified merchandise, delivery, and VAT amounts once, including the existing multi-line and pay-what-you-want paths. Keep VAT already included in gross prices from being added twice.
- Delegate payment/refund receipts to Stripe and fiscal issuance/myDATA to a Stripe-connected provider; evaluate DDD Invoices first. Verify Greek retail/credit/dispatch support and a Stripe-connected VAT filing/remittance service rather than assuming tax calculation or an invoice PDF completes those obligations. Manual BOX NOW remains; routine manual fiscal re-entry is not the selected solution.
- Supply acceptance evidence to the existing launch parent without duplicating its deployments or approval gates.

## Capabilities

### New Capabilities

- `greek-commerce-tax`: Approved Greek VAT treatment, explicit Stripe configuration, immutable monetary facts, and fiscal-document reconciliation.

### Modified Capabilities

- `commerce-checkout`: Consumer price/VAT disclosure, authoritative checkout totals, and unchanged browser authority limits.
- `shipping-fulfillment`: Explicit delivery charges, tax treatment, delivery promises, and refund/dispatch handling within Greece-only manual BOX NOW fulfillment.
- `project-language`: Canonical meanings for VAT Treatment, Delivery Charge, Order Monetary Snapshot, and Fiscal Document.

## Impact

Store listing/detail/cart/checkout presentation; existing Store capabilities/offer contracts; catalog Price creation, matching, and verification; Stripe Session creation and mapping; paid-order reconciliation/finalization; additive Prisma/D1 fields; protected order reads and existing delivery templates; commerce operations documentation. Generate API/Prisma artifacts only where the eventual implementation changes contracts.

This is one coordinated child of `production-go-live-readiness`, following the corrected paid-order seams in `fix-paid-order-reconciliation`. This revision changes planning only. Reuse native Stripe features and externally configured connectors; no custom tax engine, myDATA client, accounting dashboard or shipping API is planned. Local monetary/packing implementation can proceed with synthetic fixtures; actual account, packing and fiscal-provider evidence gates hosted acceptance and launch, not all coding. `design.md` records the current decisions, sources and verification limits; `research.md` is the 2026-09-10 historical research, whose undecided seller/exemption and manual-fiscal defaults are superseded here.
