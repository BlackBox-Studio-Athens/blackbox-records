## MODIFIED Requirements

### Requirement: Listing-price projection is browser-safe and bounded

The Worker SHALL expose one read-only listing-price projection backed only by Store Offer snapshots, with at most one presentation record per canonical Store Item snapshot.

#### Scenario: Browser reads a usable fixed listing price

- **GIVEN** a Store Offer snapshot has active Product and Price state, a valid currency, and a non-negative fixed amount
- **WHEN** the browser reads the listing-price projection
- **THEN** the matching record contains only its canonical `storeItemSlug`, ready presentation state, and formatted display price
- **AND** snapshot age and `freshUntil` do not change that presentation state
- **AND** the response uses `Cache-Control: no-store`.

#### Scenario: Browser reads a usable pay-what-you-want listing price

- **GIVEN** an active Store Offer snapshot was produced from a valid reconciled pay-what-you-want Stripe Price and therefore has `amountMinor = null`
- **WHEN** the browser reads the listing-price projection
- **THEN** the matching record has ready presentation state and display price `Pay what you want`
- **AND** it is not classified as unavailable because it lacks a fixed amount.

#### Scenario: Browser inspects the listing-price response

- **WHEN** the Worker returns a listing-price projection
- **THEN** it does not expose Stripe Price IDs, Product IDs, variant IDs, stock, availability, `canCheckout`, D1 identifiers, provider payloads, feature-gate internals, or checkout authority.

#### Scenario: Snapshot cannot present a valid price

- **GIVEN** a Store Offer snapshot is missing, inactive, malformed, or was not produced from one unambiguous valid Price Authority
- **WHEN** the listing-price projection is prepared
- **THEN** its presentation state is explicitly non-price or no matching record is returned
- **AND** it does not return a guessed amount
- **AND** elapsed time alone is not a reason for the non-price state.
