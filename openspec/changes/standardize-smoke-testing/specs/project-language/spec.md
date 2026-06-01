## ADDED Requirements

### Requirement: Smoke terminology

The system SHALL use canonical smoke-testing terms in specs, scripts, workflows, docs, tests, and evidence.

#### Scenario: Shared smoke infrastructure is discussed

- **WHEN** docs or implementation refer to common smoke code
- **THEN** they use `Smoke Harness` for shared URL, browser, route-probe, redaction, screenshot, trace, and evidence utilities
- **AND** they do not call the harness a smoke suite unless it owns domain scenarios.

#### Scenario: Smoke suites are discussed

- **WHEN** docs, workflows, or scripts discuss a runnable smoke command
- **THEN** they use `Smoke Suite` for a domain runner such as Static Smoke, Provider Smoke, or Promotion Smoke
- **AND** they use `Smoke Scenario` for an individual selected path within that suite.

#### Scenario: Smoke evidence is discussed

- **WHEN** smoke output is recorded or reviewed
- **THEN** `Smoke Evidence` means redacted run summaries, per-scenario evidence, screenshots, traces, and workflow artifacts produced by a smoke suite
- **AND** the evidence is labeled by environment and suite.

#### Scenario: Static smoke and provider smoke are compared

- **WHEN** static and provider smoke are discussed together
- **THEN** `Static Smoke` means non-mutating deployed static/CMS/public-route checks
- **AND** `Provider Smoke` means checks that prove external provider or backend authority such as Stripe Checkout, webhook delivery, D1 order state, and stock effects
- **AND** `Promotion Smoke` means smoke run as part of catalog promotion or production-readiness workflow evidence.
