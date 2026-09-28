## MODIFIED Requirements

### Requirement: Listing-price projection is browser-safe and bounded

The Worker SHALL expose one read-only listing-price projection with at most one record per canonical Store Item snapshot. It SHALL retain the discriminated price representation and add one required availabilityState: stocked, sold_out, out_of_stock, or unavailable. One bulk database query SHALL read price snapshots, canonical item identity, current availability, stock and pending checkout holds without provider reads or writes.

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

#### Scenario: Browser inspects the listing-price response

- **WHEN** the Worker returns the projection
- **THEN** it exposes only storeItemSlug, presentationState, displayPrice when ready, and availabilityState
- **AND** quantities, restock flags, Stripe identifiers, variant identifiers, canCheckout, D1 identifiers and provider payloads remain private
- **AND** checkout independently validates current commerce authority.

## ADDED Requirements

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
