## Why

**Current authority, 9 October 2026:** the owner explicitly selects truthful `NO_TAX_COLLECTED` payment collection for the existing natural-person seller, accepting irregular-operation risk and deferring accountant/tax work. New agreements preserve gross prices, disable automatic tax explicitly and record actual zero collection with no exemption, included-VAT or compliance claim. This supersedes earlier taxable-only implementation requirements; existing inclusive agreements/history retain their own accepted treatment. No provider statement, seller identity or registration is invented.

The storefront, Stripe Checkout, and persisted paid orders need a verified monetary and delivery-charge contract. This change owns inclusive pricing, shipping tax, monetary reconciliation and Greek fiscal-document handoff for `production-go-live-readiness`. The 2026-10-08 owner instruction requests uncapped selling after technical readiness, defers actual Tax/fiscal evidence and authorizes the existing assumed vinyl parcel within explicit supported assignments. Provider calculation, cart safeguards and ordinary receipts remain technical checks; assumptions establish no measurement or compliance.

## What Changes

- Use the destination Stripe account and seller accepted by [migrate-stripe-to-blackboxrecords](../migrate-stripe-to-blackboxrecords/design.md). That migration supersedes the earlier source-account identity assumption. The 2026-09-11 ordinary taxable treatment and existing advertised EUR gross prices remain selected; reuse verified account details rather than requesting them again.
- Present final consumer item prices in EUR, with accurate VAT wording and BOX NOW postage of **€2.50 for Small or €3.50 for Medium**, including any applicable VAT, charged once per eligible order according to its packed size. Greece-only manual locker fulfillment is confirmed; show the applicable charge and payable total before the payment commitment.
- Retain Stripe Tax with explicit inclusive Prices and one inclusive native Shipping Rate through existing catalog and checkout seams. Calculate Small/Medium eligibility from protected item dimensions, quantities, weight and two expressly assumed packaging profiles using the existing bounded stacking algorithm. Preserve unknown-profile and capacity rejection; later tariff changes affect new agreements, not order history.
- Persist and reconcile verified merchandise, delivery, and VAT amounts once, including the existing multi-line and pay-what-you-want paths. Keep VAT already included in gross prices from being added twice.
- Enable ordinary Stripe payment/refund receipts through the migration's shared setup task. Fiscal issuance/myDATA and filing automation remain deferred open work for the requested uncapped scope; evaluate DDD Invoices and filing-provider coverage in that follow-up. Tax calculation or a payment PDF does not complete those obligations. Manual BOX NOW remains; routine manual fiscal re-entry is not the selected long-term solution.
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

This is one coordinated child of `production-go-live-readiness`, following the corrected paid-order seams in `fix-paid-order-reconciliation`. This revision changes planning only. Reuse native Stripe features and externally configured connectors; no custom tax engine, myDATA client, accounting dashboard or shipping API is planned. Approved UAT fixtures remain usable; live provider-calculation dependencies and executable assumed-profile support stay specific technical work. Actual measurements remain Unknown and Tax/fiscal evidence deferred. `design.md` records current decisions and limits; `research.md` remains dated history.
