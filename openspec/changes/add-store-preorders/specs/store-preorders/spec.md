# Spec Delta

## Purpose

Lets the label sell a Store Item before its copies arrive: staff state when it should ship, shoppers see that it is a pre-order and when to expect it, and orders wait for the stock without changing how payment or stock work.

## ADDED Requirements

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
- **THEN** both emails are unchanged.

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
