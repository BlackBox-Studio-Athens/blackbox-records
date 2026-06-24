## MODIFIED Requirements

### Requirement: Repo product projection updates Stripe Products

The system SHALL project repo-owned product presentation fields to Stripe Products for checkout-eligible Store Item variants.

#### Scenario: Product projection is applied to UAT

- **GIVEN** a checkout-eligible Store Item variant has repo-owned title, description, image, and app identity fields
- **WHEN** UAT catalog sync runs with explicit apply mode
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

## RENAMED Requirements

### Requirement: UAT catalog alignment covers every checkout-eligible variant

FROM: Sandbox catalog alignment covers every checkout-eligible variant
TO: UAT catalog alignment covers every checkout-eligible variant

## MODIFIED Requirements

### Requirement: UAT catalog alignment covers every checkout-eligible variant

The system MUST verify UAT catalog alignment for every checkout-eligible Store Item variant, not only a single fixture item.

#### Scenario: UAT catalog verification runs

- **GIVEN** the repo has current Store Items and UAT D1 has checkout eligibility state
- **WHEN** `pnpm stripe:catalog:verify --env uat` runs
- **THEN** the report covers every checkout-eligible Store Item variant
- **AND** classifies identity, Product projection, Price authority, D1 readiness, and Store Offer snapshot status.

#### Scenario: UAT catalog apply succeeds

- **GIVEN** Stripe test-mode credentials and UAT D1 access are available
- **WHEN** `pnpm stripe:catalog:verify --env uat --apply` runs after a clean dry-run plan is reviewed
- **THEN** Stripe Products, Stripe Prices where permitted, D1 mappings, and Store Offer snapshots are aligned for checkout-eligible variants
- **AND** the follow-up dry-run reports no blocking catalog drift.
