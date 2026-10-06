## Why

The storefront, Stripe Checkout, and persisted paid orders need a verified VAT and delivery-charge contract. This change owns inclusive pricing, shipping tax, monetary reconciliation and Greek fiscal-document handoff for `production-go-live-readiness`. The owner-approved restricted paid beta defers fiscal automation while retaining monetary, measured-shipping and ordinary Stripe receipt checks; fiscal acceptance remains open for full public launch.

## What Changes

- Use the destination Stripe account and seller accepted by [migrate-stripe-to-blackboxrecords](../migrate-stripe-to-blackboxrecords/design.md). That migration supersedes the earlier source-account identity assumption. The 2026-09-11 ordinary taxable treatment and existing advertised EUR gross prices remain selected; reuse verified account details rather than requesting them again.
- Present final consumer item prices in EUR, with accurate VAT wording and BOX NOW postage of **€2.50 for Small or €3.50 for Medium**, including any applicable VAT, charged once per eligible order according to its packed size. Greece-only manual locker fulfillment is confirmed; show the applicable charge and payable total before the payment commitment.
- Select Stripe Tax with explicit inclusive Prices and one inclusive native Shipping Rate through existing catalog and checkout seams. Calculate Small/Medium eligibility from protected item dimensions, quantities, weight and two measured packaging profiles using the bounded stacking algorithm in `design.md`. Later tariff changes affect new checkout agreements, not existing order history.
- Persist and reconcile verified merchandise, delivery, and VAT amounts once, including the existing multi-line and pay-what-you-want paths. Keep VAT already included in gross prices from being added twice.
- Enable ordinary Stripe payment/refund receipts for beta through the migration's shared setup task. Defer fiscal issuance/myDATA and filing automation to the later public-launch phase; evaluate DDD Invoices and filing-provider coverage there. Tax calculation or a payment PDF does not complete those obligations. Manual BOX NOW remains; routine manual fiscal re-entry is not the selected long-term solution.
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

This is one coordinated child of `production-go-live-readiness`, following the corrected paid-order seams in `fix-paid-order-reconciliation`. This revision changes planning only. Reuse native Stripe features and externally configured connectors; no custom tax engine, myDATA client, accounting dashboard or shipping API is planned. Local work may use synthetic fixtures; beta requires actual account, tax, packing and ordinary-receipt proof, while full public launch also requires fiscal-provider acceptance. `design.md` records current decisions and limits; `research.md` remains dated history.
