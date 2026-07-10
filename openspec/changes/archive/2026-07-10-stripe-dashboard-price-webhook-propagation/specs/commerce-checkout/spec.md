## ADDED Requirements

### Requirement: Storefront price display follows Worker Store Offers

The system SHALL display buyable storefront prices from Worker Store Offers that reflect current Stripe Price Authority.

#### Scenario: Store item card renders price

- **GIVEN** a Store Item appears on the storefront
- **WHEN** the browser needs the visible price
- **THEN** it reads the Worker Store Offer for that Store Item
- **AND** it does not use Astro content, Decap content, static JSON, or browser cart state as the authoritative displayed price.

#### Scenario: Stripe price changed after static deploy

- **GIVEN** a Stripe Dashboard operator changes a Store Item variant's Price after the current static site artifact was deployed
- **WHEN** the shopper opens or refreshes the Store Item page
- **THEN** the browser-visible price comes from the Worker Store Offer path
- **AND** the new price is visible without an Astro rebuild when webhook or read-time reconciliation has resolved it.

#### Scenario: Store Offer cannot confirm price

- **GIVEN** the Worker cannot resolve one unambiguous active Stripe Price for the Store Item variant
- **WHEN** the storefront asks for price/readiness
- **THEN** the response is non-buyable and browser-safe
- **AND** the UI does not present a stale static amount as checkout-ready.

### Requirement: Store Offer API responses stay fresh for commerce authority

The system MUST keep public Store Offer API responses from being cached as long-lived static assets.

#### Scenario: Browser reads Store Offer

- **WHEN** `/api/store/items/:storeItemSlug` returns price or checkout readiness
- **THEN** the response uses no-store or equivalent Worker API Freshness headers
- **AND** the response does not expose Stripe Price IDs, D1 IDs, secrets, raw provider payloads, or internal drift details.

#### Scenario: Same browser session saw an old price

- **GIVEN** a shopper opened a page before a Stripe Dashboard price change
- **WHEN** they open checkout or revisit the Store Item view in the same session
- **THEN** the browser rereads the Worker Store Offer or checkout start revalidates current Price Authority
- **AND** stale same-session display state cannot create a Checkout Session at the old price.

### Requirement: Checkout start revalidates replacement Prices

The system MUST revalidate active Stripe Price Authority at checkout start after any Stripe-side price change.

#### Scenario: Shopper checks out after replacement Price

- **GIVEN** a Stripe Dashboard operator replaced the active Price for a Store Item variant
- **AND** D1 mapping or Store Offer snapshot has been updated by webhook, read-time reconciliation, or manual verification
- **WHEN** the shopper starts checkout
- **THEN** the Worker creates the Stripe Checkout Session using the resolved current active Stripe Price
- **AND** hosted Checkout displays the same amount and currency as the Worker Store Offer evidence.

#### Scenario: Cart contains stale price snapshot

- **GIVEN** `StoreCart` contains an older browser-safe price snapshot
- **WHEN** checkout start is requested
- **THEN** the Worker ignores the stale browser price snapshot for payment authority
- **AND** validates current Store Offer, stock, feature gate, Stripe Price mapping, and Product Environment policy before creating checkout.

#### Scenario: Replacement Price is ambiguous

- **GIVEN** more than one active Stripe Price matches the requested variant
- **WHEN** checkout start is requested
- **THEN** the Worker rejects checkout with catalog drift
- **AND** no hosted Checkout Session is created.

### Requirement: Price propagation has visible shopper-safe states

The system SHALL provide clear browser-safe UI states while dynamic price propagation is pending or failed.

#### Scenario: Price is being checked

- **WHEN** the frontend is waiting for a Store Offer read
- **THEN** the UI shows pending price copy such as `Checking price`
- **AND** it does not show an authoritative amount until the Worker confirms one.

#### Scenario: Price check fails

- **GIVEN** the Worker Store Offer read fails or returns non-buyable catalog drift
- **WHEN** the storefront renders price state
- **THEN** the UI shows checkout-unavailable copy
- **AND** checkout controls remain disabled or fail closed.
