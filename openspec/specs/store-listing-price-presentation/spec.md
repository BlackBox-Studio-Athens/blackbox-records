# store-listing-price-presentation Specification

## Purpose

Provide bounded, browser-safe Store listing prices and availability from current commerce authority, including pre-order and opt-in copies-left presentation, while keeping purchase validation independent.

## Requirements

### Requirement: Listing-price projection is browser-safe and bounded

The Worker SHALL expose one read-only listing-price projection with at most one record per canonical Store Item snapshot. It SHALL retain the discriminated price representation, one required availabilityState: stocked, coming_soon, repressing, sold_out, or unavailable, and one required pre-order field that is empty or carries only the shopper-visible Ship Estimate. A coming_soon or repressing record MAY carry an optional expectedMonth. A ready record MAY also carry the optional lowStockQuantity defined by the requirement "Listing projection carries an opt-in copies-left count", independently of the pre-order field. One bulk database query SHALL read price snapshots, canonical item identity, current availability, stock and pending checkout holds without provider reads or writes.

#### Scenario: Browser reads a usable listing price

- **WHEN** the listing projection is read
- **THEN** valid active fixed or pay-what-you-want snapshots retain their current price presentation independently of stock depletion and snapshot age
- **AND** unavailable prices remain explicit non-price states
- **AND** the response uses Cache-Control: no-store.

#### Scenario: Browser reads a usable pay-what-you-want listing price

- **GIVEN** an active snapshot was produced from a valid reconciled pay-what-you-want Price and has amountMinor = null
- **WHEN** the listing projection is read
- **THEN** the record has ready presentation state and display price Pay what you want
- **AND** stock classification remains independent of that price.

#### Scenario: Snapshot cannot present a current price

- **GIVEN** a snapshot is missing, inactive, malformed, or lacks an unambiguous valid Price Authority
- **WHEN** the listing projection is prepared
- **THEN** its price state is explicitly unavailable or no record is returned, without guessing an amount
- **AND** elapsed time alone is not a reason for a non-price state.

#### Scenario: Runtime snapshot renewal is absent

- **WHEN** the legacy scheduled-renewal contract is evaluated
- **THEN** no UAT catalog Cron or time-only snapshot renewal is registered
- **AND** valid snapshots remain presentable without scheduled renewal.

#### Scenario: Availability is classified

- **WHEN** current availability and effective stock are classified
- **THEN** listing and detail readers share pause and missing-record precedence
- **AND** effective stock is max(0, min(physical quantity, online quantity) minus pending-payment order-line quantities)
- **AND** depletion reports the variant's staff-chosen zero-stock state, coming_soon, repressing or sold_out, defaulting to sold_out; a missing stock record counts as zero stock with the default
- **AND** a missing availability record or an independent selling pause reports unavailable, a technical state with no shopper label
- **AND** positive effective stock reports stocked whatever zero-stock state is chosen.

#### Scenario: Expected month is reported

- **WHEN** a coming_soon or repressing record's stock carries an expected month that has not passed on the current Europe/Athens date
- **THEN** the record carries expectedMonth as `YYYY-MM`
- **AND** a passed month, a sold_out, stocked or unavailable record, and a record without a month carry no expectedMonth.

#### Scenario: Pre-order is reported

- **WHEN** an item's stock record carries a pre-order that is open on the current Europe/Athens date
- **THEN** a stocked record reports the pre-order with its Ship Estimate, or without one when a month estimate has passed
- **AND** the pre-order field is independent of the price state
- **AND** an item that is not stocked, has no stock record or pre-order, or whose exact ship date has arrived reports no pre-order, so a pre-order whose copies ran out closes for shoppers while staff keep it open for paid orders.

#### Scenario: A pre-order also qualifies for the copies-left count

- **WHEN** a stocked pre-order has the copies-left notice enabled and effective stock between 1 and 5
- **THEN** its ready record carries both the pre-order and lowStockQuantity, and the count follows the copies-left requirement unchanged.

#### Scenario: Projection is narrowed to pre-orders

- **WHEN** a surface outside the Store collections asks for pre-orders only
- **THEN** the same projection returns only records with a shopper-visible pre-order, in the same record shape and with Cache-Control: no-store
- **AND** the read is bounded by the number of items on pre-order rather than the size of the catalog
- **AND** Store collections keep using the complete projection.

#### Scenario: Browser inspects the listing-price response

- **WHEN** the Worker returns the projection
- **THEN** it exposes only storeItemSlug, presentationState, displayPrice when ready, availabilityState, the optional expectedMonth, the optional lowStockQuantity of a ready record, and the pre-order field with at most a Ship Estimate
- **AND** quantities other than that opt-in count, zero-stock choices other than the reported state, copies-left switches, pre-order start times, availability alert counts, Stripe identifiers, variant identifiers, canCheckout, D1 identifiers and provider payloads remain private
- **AND** checkout independently validates current commerce authority.

### Requirement: Store collection prices use one projection read

