# Spec Delta

## MODIFIED Requirements

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
- **AND** depletion reports the variant's staff-chosen zero-stock state, coming_soon, repressing or sold_out, defaulting to sold_out; missing records and independent selling pauses report unavailable
- **AND** positive effective stock reports stocked whatever zero-stock state is chosen.

#### Scenario: Expected month is reported

- **WHEN** a coming_soon or repressing record's stock carries an expected month that has not passed on the current Europe/Athens date
- **THEN** the record carries expectedMonth as `YYYY-MM`
- **AND** a passed month, a sold_out, stocked or unavailable record, and a record without a month carry no expectedMonth.

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
- **THEN** it exposes only storeItemSlug, presentationState, displayPrice when ready, availabilityState, the optional expectedMonth, the optional lowStockQuantity of a ready record, and the pre-order field with at most a Ship Estimate
- **AND** quantities other than that opt-in count, zero-stock choices other than the reported state, copies-left switches, pre-order start times, availability alert counts, Stripe identifiers, variant identifiers, canCheckout, D1 identifiers and provider payloads remain private
- **AND** checkout independently validates current commerce authority.

## ADDED Requirements

### Requirement: Store cards use the shared availability vocabulary

Store collection cards SHALL show the status for each non-stocked availabilityState in the slot beside the retained price, using Coming Soon, Repressing, Sold Out or Unavailable. A shown expected month SHALL follow as "Expected Month YYYY". Only Sold Out SHALL use the Store Blood tone. A state the browser does not recognise SHALL read Unavailable.

#### Scenario: First pressing has not arrived

- **WHEN** a card's record is coming_soon with expectedMonth 2026-11
- **THEN** the card shows Coming Soon and Expected November 2026 beside the price
- **AND** Buy is hidden and the whole-card link still opens the item page.

#### Scenario: Labels stay consistent

- **WHEN** a record is repressing, sold_out or unavailable
- **THEN** the card shows Repressing, Sold Out or Unavailable respectively
- **AND** the strings Out of Stock and Currently Unavailable never appear.

#### Scenario: Worker adds a state before the browser knows it

- **WHEN** a record carries an availabilityState absent from the browser's vocabulary
- **THEN** the card shows Unavailable with Buy hidden rather than empty or stale status.
