# Store Pre-orders

## Purpose

Lets the label sell a Store Item before its copies arrive: staff state when it should ship, shoppers see that it is a pre-order and when to expect it, and orders wait for the stock without changing how payment or stock work.

## Requirements

### Requirement: Staff put a variant on pre-order with a ship estimate

Protected stock operations SHALL let staff put one Store Item variant on pre-order with a Ship Estimate that is either a month, optionally early, mid or late, or an exact date. The write SHALL be revision-checked and SHALL NOT change stock quantities or ledger entries.

#### Scenario: Start a pre-order with a month

- **WHEN** staff switch Pre-order on, choose a month that has not passed and save
- **THEN** the variant is on pre-order with that estimate and its stock revision advances
- **AND** physical and online quantities and the stock history are unchanged.

#### Scenario: Change the estimate

- **WHEN** staff change the month, its part, or switch between a month and an exact date on an open pre-order
- **THEN** the new estimate replaces the old one and the pre-order continues as the same pre-order.

#### Scenario: End the pre-order

- **WHEN** staff press Copies arrived or switch Pre-order off
- **THEN** the pre-order ends at once and the item reads as an ordinary Store Item.

#### Scenario: Release stage and physical pre-order are independent

- **WHEN** staff edit Release stage or the linked Store Item's Pre-order toggle
- **THEN** each control explains that Release stage describes music and Pre-order describes pending physical copies
- **AND** changing Release stage does not start or end the physical pre-order; Released music can still have an open pre-order.

#### Scenario: Invalid or stale input

- **WHEN** the month has already passed, the date is today or earlier, the value is malformed, or the submitted stock revision is stale
- **THEN** the request is rejected, nothing is saved, and staff can refresh and retry.

#### Scenario: Stock was never recorded

- **WHEN** staff start a pre-order for a variant with no stock record
- **THEN** a zero-quantity stock record is created with the pre-order, and shoppers see the existing zero-stock label until copies are entered.

### Requirement: Pre-order copies are ordinary stock and payment is unchanged

Expected copies SHALL be recorded as the ordinary stock quantity. A pre-order SHALL use the same checkout, payment, stock hold and paid reconciliation as any purchase, and pre-order surfaces SHALL NOT add a deposit, a deferred charge, a consent step, or a cancellation or refund promise.

#### Scenario: Shopper pays for a pre-order

- **WHEN** a shopper checks out a cart containing a pre-order item
- **THEN** the hosted payment session is created exactly as for in-stock items and charges the full amount
- **AND** the stock hold and paid stock decrement behave as for any item.

#### Scenario: Copies run out

- **WHEN** effective online stock of a pre-order item reaches zero
- **THEN** it reads Sold Out or Out of Stock by the existing rule and cannot be bought.

#### Scenario: Shopper reads pre-order copy

- **WHEN** any pre-order surface or email is shown
- **THEN** it states that payment is taken in full at order and when the item is expected to ship
- **AND** it makes no promise about cancelling or refunding beyond the existing returns information.

### Requirement: Shopper pre-order status is derived from the date

The Worker SHALL derive the shopper-visible pre-order status on every read from the stored pre-order and the current calendar date in Europe/Athens. No scheduled job SHALL change it.

#### Scenario: Month estimate is current

- **WHEN** the estimate month is the current month or later
- **THEN** readers report a pre-order with that estimate.

#### Scenario: Month estimate has passed

- **WHEN** the estimate month is before the current month and staff have not updated it
- **THEN** readers still report a pre-order but withhold the estimate.

#### Scenario: Exact date arrives

- **WHEN** the current date is on or after the exact ship date
- **THEN** readers report no pre-order and the item sells as in stock, without any staff action or job.

### Requirement: Ready Store Offers state the pre-order

A ready Store Offer SHALL state whether the item is a pre-order and its Ship Estimate. Non-ready offers SHALL keep their existing shape.

#### Scenario: Ready offer for a pre-order

- **WHEN** a buyable pre-order item's offer is read
- **THEN** it is a ready offer with its price and the current pre-order status
- **AND** internal identifiers of the pre-order are not exposed.

#### Scenario: Ready offer for an ordinary item

- **WHEN** an in-stock item with no open pre-order is read
- **THEN** the offer explicitly reports no pre-order.

### Requirement: Store cards show pre-order status by release date

Store cards SHALL show a pre-order's status from fresh listing data, worded by the item's release date as evaluated in the browser. The card action SHALL read Pre-order.

#### Scenario: The release date is in the future

