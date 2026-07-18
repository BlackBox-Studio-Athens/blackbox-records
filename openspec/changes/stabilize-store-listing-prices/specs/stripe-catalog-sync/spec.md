## MODIFIED Requirements

### Requirement: Stripe Prices are the buyable price source of truth

The system MUST NOT use Astro content or browser state as the authority for buyable Store Offer amount, currency, active price identity, or checkout readiness.

#### Scenario: Static storefront renders a buyable item

- **GIVEN** Astro content defines the editorial Store Item route, copy, artwork, and app-owned identifiers
- **WHEN** the storefront needs to show a buyable price or enable checkout
- **THEN** it uses a Worker-owned Store Offer derived from Stripe Price and D1 mapping authority
- **AND** Astro-authored content cannot override that amount or currency.

#### Scenario: Stripe price changes in the Dashboard

- **GIVEN** an operator creates or activates a replacement Stripe Price for a Store Item variant
- **WHEN** the Stripe Product/Price metadata or lookup key still identifies the same `storeItemSlug` and `variantId`
- **THEN** catalog sync updates the browser-safe Store Offer snapshot without requiring an Astro content change
- **AND** checkout start uses the resolved active Stripe Price rather than a stale static price.

#### Scenario: Store Offer snapshot differs from current Stripe state

- **GIVEN** the D1 Store Offer snapshot is missing or its Price identity, amount, currency, or active state differs from current Stripe Price Authority
- **WHEN** the storefront asks the Worker for an authoritative Store Offer or starts checkout
- **THEN** the Worker reconciles the active Stripe Price before returning browser-safe price and checkout readiness
- **AND** returns a non-buyable catalog-drift state if reconciliation cannot confirm the Stripe-backed offer
- **AND** snapshot age alone does not create catalog drift.

#### Scenario: Store Offer cannot be confirmed

- **GIVEN** the Worker cannot verify a current Stripe-backed Store Offer for a buyable variant
- **WHEN** the storefront renders an authoritative Store Offer or checkout start is requested
- **THEN** checkout is disabled or rejected with an actionable catalog-drift error
- **AND** the storefront does not present an Astro fixture price as authoritative.

### Requirement: Stripe catalog reconciliation survives Dashboard changes

The system MUST reconcile Stripe Product and Price changes made outside the repo without requiring Astro content edits, a static-site deployment, or a full-catalog scheduled Worker scan.

#### Scenario: Stripe catalog webhook event is received

- **GIVEN** Stripe sends a Product or Price catalog event for the configured environment
- **WHEN** the event identifies a known `storeItemSlug` and `variantId` through metadata or lookup key
- **THEN** the Worker reconciles only the related D1 mapping and browser-safe Store Offer snapshot
- **AND** unrelated Store Item variants are not reconciled by that event.

#### Scenario: Stripe catalog webhook event is missed

- **GIVEN** Stripe catalog state has changed since the last D1 snapshot
- **WHEN** an authoritative Store Offer read, checkout start, or targeted manual verification runs for the affected Store Item
- **THEN** the Worker or verifier detects current Price Authority and repairs or reports drift for that variant
- **AND** recovery does not require a runtime full-catalog scan.

### Requirement: Store Offer snapshots recover from missed webhooks

The system SHALL keep authoritative Store Offer reads, checkout start, and targeted manual catalog verification as backstops when webhook propagation is delayed or missed.

#### Scenario: Webhook was missed

- **GIVEN** Stripe Price state changed but D1 `StoreOfferSnapshot` still contains the previous Price
- **WHEN** a shopper-facing authoritative Store Offer read runs
- **THEN** the Worker reconciles current Stripe state before returning price/readiness
- **AND** the response returns the current replacement Price or a fail-closed catalog-drift state.

#### Scenario: Targeted manual verification runs after price change

- **GIVEN** an operator changes a Price in Stripe Dashboard
- **WHEN** `pnpm stripe:catalog:verify --env uat --store-item <storeItemSlug>` runs, with explicit apply when repair is required
- **THEN** the report classifies Product Projection, Price Authority, D1 mapping, and Store Offer snapshot status for only the identified Store Item variant
- **AND** apply mode does not reconcile or mutate unrelated variants
- **AND** output does not print Stripe secrets or full account-private object IDs.

#### Scenario: UAT Worker is deployed

- **WHEN** UAT Worker triggers and handlers are inspected
- **THEN** no scheduled full-catalog Stripe verification or time-only snapshot renewal is registered
- **AND** deliberate full-catalog verification remains an operator or CI audit path rather than a runtime cron.
