## MODIFIED Requirements

### Requirement: Smoke terminology

The system SHALL use canonical smoke terms across scripts, workflows, specs, tests, docs, and evidence.

#### Scenario: Smoke terms are named

- **WHEN** an artifact references shared smoke plumbing or evidence
- **THEN** it uses `Smoke Harness` for the shared Playwright, route probing, redaction, secret scanning, and evidence-writing helpers
- **AND** it uses `Smoke Suite` for a domain-owned runner and its named scenarios
- **AND** it uses `Smoke Scenario` for one named check within a suite
- **AND** it uses `Smoke Evidence` for the redacted per-scenario evidence and run summary
- **AND** it uses `Static Smoke` for read-only UAT static or CMS/browser validation that does not create provider state
- **AND** it uses `Provider Smoke` for Stripe- and D1-authoritative hosted-checkout evidence.
