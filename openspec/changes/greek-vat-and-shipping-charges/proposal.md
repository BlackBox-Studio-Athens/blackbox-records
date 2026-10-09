## Why

**Current authority, 9 October 2026:** the owner explicitly selects truthful `NO_TAX_COLLECTED` payment collection for the existing natural-person seller, accepting irregular-operation risk and deferring accountant/tax work. New agreements preserve gross prices, disable automatic tax explicitly and record actual zero collection with no exemption, included-VAT or compliance claim. This supersedes earlier taxable-only implementation requirements; existing inclusive agreements/history retain their own accepted treatment. No provider statement, seller identity or registration is invented.

The storefront, Stripe Checkout, and persisted paid orders need a verified monetary and delivery-charge contract. This change owns collection policy, shipping charges, monetary reconciliation and fiscal-document handoff for `production-go-live-readiness`. The latest 2026-10-09 owner instruction applies the same existing assumed parcel to every validated PRD product variant for low-volume manual offline fulfillment, superseding two-product assignments. Uncapped selling, deferred actual Tax/fiscal evidence, cart safeguards and ordinary receipts remain; assumptions establish no measurement or compliance.

## What Changes

- Use the destination Stripe account and seller accepted by [migrate-stripe-to-blackboxrecords](../migrate-stripe-to-blackboxrecords/design.md). That migration supersedes the earlier source-account identity assumption. The 2026-09-11 ordinary taxable treatment and existing advertised EUR gross prices remain selected; reuse verified account details rather than requesting them again.
- Preserve gross EUR item prices and charge one aggregate BOX NOW order fee before payment: €3 for 1–4 validated cart units, €6 for 5–8 or €10 for 9 or more. NO_TAX_COLLECTED claims no included VAT or exemption; historical agreements retain original treatment and charge. Actual parcel count and carrier costs do not alter the fee.
- Apply the same existing owner-assumed profile to every validated PRD variant, regardless of format, under a new immutable quantity-band reference. Count validated cart units without inferring disc metadata; preserve stock/cart/configuration safeguards and accepted holds/history. Manual parcel selection/splitting removes the old nineteen-unit single-parcel order ceiling. Historical Local/UAT fixtures stay unchanged. The conservative two/six-unit multiple-parcel recommendation is discarded as the desired algorithm and retained as historical research only.
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