Store collection cards SHALL obtain displayed listing prices from exactly one listing-price projection network read per Store collection activation, rather than per-card Store Offer reads. A shell-managed Store activation SHALL prepare that one read at activation start so it can run concurrently with Store HTML retrieval or cached snapshot application, and the current listing presentation SHALL consume the same prepared result without issuing another request. A direct document load MAY start that one read from the document before the shell hydrates.

#### Scenario: Visitor opens a populated Store collection directly

- **GIVEN** a Store collection document renders multiple canonical Store Item cards without a prepared shell activation
- **WHEN** the document is parsed
- **THEN** a small inline script may start one fresh `no-store` listing-price projection read for that collection and keep its pending result for the shell
- **AND** when the persistent Store shell becomes active it consumes that pending result, or makes the one read itself if none was started
- **AND** the activation makes exactly one listing-price projection read in total
- **AND** only the activation of that same document consumes the document-started result; a later activation starts its own read
- **AND** it does not read `/api/store/items/:storeItemSlug` once per card solely to render listing prices.

#### Scenario: Shell navigation replaces a Store collection

- **GIVEN** shell-managed navigation must fetch and apply a Store collection snapshot
- **WHEN** that Store activation starts
- **THEN** the shell starts one listing-price projection read in the same activation as the Store HTML request
- **AND** the listing presentation consumes that prepared result after the current placeholders mount
- **AND** no second projection request is created for that activation.

#### Scenario: A cached or prefetched Store collection is activated

- **GIVEN** the shell can apply an existing Store collection snapshot without waiting for a new Store HTML response
- **WHEN** the cached or prefetched collection becomes active or is restored through history
- **THEN** the activation still performs one fresh `no-store` listing-price projection read
- **AND** cached rendered price text is not treated as current commerce authority
- **AND** the current placeholders consume only that activation's result.

#### Scenario: A same-route action does not create a new Store activation

- **GIVEN** a Store collection is already active
- **WHEN** a shopper action leaves the active collection route unchanged
- **THEN** the shell does not create another listing-price projection read solely for that action.

#### Scenario: Store activation is superseded

- **GIVEN** a prepared listing-price request belongs to a Store route activation
- **WHEN** route exit, rapid navigation, failure, or teardown supersedes that activation
- **THEN** the shell aborts the request when possible and clears its prepared result
- **AND** a later Store activation creates a new request and never consumes the superseded result.

#### Scenario: Listing price cannot be loaded

- **GIVEN** the activation's listing-price projection request fails or does not contain a card's Store Item slug
- **WHEN** that card renders its price region
- **THEN** it shows an explicit non-price state
- **AND** it does not retain `Checking price` indefinitely or show a stale static amount.

#### Scenario: Shopper starts checkout after seeing a listing price

- **GIVEN** Store collection prices were populated from the browser-safe projection
- **WHEN** the shopper starts checkout for a Store Item and variant
- **THEN** the Worker independently revalidates current Store Item identity, variant identity, availability, checkout eligibility, online stock, product projection, and catalog price
- **AND** the listing projection is not accepted as checkout, stock, order, or payment authority.

### Requirement: Listing availability follows the existing activation lifecycle

Listing price and availability SHALL consume the same single fresh request per collection activation and SHALL reset together when cached content is restored. Unknown availability SHALL never be inferred as sold out.

#### Scenario: Fresh or cached collection activation

- **WHEN** a collection is loaded directly, through shell navigation, or restored from history
- **THEN** one fresh projection request updates its price and status together
- **AND** superseded requests cannot update the current collection.

#### Scenario: Older or failed response

- **WHEN** a response omits availabilityState, omits an item, or fails
- **THEN** any stale availability label is removed and neutral unknown feedback is shown
- **AND** no Sold Out state is inferred from missing data or a failed price read.

### Requirement: Listing projection carries an opt-in copies-left count

The listing-price projection SHALL add an optional lowStockQuantity to a ready record only when staff enabled the item's copies-left notice, its availabilityState is stocked, and its effective stock is between 1 and 5. All other records SHALL carry no stock count.

#### Scenario: A scarce item has the notice enabled

- **GIVEN** an item's copies-left notice is enabled and its effective stock is 3
- **WHEN** the listing projection is read
- **THEN** its ready record reports availabilityState stocked and lowStockQuantity 3
- **AND** the projection still uses one bulk query without provider reads or writes.

#### Scenario: The count does not qualify

- **WHEN** the notice is disabled, effective stock exceeds 5 or is 0, the item is not stocked, or its price is unavailable
- **THEN** the record has no lowStockQuantity.

#### Scenario: A Store card presents copies left

- **WHEN** a stocked card's ready record carries lowStockQuantity N
- **THEN** its status slot shows Only N left beside the price and Buy remains available
- **AND** a stocked record without the count keeps the status slot hidden.

### Requirement: Stocked Store cards offer Buy

