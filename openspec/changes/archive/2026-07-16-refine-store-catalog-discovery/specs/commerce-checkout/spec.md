## MODIFIED Requirements

### Requirement: Storefront price display follows Worker Store Offers

The system SHALL present Store Item detail prices from Worker Store Offers that reflect current Stripe Price Authority, and Store collection listing prices from a browser-safe presentation projection backed by current Store Offer snapshots.

#### Scenario: Store Item detail renders price

- **GIVEN** a shopper opens one canonical Store Item detail document
- **WHEN** the browser needs that item's price or checkout readiness
- **THEN** it reads the Worker Store Offer for that Store Item
- **AND** it does not use Astro content, Decap content, static JSON, browser cart state, or listing-price presentation as checkout authority.

#### Scenario: Store item card renders price

- **GIVEN** a canonical Store Item appears in a Store collection
- **WHEN** the browser needs its visible listing price
- **THEN** it reads the Worker listing-price presentation projection
- **AND** the card does not initiate a separate authoritative Store Offer read solely to render its price.

#### Scenario: Stripe price changed after static deploy

- **GIVEN** a Stripe Dashboard operator changes a Store Item variant's Price after the current static site artifact was deployed
- **WHEN** scheduled, webhook, or read-time reconciliation resolves the replacement Price
- **THEN** the Store Item detail price follows the current Worker Store Offer
- **AND** the listing price follows the refreshed presentation snapshot without an Astro rebuild.

#### Scenario: Store Offer cannot confirm price

- **GIVEN** the Worker cannot resolve one unambiguous active Stripe Price for the Store Item variant or a current presentation snapshot
- **WHEN** the storefront asks for price or readiness
- **THEN** the detail response is non-buyable and browser-safe and the listing response is explicitly non-price
- **AND** the UI does not present a stale static amount as checkout-ready.