- **WHEN** a stocked pre-order has a release date after today
- **THEN** the card shows one badge naming the release date and a Pre-order action.

#### Scenario: The release date has arrived

- **WHEN** a stocked pre-order has a release date of today or earlier
- **THEN** the card shows Out now beside a pre-order badge naming the Ship Estimate, or Pre-order alone when the estimate is withheld.

#### Scenario: A pre-order is also scarce

- **WHEN** a stocked pre-order's record or offer carries lowStockQuantity
- **THEN** the card and the Store Item page still show Only N left exactly as the copies-left requirement defines
- **AND** the Pre-order action stays available.

#### Scenario: Listing data is pending, failed or cached

- **WHEN** the projection is loading, fails, omits the item, or a cached page is restored
- **THEN** no pre-order badge, label or marker from an earlier read remains
- **AND** an ordinary Buy action is never shown for an item the fresh read reports as unavailable.

### Requirement: The Store offers a Pre-orders filter only while pre-orders exist

The Store browse controls SHALL offer a Pre-orders filter with a short explanation only when fresh listing data reports at least one pre-order on the current collection. Store Category tabs and routes SHALL NOT change.

#### Scenario: Pre-orders exist

- **WHEN** at least one card on the collection is a pre-order
- **THEN** a Pre-orders toggle shows the count, and turning it on shows only those cards together with the explanation of payment, waiting and delivery
- **AND** it combines with search, artist and format filters and updates the result count.

#### Scenario: No pre-orders exist

- **WHEN** no card is a pre-order
- **THEN** no Pre-orders control is rendered and an active Pre-orders filter turns off.

#### Scenario: Linked from elsewhere

- **WHEN** the Store is opened through a link that asks for pre-orders
- **THEN** the filter starts on once listing data confirms pre-orders exist.

### Requirement: The Store Item page states pre-order terms before purchase

For a ready pre-order the Store Item page SHALL show the release date or Out now, the Ship Estimate, and that payment is taken in full today, and its purchase control SHALL read Pre-order in the existing control footprint.

#### Scenario: Shopper opens a pre-order item

- **WHEN** the fresh offer is a ready pre-order
- **THEN** the facts appear with the price, the control reads Pre-order, and the supporting text says the order is sent when the copies arrive
- **AND** adding it to the cart behaves as for any item.

#### Scenario: Estimate is withheld

- **WHEN** the offer is a pre-order without an estimate
- **THEN** the expected-to-ship fact reads To be confirmed.

#### Scenario: Upcoming album and physical shipping are separate

- **WHEN** the album release date is after the current UTC calendar day and its physical item is on pre-order
- **THEN** the price has a Pre-order badge and the facts name the release date separately from the Ship Estimate
- **AND** existing released singles, clips or listening sources do not mark the album Out now.

#### Scenario: Released album with vinyl still on pre-order

- **WHEN** the album release date is today or earlier in UTC and its vinyl offer is a ready pre-order
- **THEN** Out now and Pre-order appear beside the price, the Album fact names its release date, and Vinyl expected to ship names the separate estimate
- **AND** the purchase hint states that the album is out while the vinyl copies are pending, with the existing Listen action available when its embedded source exists.

#### Scenario: Missing date or another physical format

- **WHEN** a ready pre-order has no album release date, or its item is not vinyl
- **THEN** a missing release date remains To be confirmed and never produces Out now or a released-album hint
- **AND** non-vinyl items use generic copy and shipping wording rather than vinyl wording.

#### Scenario: Offer is not a pre-order or not ready

- **WHEN** the offer is ordinary, pending, failed or not buyable
- **THEN** no pre-order facts or label are shown and existing behaviour applies.

### Requirement: Cart and checkout review state that the order waits

When the cart holds a pre-order line, the cart and the checkout review SHALL mark that line and state once that the whole order ships in one parcel when the pre-order arrives, with the latest Ship Estimate among its pre-order lines.

#### Scenario: Mixed cart

- **WHEN** the cart holds a pre-order item and an in-stock item
- **THEN** the pre-order line is marked with its estimate
- **AND** one notice states payment today and one parcel around the estimate.

#### Scenario: Stored cart from before this feature

- **WHEN** a previously stored cart without pre-order data is restored
- **THEN** it loads unchanged with no pre-order marking.

#### Scenario: Mixed-cart drawer follows the approved export

