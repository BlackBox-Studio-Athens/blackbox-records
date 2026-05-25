## ADDED Requirements

### Requirement: Catalog promotion terms are canonical

The system SHALL use consistent terms for CMS-driven provider publication across specs, scripts, workflows, docs, tests, and UI copy.

#### Scenario: Referring to the generated target state

- **GIVEN** code, tests, specs, or docs describe the catalog state generated from Decap/Astro content before provider apply
- **WHEN** they name that concept
- **THEN** they use `Desired Catalog State`
- **AND** they do not call it Stripe authority, Store Offer authority, static price authority, or Dashboard state.

#### Scenario: Referring to provider state

- **GIVEN** code, tests, specs, or docs describe current Stripe Product/Price objects and D1 mappings/snapshots after verification or apply
- **WHEN** they name that concept
- **THEN** they use `Provider Catalog State`
- **AND** they keep it distinct from Desired Catalog State and browser StoreCart state.

#### Scenario: Referring to an automated publication attempt

- **GIVEN** code, workflows, specs, or docs describe one execution of CMS-to-UAT or CMS-to-production catalog automation
- **WHEN** they name that execution
- **THEN** they use `Promotion Run`
- **AND** the run is scoped to an artifact commit, target environment, affected variants, and evidence artifact.

#### Scenario: Referring to proof from a promotion

- **GIVEN** code, workflows, specs, or docs describe redacted output proving what happened during a Promotion Run
- **WHEN** they name that proof
- **THEN** they use `Promotion Evidence`
- **AND** they distinguish it from raw provider logs, dashboard screenshots, and committed secrets.

### Requirement: Desired Price language preserves runtime authority boundaries

The system MUST describe CMS-entered price data as desired provider provisioning input, not as checkout authority.

#### Scenario: Referring to CMS price input

- **GIVEN** code, specs, docs, or CMS labels describe the amount/currency entered by a maintainer
- **WHEN** the price is used to create or resolve Stripe Prices during promotion
- **THEN** they use `Desired Price`
- **AND** they do not call it the charged price until Provider Catalog State confirms the active Stripe Price.

#### Scenario: Referring to checkout amount

- **GIVEN** code, specs, docs, or UI copy describe the amount used to create hosted Checkout
- **WHEN** checkout starts
- **THEN** they refer to the Worker Store Offer and active Stripe Price as authority
- **AND** they do not claim static Astro content or StoreCart owns payment amount.
