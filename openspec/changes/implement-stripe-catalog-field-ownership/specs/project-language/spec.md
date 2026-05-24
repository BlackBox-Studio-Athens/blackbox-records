## ADDED Requirements

### Requirement: Catalog ownership terms are canonical

The system SHALL use consistent terms for Stripe catalog field ownership across specs, code, tests, docs, validation output, and handoff summaries.

#### Scenario: Catalog Field Ownership is referenced

- **GIVEN** a spec, test, script, or doc describes which system owns a catalog field
- **WHEN** it names that boundary
- **THEN** it uses `Catalog Field Ownership` to mean the declared source of truth and allowed sync direction for a catalog field.

#### Scenario: Product Projection is referenced

- **GIVEN** repo-owned product presentation fields are sent to Stripe Product fields
- **WHEN** specs, code, tests, docs, or diagnostics name that process
- **THEN** they use `Product Projection`
- **AND** do not describe it as bidirectional sync.

#### Scenario: Price Authority is referenced

- **GIVEN** Stripe Price amount, currency, active status, lookup key, or Price identity controls Store Offer price and checkout creation
- **WHEN** specs, code, tests, docs, or diagnostics name that authority
- **THEN** they use `Price Authority`
- **AND** distinguish it from repo-owned Product Projection.

#### Scenario: Sandbox Catalog Alignment is referenced

- **GIVEN** sandbox Stripe Products, Stripe Prices, D1 mappings, Store Offer snapshots, stock, and availability are verified together
- **WHEN** specs, code, tests, docs, or diagnostics name that proof
- **THEN** they use `Sandbox Catalog Alignment`
- **AND** state whether the proof is dry-run, apply, smoke, or provider-live evidence.
