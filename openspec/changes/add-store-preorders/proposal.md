# Proposal

## Why

The label sells records before the copies arrive: Sidus "LOTUS" opens for pre-order ahead of its 16 October 2026 release, and the Ouranopithecus "Anarchotribal" and Afterwise "Disintegration" vinyl follow albums that are already out digitally. The Store can only say an item is available, sold out or out of stock, so a pre-order today looks like an in-stock purchase and nothing tells the shopper, the order emails or staff that the parcel waits for a pressing.

## What Changes

- Staff can put one Store Item variant on pre-order from its Selling tab, with a ship estimate that is either a month (optionally early, mid or late) or an exact date. The copies they expect are recorded as the ordinary stock quantity. Staff end a month-estimate pre-order with Copies arrived; an exact date ends it by itself on that date.
- A pre-order is paid exactly like any purchase. Checkout, Stripe, stock holds, the paid guard and refunds are unchanged, and the flow makes no cancellation or refund promise of its own.
- The shopper's pre-order status is derived on every read from the Athens calendar date and the stored estimate. No scheduler is added. A month that has passed is withheld rather than shown as a promise.
- Store cards, the Store Item page, the cart, the checkout review and the return page name the pre-order and its ship estimate. Before the release date the badge reads "Pre-order · out <date>"; afterwards the item shows "Out now" beside "Pre-order · ships around <month>".
- The Store browse controls gain a Pre-orders filter with a short explanation, present only while something is on pre-order. Category tabs are unchanged.
- The home page gains a Pre-orders section above News while pre-orders exist: a menu and a stage that plays the release's YouTube clip, or shows the artist photo behind the cover when there is no clip.
- Release pages and the Releases feature label a release whose Store Item is on pre-order. No new layout.
- Releases gain an editorial list of partner store links, shown on the Store Item page for buyers outside Greece.
- Each order line keeps the pre-order estimate the shopper was shown. A paid order is awaiting stock while one of its lines belongs to a pre-order that is still open. Orders gain a read-only Awaiting stock filter.
- The paid confirmation names the estimate, the fulfilment email flags the hold, and one new email tells every awaiting order when staff change the estimate.
- The order pagination index migration, which is stored as a folder and therefore never applied by the migration runner or the tests, becomes an ordinary numbered migration before the pre-order migrations are added, with a check that keeps the migrations directory flat.

## Capabilities

### New Capabilities

- `store-preorders`: Pre-order state and ship estimate per variant, the derived shopper status, its presentation across Store, cart, checkout, home and release surfaces, the staff controls, awaiting-stock orders and the estimate-changed notice.

### Modified Capabilities

- `store-listing-price-presentation`: The listing projection also reports whether an item is on pre-order and its ship estimate.
- `paid-order-delivery`: The scheduled drain also sends pre-order estimate notices inside its existing per-run bound.
- `staff-order-workspace`: Orders can be filtered to those awaiting stock, and list and detail state it.
- `emdash-editorial-operations`: Releases carry an optional list of partner store links.
- `module-boundaries`: New provided entrypoints for pre-order wording, the home showcase and the release badge.
- `project-language`: Pre-order, Ship Estimate and Awaiting Stock become canonical terms.
- `tooling-validation`: Commerce migrations must be flat numbered files that the migration runner discovers.

## Impact

- **Data:** four additive D1 migrations (the order pagination index, pre-order columns on `Stock`, the same snapshot on `CheckoutOrderLine`, one estimate-notice outbox table) and one additive CMS field on releases. No change to existing rows' behaviour.
- **Backend:** stock domain and repositories, the Store Offer and listing readers, checkout start, order reads, paid-order emails, the scheduled delivery drain, one new protected stock operation and regenerated public and internal API clients. The Stripe gateway is untouched.
- **Web:** Store cards and listing connector, browse controls, Store Item page, cart, checkout review, return page, home page, release pages, design tokens and DESIGN/PRODUCT documents.
- **Staff:** Selling tab stock operations, Orders workspace, release editing.
- **Operations:** staff enter expected copies as stock and recount on arrival; migrations and the CMS field are applied per environment through the normal release process. The open change `clarify-store-sold-out-presentation` is the base for availability labels and is archived first.
- **Not included:** deposits or deferred charges, a Stripe terms checkbox, an opening date, stage tracking, a ready-to-send email, refund tooling, shipping outside Greece.
