# store-listing-price-presentation Specification

## Purpose

TBD - created by archiving change refine-store-catalog-discovery. Update Purpose after archive.

## Requirements

### Requirement: Listing-price projection is browser-safe and bounded

The Worker SHALL expose one read-only listing-price projection backed only by Store Offer snapshots, with at most one presentation record per canonical Store Item snapshot.

#### Scenario: Browser reads a usable listing price

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

#### Scenario: Snapshot cannot present a current price

- **GIVEN** a Store Offer snapshot is missing, inactive, malformed, or was not produced from one unambiguous valid Price Authority
- **WHEN** the listing-price projection is prepared
- **THEN** its presentation state is explicitly non-price or no matching record is returned
- **AND** it does not return a guessed amount
- **AND** elapsed time alone is not a reason for the non-price state.

#### Scenario: Runtime snapshot renewal is absent

- **WHEN** the legacy scheduled-renewal contract is evaluated
- **THEN** no UAT catalog Cron or time-only snapshot renewal is registered
- **AND** valid snapshots remain presentable without scheduled renewal.

### Requirement: Store collection prices use one projection read

Store collection cards SHALL obtain displayed listing prices from exactly one listing-price projection network read per Store collection activation, rather than per-card Store Offer reads. A shell-managed Store activation SHALL prepare that one read at activation start so it can run concurrently with Store HTML retrieval or cached snapshot application, and the current listing presentation SHALL consume the same prepared result without issuing another request.

#### Scenario: Visitor opens a populated Store collection directly

- **GIVEN** a Store collection document renders multiple canonical Store Item cards without a prepared shell activation
- **WHEN** the persistent Store shell becomes active
- **THEN** it makes one fresh listing-price projection read for that collection activation
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
