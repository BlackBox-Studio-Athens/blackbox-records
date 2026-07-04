## ADDED Requirements

### Requirement: Stripe catalog mutation logs are correlatable

The system SHALL emit safe structured logs for Stripe catalog verification, apply, cleanup, and scheduled verification outcomes.

#### Scenario: Explicit catalog apply runs

- **GIVEN** a maintainer runs an explicit catalog apply that mutates Stripe catalog state
- **WHEN** the backend or script logs the outcome
- **THEN** logs include a stable event name, Product Environment, run identifier, action counts, drift counts, app-owned variant identity when useful, and idempotency correlation when safe
- **AND** logs omit Stripe secrets, webhook signatures, raw provider payloads, card data, shopper PII, and full Stripe object IDs.

#### Scenario: Scheduled catalog verification detects drift

- **GIVEN** scheduled UAT catalog verification runs in report-only mode
- **WHEN** drift is detected
- **THEN** Worker logs include summary counts by drift category and Product Environment
- **AND** the log does not create one noisy high-cardinality event per healthy Store Item variant.

#### Scenario: Catalog forensics need provider correlation

- **GIVEN** a Stripe Product or Price mutation must be traced in Stripe Workbench
- **WHEN** local reports or Worker logs are inspected
- **THEN** they expose safe correlation fields that can be matched to Stripe Events, request logs, lookup keys, metadata, request IDs, replay status, or idempotency keys without exposing secrets.