- **WHEN** the drawer holds both pre-order and available lines
- **THEN** its native 440px composition uses 24px gutters, 72px artwork, a 14px item grid gap, price/quantity followed by availability/Remove, a roomy list and a Ships together notice before delivery
- **AND** the notice names the pending pre-orders and explains that available items wait and travel in the same parcel, with separate checkout offered in copy for items wanted sooner
- **AND** Items and BOX NOW locker delivery use the current Worker quote, never the reference's placeholder date or delivery fee
- **AND** Close, focus return, Undo and the canonical Checkout and Continue shopping actions remain usable, including at 390px and shorter heights.

#### Scenario: Pre-order-only or unknown-estimate drawer

- **WHEN** all drawer lines are pre-orders or any pending line has a withheld estimate
- **THEN** the notice does not claim an available item is waiting
- **AND** it states full payment today and one parcel when the copies arrive, without claiming a known shipping date when any estimate is withheld.

#### Scenario: Available-only drawer

- **WHEN** the drawer holds no pre-order line
- **THEN** it shows no Ships together notice or pre-order accent on Checkout
- **AND** its quote, quantity, removal, browser persistence and independently validated checkout continue to work.

#### Scenario: Checkout review follows the approved export

- **WHEN** the shopper opens cart checkout with a current quote and enabled checkout capabilities
- **THEN** its 880px desktop composition has 3:2 bordered panels with a 16px gap, Review and Pay with Ready, and Order Summary with 64px artwork, Veneer titles, combined artist/format metadata, Bebas prices and per-line availability
- **AND** a mixed pre-order notice names expected records, states full payment today and one parcel later, and explains that in-stock items wait and travel together
- **AND** Items, BOX NOW locker delivery and Total, charged today come from the Worker quote; VAT/locker/address explanation and real support links precede Continue to Payment and the Stripe note
- **AND** the desktop header aligns to the same 880px content bounds only on checkout, preserving shell/player behavior and other pages
- **AND** Cart checkout exposes quantity editing and optional email consent remains opt-in through the Ready/status disclosure without changing checkout payload, idempotency or canonical Stripe handoff
- **AND** at 390px the panels stack, actions remain reachable and the page has no horizontal overflow.

#### Scenario: Checkout review has ordinary, unknown, empty or unavailable data

- **WHEN** the review has ordinary lines, only pre-orders, a withheld estimate, no lines, a loading quote or an unavailable quote/capability
- **THEN** ordinary-only orders have no pre-order notice or sent-with-pre-order copy; pre-order-only orders never claim an in-stock item waits; withheld estimates do not invent a date
- **AND** empty carts cannot start payment, loading and failed quotes remain visibly unavailable, and current stock/price revalidation remains required before Stripe session creation
- **AND** supplied screenshot identities, dates, fees and prices remain isolated fixtures and never become catalog, stock or payment authority.

### Requirement: Orders keep the pre-order estimate shown at checkout

Each order line for a pre-order SHALL keep which pre-order it belongs to and the Ship Estimate the shopper was shown when checkout started. The kept estimate SHALL NOT change afterwards.

#### Scenario: Checkout starts for a pre-order

- **WHEN** checkout starts with a pre-order line
- **THEN** that line stores the pre-order and its current estimate, or no estimate when it is withheld
- **AND** nothing about the pre-order is sent to the payment provider.

#### Scenario: Estimate changes later

- **WHEN** staff change the estimate after the order was placed
- **THEN** the order line still holds the estimate shown at checkout.

### Requirement: The return page confirms a pre-order

When a confirmed paid order contains a pre-order line, the checkout return page SHALL confirm it as a pre-order and state when the parcel is expected.

#### Scenario: Paid pre-order

- **WHEN** payment and the paid order are confirmed for an order with a pre-order line
- **THEN** the final success surface reads Pre-order confirmed and names the latest estimate among its pre-order lines
- **AND** all other return states behave as before.

### Requirement: Paid orders await stock while their pre-order is open

A paid order SHALL be Awaiting Stock while one of its lines belongs to a pre-order that is still open for that variant. This state SHALL be derived, never stored as an order status.

#### Scenario: Pre-order is open

- **WHEN** a paid order has a line from the variant's current open pre-order
- **THEN** it is Awaiting Stock.

#### Scenario: Pre-order ends

- **WHEN** staff end the pre-order or its exact date arrives
- **THEN** its orders are no longer Awaiting Stock without any write to those orders.

#### Scenario: The variant is pre-ordered again later

- **WHEN** a new pre-order starts for a variant that had an earlier one
- **THEN** orders from the earlier pre-order are not Awaiting Stock.