A Store collection card whose Store Item has a sellable variant SHALL offer a 44px Buy action with a leading record mark beside its listing price when the listing projection reports a ready price and stocked availability, and otherwise SHALL show its price and status without Buy. Buy SHALL sit beside the card's item link without navigating. Buy SHALL read the Worker Store Offer before adding one unit to StoreCart; the listing projection SHALL NOT be cart, checkout, stock or payment authority.

#### Scenario: Stocked card shows Buy

- **GIVEN** the listing projection reports a ready price and stocked availability for a card's Store Item
- **WHEN** the card's price row is presented
- **THEN** Buy appears beside the price in the Listen chrome (dark face, hairline edge, Store Blood hover edge) with a leading record mark, unlike the outlined status text
- **AND** the card keeps its height, because the price row reserves Buy's height
- **AND** the Store Crate's item in hand shows Buy in its visible purchase row at every width.

#### Scenario: Pre-order card keeps its action

- **GIVEN** the listing projection reports a ready, stocked pre-order for a card's Store Item
- **WHEN** the card's price row is presented
- **THEN** its Pre-order action keeps the filled primary face and Sea green base line
- **AND** it shows no record mark.

#### Scenario: Phone Crate offers Buy for the item in hand

- **GIVEN** a viewport narrower than 40rem with the Store Crate open
- **WHEN** the stocked item in hand shows its purchase row below the bin
- **THEN** it shows the price, status and Buy
- **AND** Buy stays reachable without scrolling past the bin.

#### Scenario: Shopper looks for the item page

- **WHEN** a Store card renders
- **THEN** its title carries a faint text-link underline that turns full when the card's Store Item link is hovered or focused
- **AND** on hover-capable devices the card's border and surface lift with it
- **AND** hovering Buy or Listen leaves the card at rest.

#### Scenario: Card cannot be bought

- **GIVEN** the projection read is pending or failed, omits the card, has no price, or reports Sold Out, Out of Stock or unavailable
- **WHEN** the card renders
- **THEN** no Buy action is shown
- **AND** the price region and status text explain the state.

#### Scenario: Shopper buys from a card

- **WHEN** the shopper presses Buy
- **THEN** Buy reads Adding, keeps its width and is marked busy while the Worker Store Offer is read
- **AND** a buyable offer adds one unit to StoreCart and opens the cart drawer
- **AND** Buy reads Added for the confirmation period, then Buy
- **AND** Adding and Added keep the record mark and the Listen chrome
- **AND** closing the drawer returns focus to Buy.

#### Scenario: Item stopped being buyable

- **GIVEN** the Worker Store Offer is no longer buyable or cannot be read
- **WHEN** the shopper presses Buy
- **THEN** nothing is added to StoreCart
- **AND** Buy is removed, the card shows the offer's status text and focus moves to the card's Store Item link.

#### Scenario: Store collection snapshot is restored

- **WHEN** shell navigation restores or reuses a Store collection snapshot
- **THEN** Buy is hidden and idle until that activation's projection read shows it again.

### Requirement: Store cards use the shared availability vocabulary

Store collection cards SHALL show Coming Soon, Repressing or Sold Out in the slot beside the retained price for the matching availabilityState, with a shown expected month inside the same chip as "Coming Soon · Nov 2026". Only Sold Out SHALL use the Store Blood tone. An unavailable record, or a state the browser does not recognise, SHALL show the price with no status and no Buy.

#### Scenario: First pressing has not arrived

- **WHEN** a card's record is coming_soon with expectedMonth 2026-11
- **THEN** the card shows one chip reading Coming Soon · Nov 2026 beside the price
- **AND** Buy is hidden and the whole-card link still opens the item page.

#### Scenario: Labels stay consistent

- **WHEN** a record is repressing or sold_out
- **THEN** the card shows Repressing or Sold Out respectively
- **AND** the strings Out of Stock, Currently Unavailable and Unavailable never appear.

#### Scenario: Selling is paused or the state is unknown

- **WHEN** a record is unavailable or carries an availabilityState absent from the browser's vocabulary
- **THEN** the card shows its price with no status chip and no Buy, rather than a label or stale status.

### Requirement: Availability states keep one tone on every surface

Each shopper availability state SHALL use the same tone wherever it appears: Store cards, the Store item page, Releases badges, the cart and checkout. Sold Out alone SHALL use a solid Store Blood edge; Coming Soon and Repressing SHALL use a dashed neutral edge; Pre-order keeps Preorder Sea Green. Size and shape SHALL follow the surface, a compact chip or the item page's purchase control. Notify me SHALL be a quiet text action, never an outlined or red control.

#### Scenario: Sold Out appears on several surfaces

- **WHEN** one variant reads Sold Out on its Store card, item page, Releases card and a cart line
- **THEN** each shows the Store Blood edge, and none of them shows that edge for Coming Soon or Repressing.

#### Scenario: Notify me sits under a Coming Soon status

- **WHEN** Notify me renders on a Store item page
- **THEN** it reads as a quiet text action with a mail icon, so it is not mistaken for the status above it.
