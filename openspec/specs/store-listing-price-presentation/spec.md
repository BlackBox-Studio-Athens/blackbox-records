# store-listing-price-presentation Specification

## Purpose

Provide bounded, browser-safe Store listing prices and availability from current commerce authority, including pre-order and opt-in copies-left presentation, while keeping purchase validation independent.

## Requirements

### Requirement: Listing-price projection is browser-safe and bounded

The Worker SHALL expose one read-only listing-price projection with at most one record per canonical Store Item snapshot. It SHALL retain the discriminated price representation, one required availabilityState: stocked, sold_out, out_of_stock, or unavailable, and one required pre-order field that is empty or carries only the shopper-visible Ship Estimate. A ready record MAY also carry the optional lowStockQuantity defined by the requirement "Listing projection carries an opt-in copies-left count", independently of the pre-order field. One bulk database query SHALL read price snapshots, canonical item identity, current availability, stock and pending checkout holds without provider reads or writes.

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
- **AND** depletion reports out_of_stock when restockPlanned is true, otherwise sold_out; missing records and independent selling pauses report unavailable.

#### Scenario: Pre-order is reported

- **WHEN** an item's stock record carries a pre-order that is open on the current Europe/Athens date
- **THEN** the record reports the pre-order with its Ship Estimate, or without one when a month estimate has passed
- **AND** the pre-order field is independent of availabilityState and of the price state
- **AND** an item without a stock record, without a pre-order, or whose exact ship date has arrived reports no pre-order.

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
- **THEN** it exposes only storeItemSlug, presentationState, displayPrice when ready, availabilityState, the optional lowStockQuantity of a ready record, and the pre-order field with at most a Ship Estimate
- **AND** quantities other than that opt-in count, restock flags, copies-left switches, pre-order start times, Stripe identifiers, variant identifiers, canCheckout, D1 identifiers and provider payloads remain private
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
