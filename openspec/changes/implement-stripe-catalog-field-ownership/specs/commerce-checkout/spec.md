## ADDED Requirements

### Requirement: Checkout consumes field-owned Store Offers

The system MUST create and display Stripe-backed checkout state from field-owned Store Offers rather than Astro price fixtures, browser cart prices, or unverified Stripe Dashboard state.

#### Scenario: Store page loads checkout controls

- **GIVEN** a static Store Item page has repo-owned editorial content and app identifiers
- **WHEN** the page needs checkout price or readiness
- **THEN** browser code reads the Worker Store Offer for that Store Item
- **AND** treats the Worker Store Offer as the only browser-safe buyable price/readiness source.

#### Scenario: Checkout starts with a stale cart snapshot

- **GIVEN** `StoreCart` contains an older browser-safe price snapshot
- **WHEN** checkout starts
- **THEN** the Worker revalidates the current Store Offer, stock, feature gate, and Stripe Price mapping
- **AND** creates the Stripe Checkout Session only from the currently resolved Stripe Price.

#### Scenario: Store Offer projection cannot be confirmed

- **GIVEN** Product projection, Price authority, D1 mapping, stock, or availability cannot be confirmed for the selected variant
- **WHEN** the storefront renders checkout state or checkout start is requested
- **THEN** the system disables checkout or rejects checkout with catalog drift
- **AND** no browser-supplied amount or Stripe Price ID is accepted.

### Requirement: Hosted Checkout display follows Product projection

The system SHALL keep Stripe-hosted Checkout display aligned with repo-owned Product projection for checkout-eligible Store Item variants.

#### Scenario: Hosted Checkout opens for a synced Product

- **GIVEN** a Store Item variant has a clean Product projection and resolved Stripe Price
- **WHEN** the Worker creates a hosted Stripe Checkout Session for that variant
- **THEN** the Stripe-hosted page uses the Product name and image derived from the repo-owned projection
- **AND** the amount and currency come from the resolved Stripe Price.

#### Scenario: Product projection is stale

- **GIVEN** the Stripe Product presentation fields do not match the repo-owned projection
- **WHEN** checkout readiness is verified before sandbox acceptance
- **THEN** verification fails or reports Product projection drift
- **AND** hosted Checkout evidence is not accepted as catalog-aligned until drift is resolved.
