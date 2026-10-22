# Proposal

## Why

A UX-laws audit of production on 22 October 2026 found places where shoppers and visitors must scroll, guess or wait more than needed: the phone item page hides PRE-ORDER below the first screen, the newsletter asks for consent after its submit button, the cart speaks in system terms and shows a bare text line for about three seconds, two long-text pages run past 100 characters per line, and one news article lives at a placeholder address. The owner reviewed each finding with before/after previews and chose the fixes below.

## What Changes

- Phone Store item pages show a slim buy bar (price, pre-order or status line, the same purchase action) that rises from the bottom edge until the shopper reaches the inline purchase action, then stays away.
- The newsletter form reads email, consent, Subscribe at every width, and the missing-consent error appears directly under the checkbox.
- The cart drawer drops its visible system description ("Cart state stays browser-only…"), keeping a plain screen-reader description, and the empty cart says "Nothing here yet."
- Services Send Inquiry uses the neutral ink face DESIGN.md already specifies. **BREAKING (spec):** the General service shows no optional details field; other services keep their tailored prompt.
- News article bodies read in a 46rem column at 16px; the About text column stops at 46rem.
- While the delivery quote is pending, the cart drawer reserves Items, Delivery and Total rows, shows the local cart subtotal for Items at once and holds the other values with an ellipsis.
- The first delivery quote for a cart is requested without the 250 ms settle wait; later quantity changes keep it. The Store card BUY joins the existing intent warm-up. The Worker quote path removes duplicate D1 reads and overlaps independent reads, keeping the final stock check after the provider read.
- Found during acceptance (production bug): with a pre-order in the cart, the drawer's Checkout label was white on white. The drawer now keeps the Sea Green Checkout face for such carts (owner choice B, 22 October 2026).
- The Caregivers article moves from `/news/lorem-ipsum/` to `/news/caregivers/` with a permanent redirect from the old address.

Declined after review: a new 404 page and a larger desktop target for the item page Release link.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `store-item-information`: phone item pages keep the purchase action reachable before the inline action.
- `newsletter-registration`: consent precedes the submit action and its error sits with the checkbox.
- `commerce-checkout`: shopper-language cart copy, reserved pending cost rows with the local subtotal, and an immediate first quote.
- `services-inquiry`: General has no optional details field; Send Inquiry uses the neutral face.
- `release-news-publication`: article bodies use a readable measure; article addresses are descriptive with permanent redirects from retired slugs.
- `about-contact-presentation`: the About text column keeps a readable measure.
- `app-shell-and-player`: the Store card BUY counts as cart intent for warm-up; the floating player stacks above the phone buy bar.

## Impact

- Public web: Store item page, NewsletterSignupForm, StoreCartDrawer, DeliverySummary drawer presentation, ServicesInquiryForm, News article and About layouts, app-shell intent selector, global CSS, DESIGN.md and focused tests. Claude owns these UI parts.
- Non-UI, owned by Codex: first-quote timing in `useDeliveryQuote`, the intent-warm selector, Worker quote read path (`read-store-offer`, `public-commerce-services`), and the news slug redirect mechanism.
- Content: the slug rename is a CMS content change and goes through Content Publication as a separate, owner-approved operation.
- No new dependencies, API shapes, schemas, prices or consent semantics. Free tier: fewer D1 reads; chunk warm-up adds only existing asset downloads.