### Requirement: Order emails state the pre-order

The shopper confirmation SHALL state each pre-order line's Ship Estimate and that the whole order ships together. The fulfilment email SHALL tell staff to hold the order.

#### Scenario: Confirmation for a mixed order

- **WHEN** the shopper confirmation is sent for an order with a pre-order line
- **THEN** that line names its estimate and the message says everything is sent in one parcel when it arrives.

#### Scenario: Fulfilment email for a pre-order

- **WHEN** the fulfilment email is sent for such an order
- **THEN** it tells staff to hold the order until the copies arrive and send one parcel.

#### Scenario: Order without a pre-order

- **WHEN** an order has no pre-order line
- **THEN** the shopper confirmation uses the approved payment-confirmation hierarchy with ordinary stock and fulfillment copy, without a pre-order wait
- **AND** the ops email retains its ordinary fulfillment actions.

### Requirement: An estimate change notifies awaiting orders once

When staff change the Ship Estimate of an open pre-order, each Awaiting Stock order with a line from it SHALL receive one email stating the new estimate. Starting or ending a pre-order SHALL send nothing.

#### Scenario: Estimate is changed

- **WHEN** staff save a different estimate
- **THEN** one pending notice per awaiting order is recorded in the same transaction as the stock write
- **AND** each is sent by the scheduled drain with retry and review behaviour like other order emails.

#### Scenario: Estimate changes again before sending

- **WHEN** the estimate changes again while a notice is pending
- **THEN** that order still receives one email, carrying the latest estimate.

#### Scenario: Pre-order ends with notices pending

- **WHEN** staff end the pre-order while notices for it are pending
- **THEN** those pending notices are discarded.

#### Scenario: Nothing changed

- **WHEN** staff save the estimate that is already stored
- **THEN** nothing is written and no notice is recorded.

### Requirement: The home page presents current pre-orders

The home page SHALL show a Pre-orders section above News only while fresh listing data reports at least one buyable pre-order among label releases. It SHALL add no content to the home document when there is none and SHALL NOT contact a video provider before the shopper asks to play.

#### Scenario: Pre-orders exist

- **WHEN** at least one release-sourced Store Item is a buyable pre-order
- **THEN** the section lists them with badges and price, shows the selected one on a stage, and links to its Store Item page and to the Store with the Pre-orders filter on.

#### Scenario: The selected release has a clip

- **WHEN** the selected item's release has a clip
- **THEN** the stage offers Play over a still image and loads the video only after Play is pressed.

#### Scenario: Shopper plays the selected official video

- **WHEN** the shopper activates Play
- **THEN** the existing privacy-enhanced YouTube embed requests `autoplay=1`, `playsinline=1`, `rel=0`, `color=white`, `controls=1` and `fs=1`, retaining native controls and fullscreen permission.

#### Scenario: The current official-video title is shown

- **WHEN** the Official videos row presents its selected clip
- **THEN** that title is noninteractive current-video text without an underline or pointer affordance, including when only one clip exists
- **AND** other clips remain keyboard-accessible buttons that select their poster and tear down any playing iframe until Play is activated again.

#### Scenario: The selected release has no clip

- **WHEN** it has none
- **THEN** the stage shows the artist photo as a grayscale backdrop with the cover in front, or the cover alone when there is no artist photo.

#### Scenario: No pre-orders or a failed read

- **WHEN** no buyable pre-order exists or the read fails
- **THEN** the section is absent and News follows the hero as today.

### Requirement: Release pages label a release on pre-order

Where a release links to its own Store Item, the release page and the Releases feature SHALL label that link Pre-order and show the pre-order badges while the item is a buyable pre-order. Layout SHALL NOT change.

#### Scenario: The Store Item is a pre-order

- **WHEN** fresh listing data reports the linked item as a buyable pre-order
- **THEN** the link reads Pre-order and the badges appear beside it.

#### Scenario: It is not, or the read fails

- **WHEN** the item is ordinary, unavailable, or the read fails
- **THEN** the existing link label and layout remain.

### Requirement: Pre-order presentation stays within the visual language

Pre-order status SHALL use one Sea green accent as an outline or edge, never as a resting fill, alongside the existing monochrome language. Controls SHALL keep the existing purchase-control geometry and accessibility rules.

#### Scenario: Badge and action render

- **WHEN** a pre-order badge or action is shown on any surface
- **THEN** the badge is an outline with text at 4.5:1 contrast or better, and the action is the primary control with a Sea green base line that fills on hover or keyboard focus
- **AND** targets are at least 44px, text does not clip at 200% zoom or 390px width, and reduced-motion preferences are respected.

