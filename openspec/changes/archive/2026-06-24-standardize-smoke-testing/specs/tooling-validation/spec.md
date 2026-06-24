## ADDED Requirements

### Requirement: Shared smoke harness

The system SHALL centralize common smoke-runner mechanics in a shared harness while keeping smoke suites domain-specific.

#### Scenario: Smoke runner needs common mechanics

- **WHEN** a smoke runner needs URL normalization, browser launch, console capture, route probing, screenshot capture, evidence writing, redaction, or high-risk secret scanning
- **THEN** it uses the shared smoke harness instead of duplicating those mechanics
- **AND** suite-specific code remains responsible for domain assertions, setup, and pass/fail semantics.

#### Scenario: New smoke suite is added

- **WHEN** a new smoke suite is introduced
- **THEN** it declares its environment, suite name, scenarios, mutation boundaries, evidence path, and required external prerequisites
- **AND** it adds focused tests for scenario selection, evidence shape, and redaction behavior.

### Requirement: Standard smoke evidence

The system SHALL write redacted smoke evidence in a consistent structure that CI and maintainers can inspect.

#### Scenario: Smoke run writes evidence

- **WHEN** a smoke suite runs
- **THEN** it writes a run summary and per-scenario evidence under `.codex-artifacts/smoke/<environment>/<suite>/<run-id>/` or a documented compatibility path
- **AND** screenshots and traces are controlled by explicit runner options or failure policy
- **AND** CI uploads the relevant smoke evidence paths when the workflow runs.

#### Scenario: Smoke output contains sensitive values

- **WHEN** smoke output, evidence, screenshots, traces, or failure summaries include provider IDs, checkout session IDs, payment intent IDs, secret-looking values, Access tokens, Cloudflare tokens, D1 binding names, or runtime secret variable names
- **THEN** the smoke harness redacts or fails closed before evidence is accepted
- **AND** committed files do not include unredacted provider-private smoke evidence.

### Requirement: Smoke suite boundaries

The system SHALL separate static smoke, provider smoke, and promotion smoke boundaries.

#### Scenario: Static smoke runs

- **WHEN** static smoke runs against UAT
- **THEN** it performs non-mutating deployed static/CMS/public-route checks
- **AND** it does not create checkout sessions, authenticate to CMS, edit content, mutate D1, call webhooks, or touch Stripe provider state.

#### Scenario: Provider smoke runs

- **WHEN** Stripe sandbox smoke runs
- **THEN** it remains the authoritative UAT hosted Checkout/provider evidence path for payment surface, sandbox paid outcomes, webhook delivery, order reconciliation, and stock effects.

#### Scenario: Promotion smoke runs

- **WHEN** PRD promotion smoke runs
- **THEN** it stays bounded by PRD-open and paid-smoke policy gates
- **AND** absent production paid-smoke policy is reported as `not_configured`, not passed.

## MODIFIED Requirements

### Requirement: Stripe sandbox smoke verifies hosted Checkout surface

The system SHALL include a pre-payment Stripe sandbox smoke scenario that verifies the hosted Checkout amount and payment-method surface, using the shared smoke harness only for common mechanics and not for checkout authority decisions.

#### Scenario: Hosted Checkout surface is checked

- **GIVEN** UAT static frontend, sandbox Worker, sandbox D1, Stripe catalog mapping, and Payment Method Configuration are ready
- **WHEN** `pnpm smoke:stripe-sandbox -- --scenario checkout_surface` runs against that deployment
- **THEN** it reaches Stripe-hosted Checkout without submitting payment
- **AND** it verifies the displayed amount, currency, product projection, and expected payment-method surface
- **AND** it writes redacted smoke evidence through the standard smoke evidence contract or a documented compatibility path.
