## ADDED Requirements

### Requirement: Listing-price projection is browser-safe and bounded

The Worker SHALL expose one read-only listing-price projection backed only by current Store Offer snapshots, with at most one presentation record per canonical Store Item snapshot.

#### Scenario: Browser reads a usable listing price

- **GIVEN** a Store Offer snapshot is fresh and has an active Product and Price with a resolved formatted amount
- **WHEN** the browser reads the listing-price projection
- **THEN** the matching record contains only its canonical `storeItemSlug`, a presentation state, and formatted display price
- **AND** the response uses `Cache-Control: no-store`.

#### Scenario: Browser inspects the listing-price response

- **WHEN** the Worker returns a listing-price projection
- **THEN** it does not expose Stripe Price IDs, Product IDs, variant IDs, stock, availability, `canCheckout`, D1 identifiers, provider payloads, feature-gate internals, or checkout authority.

#### Scenario: Snapshot cannot present a current price

- **GIVEN** a Store Offer snapshot is missing, stale, inactive, or lacks a resolved amount
- **WHEN** the listing-price projection is prepared
- **THEN** its presentation state is explicitly non-price
- **AND** it does not return a cached or guessed amount.

### Requirement: Store collection prices use one projection read

Store collection cards SHALL obtain displayed listing prices from one listing-price projection read per collection activation, rather than per-card Store Offer reads.

#### Scenario: Visitor opens a populated Store collection directly

- **GIVEN** a Store collection document renders multiple canonical Store Item cards
- **WHEN** the persistent Store shell becomes active
- **THEN** it makes one listing-price projection read for that collection activation
- **AND** it does not read `/api/store/items/:storeItemSlug` once per card solely to render listing prices.

#### Scenario: Shell navigation replaces a Store collection

- **GIVEN** shell-managed navigation replaces `main` with a Store collection snapshot
- **WHEN** the new collection becomes active or a cached collection is restored
- **THEN** the listing-price presentation refreshes the current placeholders
- **AND** cached rendered price text is not treated as current commerce authority.

#### Scenario: Listing price cannot be loaded

- **GIVEN** the listing-price projection request fails or does not contain a card's Store Item slug
- **WHEN** that card renders its price region
- **THEN** it shows an explicit non-price state
- **AND** it does not retain `Checking price` indefinitely or show a stale static amount.
