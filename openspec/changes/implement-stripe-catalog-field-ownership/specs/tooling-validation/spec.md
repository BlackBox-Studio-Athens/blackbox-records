## ADDED Requirements

### Requirement: Catalog projection verification is dry-run by default

The system SHALL verify catalog field ownership, Product projection, Price authority, D1 readiness, and Store Offer snapshot state without mutating provider or database state by default.

#### Scenario: Operator runs catalog verification

- **GIVEN** an operator runs `pnpm stripe:catalog:verify --env sandbox` without `--apply`
- **WHEN** the command inspects repo projection, sandbox D1, and Stripe catalog state
- **THEN** it reports Product projection drift, Price authority drift, Store Offer snapshot drift, missing D1 readiness, and redacted provider diagnostics
- **AND** it does not mutate Stripe Products, Stripe Prices, D1 mappings, Store Offer snapshots, repo content, or committed evidence.

#### Scenario: Output includes provider identifiers

- **GIVEN** verification needs to mention Stripe Products, Prices, webhook endpoint IDs, API errors, or secrets
- **WHEN** output is printed or evidence is written
- **THEN** full provider IDs, secret values, account-private values, and API error payloads are redacted.

### Requirement: Catalog apply is environment-scoped and sandbox-first

The system MUST require explicit environment and apply flags before mutating Stripe Products, Stripe Prices, D1 mappings, or Store Offer snapshots.

#### Scenario: Sandbox apply is requested

- **GIVEN** an operator runs `pnpm stripe:catalog:verify --env sandbox --apply`
- **WHEN** the dry-run plan has actionable Product projection or sandbox Price/D1 drift
- **THEN** the command applies only sandbox-scoped changes
- **AND** prints a redacted post-apply verification report.

#### Scenario: Production apply is requested before go-live approval

- **GIVEN** an operator requests catalog apply for production
- **WHEN** production catalog mutation has not been explicitly approved by the production go-live readiness workflow
- **THEN** the command refuses to mutate provider or D1 state
- **AND** reports the required approval gate.

### Requirement: Field ownership has layered tests

The system SHALL test catalog field ownership through deterministic unit tests, script tests, and sandbox operator checks.

#### Scenario: Unit tests run

- **GIVEN** field ownership, Product projection, Price reconciliation, or webhook replay behavior changes
- **WHEN** targeted unit tests run
- **THEN** they cover ownership matrix completeness, Product projection planning, Price replacement reconciliation, ambiguity failures, stale snapshot updates, webhook duplicate handling, and redaction.

#### Scenario: Script tests run

- **GIVEN** catalog verification or apply command behavior changes
- **WHEN** script-level tests run
- **THEN** they cover argument parsing, dry-run immutability, sandbox-only apply enforcement, redacted reports, all-current-catalog coverage, and missing credential classification.

#### Scenario: Sandbox live checks run

- **GIVEN** sandbox Stripe and Cloudflare credentials are available
- **WHEN** live/operator checks run
- **THEN** `pnpm stripe:webhooks:verify --env sandbox`, `pnpm stripe:catalog:verify --env sandbox`, sandbox apply when needed, and Stripe sandbox smoke prove persistent webhook delivery and hosted Checkout catalog alignment without exposing secrets.
