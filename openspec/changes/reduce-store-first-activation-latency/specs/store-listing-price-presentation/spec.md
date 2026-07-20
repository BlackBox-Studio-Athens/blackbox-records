## MODIFIED Requirements

### Requirement: Store collection prices use one projection read

Store collection cards SHALL obtain displayed listing prices from exactly one listing-price projection network read per Store collection activation, rather than per-card Store Offer reads. A shell-managed Store activation SHALL prepare that one read at activation start so it can run concurrently with Store HTML retrieval or cached snapshot application, and the current listing presentation SHALL consume the same prepared result without issuing another request.

#### Scenario: Visitor opens a populated Store collection directly

- **GIVEN** a Store collection document renders multiple canonical Store Item cards without a prepared shell activation
- **WHEN** the persistent Store shell becomes active
- **THEN** it makes one fresh listing-price projection read for that collection activation
- **AND** it does not read `/api/store/items/:storeItemSlug` once per card solely to render listing prices.

#### Scenario: Uncached shell navigation opens a Store collection

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
