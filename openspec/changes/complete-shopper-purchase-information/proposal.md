## Why

The delivery page explains Greek locker delivery and charges, but shoppers must contact the label for dispatch timing, returns, and damaged items. Launch task 2.7 already requires approved selling and privacy information; this child supplies its concrete implementation and acceptance scope.

## What Changes

- Publish owner-approved seller/support information, dispatch expectations, manual locker arrangements, returns/refunds, damaged-item and uncollected-parcel handling, and privacy information.
- Extend the existing `/terms/` route and add `/privacy/`, with accessible footer, Store Item, cart, and checkout links plus short decision-relevant summaries.
- Keep purchased item-option wording distinct from the release's other formats; explain locker delivery before shoppers reach payment.
- Reorganize Store Item purchase information into one title/artist, exact option, current price, and Add to Cart group before the long description. Remove the repeated release title in the price panel and make Back to Store a quieter text link; on mobile, prevent a large image and full description from separating item identity from the buying decision.
- Reuse the VAT child's existing price/delivery components and approved policies. Do not duplicate charge calculations or claim fiscal/provider setup is complete.
- Track missing business wording as explicit publication blockers. Implementation can prepare structure, but must not invent promises or publish placeholder legal copy.

## Capabilities

### New Capabilities

- `shopper-purchase-information`: Approved purchase and privacy information at shopper decision points.

### Modified Capabilities

None. `greek-vat-and-shipping-charges` continues to own the pending monetary and delivery-charge requirements; this capability adds the remaining selling-information presentation.

## Impact

Public static content and validation, `/terms/`, new `/privacy/`, shared footer, Store Item/cart/checkout presentation and route metadata/sitemap; launch task 2.7 references this child. No checkout authorization, tax engine, fiscal integration, account configuration, or country-scope changes. The owner supplies factual business commitments and approved wording; `production-go-live-readiness` owns publication/deployment acceptance and launch approval.
