# stripe-catalog-field-ownership Specification

## Purpose

TBD - created by archiving change implement-stripe-catalog-field-ownership. Update Purpose after archive.

## Requirements

### Requirement: Catalog fields have explicit owners

The system MUST define a field-level ownership contract for catalog fields that cross repo content, D1, Stripe Products, Stripe Prices, Worker Store Offers, browser state, and order reconciliation.

#### Scenario: Ownership matrix is evaluated

- **GIVEN** a catalog field participates in storefront display, hosted Checkout display, checkout amount, availability, stock, Stripe identity, or paid order state
- **WHEN** catalog verification or tests evaluate the field
- **THEN** the system identifies exactly one source of truth for that field
- **AND** identifies the allowed sync direction for that field.

#### Scenario: Field has no owner

- **GIVEN** a new catalog field is added to the projection or reconciliation path
- **WHEN** no source of truth is declared for that field
- **THEN** tests or catalog verification fail before that field is synced to Stripe, D1, browser state, or committed evidence.

### Requirement: Repo product projection updates Stripe Products

The system SHALL project repo-owned product presentation fields to Stripe Products for checkout-eligible Store Item variants.

#### Scenario: Product projection is applied to sandbox

- **GIVEN** a checkout-eligible Store Item variant has repo-owned title, description, image, and app identity fields
- **WHEN** sandbox catalog sync runs with explicit apply mode
- **THEN** the matching Stripe Product is updated with allowed repo-owned Product fields
- **AND** the command does not alter Stripe Price amount, currency, active status, or historical Price records from Astro content.

#### Scenario: Product projection drift is detected

- **GIVEN** a Stripe Product name, description, image, or metadata differs from the repo-owned projection
- **WHEN** catalog verification runs without apply mode
- **THEN** the report identifies Product projection drift for the affected Store Item variant
- **AND** no Stripe or D1 state is mutated.

#### Scenario: Product image is not safe for Stripe

- **GIVEN** a Store Item image cannot be converted to a stable absolute public URL
- **WHEN** catalog projection is verified
- **THEN** the system reports an actionable Product projection issue
- **AND** does not write a broken image URL to Stripe.

### Requirement: Stripe Prices remain payment authority

The system MUST treat Stripe Price amount, currency, active status, Price ID, and lookup key as Stripe-owned payment authority.

#### Scenario: Price changes in Stripe

- **GIVEN** an operator creates or activates a replacement Stripe Price that identifies an existing Store Item variant through metadata or lookup key
- **WHEN** catalog reconciliation runs from webhook, Store Offer read, checkout start, scheduled verification, or manual verification
- **THEN** D1 `VariantStripeMapping` and `StoreOfferSnapshot` are updated to the resolved active Stripe Price
- **AND** browser-visible Store Offer price reflects the Stripe Price without requiring an Astro deploy.

#### Scenario: Repo content changes a display field

- **GIVEN** repo-owned Store Item title, description, or image changes
- **WHEN** Product projection apply runs
- **THEN** Stripe Product presentation fields may be updated
- **AND** Stripe Price amount and currency remain unchanged unless a sandbox-only Price alignment operation is explicitly requested and reported.

#### Scenario: Multiple active Prices match one variant

- **GIVEN** more than one active Stripe Price matches a Store Item variant for the selected environment
- **WHEN** catalog reconciliation runs
- **THEN** the system reports catalog drift and refuses to enable checkout for that variant
- **AND** it does not pick one Price arbitrarily.

### Requirement: Sync loops are prohibited

The system MUST prevent Stripe Dashboard edits and repo content edits from forming bidirectional sync loops.

#### Scenario: Dashboard edits a repo-owned Product field

- **GIVEN** a Stripe Dashboard user changes a Product field that is owned by the repo projection
- **WHEN** catalog verification runs
- **THEN** the system reports the Product field as drift from repo projection
- **AND** does not import the Dashboard value into repo content.

#### Scenario: Repo edits a Stripe-owned Price field

- **GIVEN** repo content or catalog projection attempts to change the buyable amount or currency for an existing Stripe Price
- **WHEN** catalog verification or apply planning runs
- **THEN** the system rejects that as a field-ownership violation
- **AND** requires a replacement Stripe Price alignment path instead.

### Requirement: Catalog webhooks are replay-safe

The system SHALL process Stripe catalog webhook events idempotently and reconcile current Stripe state rather than trusting event ordering.

#### Scenario: Duplicate catalog event arrives

- **GIVEN** Stripe delivers the same catalog event more than once
- **WHEN** the Worker receives the duplicate delivery
- **THEN** processing is deduplicated or safely replayed without duplicating state transitions
- **AND** the endpoint still returns a successful acknowledgement for already-handled events.

#### Scenario: Catalog events arrive out of order

- **GIVEN** Stripe delivers Product and Price events in an order that does not match the latest Stripe object state
- **WHEN** the Worker processes the event
- **THEN** reconciliation resolves current Stripe Product and Price state before updating D1 Store Offer data.

### Requirement: Sandbox catalog alignment covers every checkout-eligible variant

The system MUST verify sandbox catalog alignment for every checkout-eligible Store Item variant, not only a single fixture item.

#### Scenario: UAT catalog verification runs

- **GIVEN** the repo has current Store Items and UAT D1 has checkout eligibility state
- **WHEN** `pnpm stripe:catalog:verify --env uat` runs
- **THEN** the report covers every checkout-eligible Store Item variant
- **AND** classifies identity, Product projection, Price authority, D1 readiness, and Store Offer snapshot status.

#### Scenario: UAT catalog apply succeeds

- **GIVEN** sandbox Stripe credentials and UAT D1 access are available
- **WHEN** `pnpm stripe:catalog:verify --env uat --apply` runs after a clean dry-run plan is reviewed
- **THEN** sandbox Stripe Products, sandbox Stripe Prices where permitted, D1 mappings, and Store Offer snapshots are aligned for checkout-eligible variants
- **AND** the follow-up dry-run reports no blocking catalog drift.
