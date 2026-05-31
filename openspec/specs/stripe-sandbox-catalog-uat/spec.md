# stripe-sandbox-catalog-uat Specification

## Purpose

TBD - created by archiving change align-full-stripe-sandbox-catalog-uat. Update Purpose after archive.

## Requirements

### Requirement: Full Astro Store Catalog MUST Be Sandbox Checkout Eligible

The sandbox UAT catalog alignment SHALL include every current Astro Store Item loaded by the Stripe catalog filesystem adapter, excluding placeholder content that the adapter intentionally excludes.

#### Scenario: Current Astro Store Items are projected

- **GIVEN** the repo contains current release and distro Store Item content
- **WHEN** the sandbox UAT catalog artifacts are generated
- **THEN** the backend Product Projection manifest contains exactly one entry for each loaded Store Item
- **AND** every entry is marked `checkout_eligible`
- **AND** every entry contains a stable absolute Product image URL
- **AND** `___.json` remains excluded unless a separate content decision makes it a real Store Item.

### Requirement: Sandbox Price Defaults MUST Follow Format Policy

The sandbox expected Price policy SHALL use deterministic test prices by Store Item format while keeping Stripe as Price Authority.

#### Scenario: Format prices are assigned

- **GIVEN** a current Store Item has a cassette or tape format
- **WHEN** sandbox expected Prices are derived
- **THEN** its expected amount is `1200` and currency is `EUR`.

#### Scenario: T-shirt prices are assigned

- **GIVEN** a current Store Item has a T-shirt or tee format
- **WHEN** sandbox expected Prices are derived
- **THEN** its expected amount is `2000` and currency is `EUR`.

#### Scenario: Default physical goods prices are assigned

- **GIVEN** a current Store Item is vinyl, LP, a release, or an unknown physical good
- **WHEN** sandbox expected Prices are derived
- **THEN** its expected amount is `2800` and currency is `EUR`.

### Requirement: Sandbox Product Category MUST Follow Physical Goods Policy

The sandbox Product Projection policy SHALL assign the physical goods Stripe Tax category to every current Astro Store Item because the UAT catalog sells shipped physical goods.

#### Scenario: Physical goods Product category is assigned

- **GIVEN** current Astro Store Items are releases, vinyl, cassettes, CDs, shirts, or similar shipped merch
- **WHEN** backend Product Projection entries are generated
- **THEN** every generated Product Projection has `taxCode = txcd_99999999`
- **AND** no current Product Projection falls back to `null` or `txcd_10000000`.

### Requirement: Sandbox UAT Stock Seed MUST Support Repeated Tests

The sandbox UAT D1 seed SHALL make every current Store Item checkout-ready while reserving exactly one low-stock item for behavior testing.

#### Scenario: Low-stock item is isolated

- **GIVEN** sandbox UAT seed SQL is generated
- **WHEN** Stock rows are produced
- **THEN** `afterglow-tape` has `quantity = 1` and `onlineQuantity = 1`
- **AND** every other Store Item has `quantity = 99` and `onlineQuantity = 99`.

### Requirement: Stripe Sandbox Reset MUST Be Safe and Scoped

The Stripe sandbox catalog reset SHALL be dry-run by default, require explicit confirmation for mutation, reject non-sandbox environments, and only deactivate repo-owned Stripe test-mode catalog objects.

#### Scenario: Dry-run reports scoped objects

- **GIVEN** active Stripe sandbox Products and Prices exist
- **WHEN** the reset command runs without `--confirm`
- **THEN** it reports only objects matching BlackBox sandbox metadata or lookup keys
- **AND** it does not mutate Stripe state
- **AND** provider object IDs are redacted.

#### Scenario: Confirm deactivates rather than deletes

- **GIVEN** the reset command is run with `--env sandbox --confirm`
- **WHEN** matching repo-owned sandbox catalog objects are found
- **THEN** active Prices are updated with `active = false`
- **AND** active Products are updated with `active = false`
- **AND** no Product or Price is hard-deleted.