### Requirement: Paid pre-order returns present immutable shopper facts

The canonical return screen SHALL match the approved Return reference with Order Status/Paid, a centered bordered Sea Green-edged confirmation card, the shopper order reference, immutable record/format and pre-order shipping facts, BOX NOW single-parcel guidance, estimate-change email note, available published released-media links and outlined Continue Shopping. Paid confirmation SHALL require provider payment paid and the persisted order paid; URL parameters, reference fixtures and browser cart data SHALL NOT establish payment or fulfillment facts.

#### Scenario: Mixed paid pre-order is confirmed

- **WHEN** both payment and persisted order are paid and the immutable snapshot contains pre-order and ordinary lines
- **THEN** the card pairs actual saved record/format labels with each pre-order's saved estimate and the ordinary item's In stock, sent with the pre-order state
- **AND** it uses the existing shopper BBR reference and explains one BOX NOW parcel with locker arrangement before dispatch.

#### Scenario: Pre-order-only or incomplete saved details

- **WHEN** an order contains only pre-order lines or its saved estimate/details are unavailable
- **THEN** no ordinary waiting item, date, record identity or reference is invented
- **AND** truthful existing next steps remain available for historical responses without the new projection.

#### Scenario: Published music is available while waiting

- **WHEN** published released-media metadata provides usable links
- **THEN** Out now, while you wait uses those actual titles and links
- **AND** missing links are omitted without placeholder destinations or reference identities in product source.

#### Scenario: Confirmation is unresolved or a later stock cycle starts

- **WHEN** payment/order confirmation is pending, delayed, failed, cancelled, expired, unavailable or missing its session, or a later pre-order cycle exists
- **THEN** the existing truthful status, polling, support/retry and paid-only cleanup behavior is preserved
- **AND** unresolved payment never displays confirmed and a later cycle never changes the original order facts.

#### Scenario: Return is viewed on desktop or mobile

- **WHEN** the paid return is viewed at 1280px or 390px
- **THEN** its reference layout, Inter body/metadata, Veneer heading and Bebas action render without overflow and preserve keyboard access, persistent shell/player and the checkout-scoped header.

### Requirement: Published showcase data follows accepted publication identity

The public pre-order showcase JSON SHALL reuse bounded cached editorial data associated with the accepted publication snapshot and SHALL participate in the existing publication freshness and invalidation contract. It SHALL NOT infer stock, prices or buying eligibility from that cache, or expose private drafts.

#### Scenario: The accepted release gains, changes or removes a clip

- **WHEN** a publication containing a release clip change is accepted and confirmed
- **THEN** the release page and showcase SHALL reflect the same accepted clip data within the existing publication freshness bound
- **AND** repeated unchanged reads reuse the cached response while a previous snapshot's response cannot be treated as current indefinitely.

#### Scenario: Publication invalidation is interrupted

- **WHEN** the accepted pointer refresh or required hosted cache purge cannot be confirmed
- **THEN** publication confirmation retains its existing recoverable pending/error behavior
- **AND** private content, failed publication data and stale responses never establish a new confirmed publication.

### Requirement: Store cards match the approved pre-order lifecycle references

Store listing cards SHALL retain the supplied 5 October pre-order lifecycle composition: full square artwork, optional Listen, source-cased Veneer title, quiet Inter “by ARTIST” credit and format metadata, left-aligned status badges and stable bottom price/action. Reference annotations SHALL NOT appear as shopper interface copy.

#### Scenario: Lifecycle state changes

- **WHEN** music is unreleased, released with physical copies on pre-order, or its pre-order has ended
- **THEN** the appropriate release/ship badges and Pre-order or ordinary Buy action follow authoritative lifecycle data without altering card geometry.

#### Scenario: Active pre-order copies become unavailable

- **WHEN** an active pre-order has no buyable copies
- **THEN** its actual Sold Out or Out of Stock badge is visible beside a genuinely disabled gray Pre-order control as in the approved reference
- **AND** ordering remains unavailable and ordinary unavailable cards keep their existing purchase-slot status treatment.

#### Scenario: Card metadata is long or the viewport is narrow

- **WHEN** cards display long identities or month/exact/unknown ship estimates at 320px, 390px, 430px or desktop widths
- **THEN** artwork remains intact and titles, badges, prices and actions remain readable without document overflow
- **AND** filters, navigation, cart operations and persistent listening retain their existing behavior.
