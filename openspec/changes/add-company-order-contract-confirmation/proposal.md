# Proposal

## Why

Audit finding 7 identified that the shopper confirmation contains order facts but not a complete durable copy of the required contract information. The owner requested a small future change for the transition to an operational company; implementation is deferred, not authorized now.

Deferral is an operational decision, not a finding that today's seller has no consumer-information duty. The current natural-person launch, VAT configuration and Stripe account remain outside this change.

## What Changes

- After the owner confirms the company is operational and authorizes implementation, capture the approved seller identity and applicable purchase-information version for each new company order.
- Include the required contract information, withdrawal instructions and model withdrawal form in the shopper confirmation itself, in a form the customer can keep. An ordinary link to mutable terms is insufficient; a PDF is not required.
- Preserve the order-time version across retries and later changes to company details or terms. Never relabel historical natural-person orders as company sales.
- Reuse the existing delivery/retry mechanism and surface missing contract information for operator action without inventing facts or reversing a successful payment.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `paid-order-delivery`: Add durable contract-information content and historical-version preservation to shopper confirmation.

## Impact

Future changes touch purchase-information publication, order snapshots and the existing shopper-confirmation email path. The exact company identity and approved wording are implementation prerequisites. Fiscal-document issuance, Stripe-account migration and tax decisions remain separate operations. Claude Desktop owns any email/UI presentation work; Codex reviews backend contracts and results.

Legal basis to recheck when implementation starts: [Consumer Rights Directive, Article 8(7)](https://eur-lex.europa.eu/eli/dir/2011/83/oj) and [European Commission guidance on confirming distance contracts](https://europa.eu/youreurope/business/selling-in-eu/selling-goods-services/ecommerce-distance-selling/index_en.htm). Confirmation must be timely, at the latest on delivery of the goods; this proposal does not defer that legal deadline.
