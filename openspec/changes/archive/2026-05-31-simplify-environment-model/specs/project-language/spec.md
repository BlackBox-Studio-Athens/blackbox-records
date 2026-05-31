## MODIFIED Requirements

### Requirement: Environment terms

The system SHALL use canonical environment terminology across specs, docs, workflows, tests, validation output, and handoff notes.

#### Scenario: Product Environment is named

- **WHEN** a user-facing or maintainer-facing artifact describes where the product runs
- **THEN** it uses Local, UAT, or PRD
- **AND** it does not use `sandbox`, `production`, `test`, `live`, GitHub Actions environment names, or Wrangler environment names as product environment substitutes.

#### Scenario: Platform Environment is named

- **WHEN** an artifact describes a GitHub Actions environment, Wrangler environment, Cloudflare Pages project, Worker runtime target, Stripe mode, or secret store
- **THEN** it labels that concept as a platform/provider/configuration layer
- **AND** it maps the concept back to Local, UAT, or PRD.

## ADDED Requirements

### Requirement: Local mode terms

The system SHALL use `mock` and `uat-connected` as the normal Local mode names.

#### Scenario: Local mock mode is described

- **WHEN** docs, scripts, or validation output describe deterministic local development
- **THEN** they use `mock`
- **AND** they map it to local static hosting, local Worker, local D1, and stripe-mock.
- **AND** they treat `mock-api` as an implementation alias for the same Local mode rather than as a separate product environment.

#### Scenario: Local UAT-connected mode is described

- **WHEN** docs, scripts, or validation output describe local frontend work against deployed UAT
- **THEN** they use `uat-connected`
- **AND** they state that local code calls the deployed UAT Worker/API without copying UAT secrets into local files.

### Requirement: PRD-disabled terms

The system SHALL describe PRD as configured but disabled until an explicit production-readiness gate opens it.

#### Scenario: PRD readiness is discussed

- **WHEN** docs, workflows, smoke tests, or Promotion Evidence discuss PRD before go-live
- **THEN** they state whether the action is readiness-only, disabled, not configured, or explicitly opened
- **AND** they do not imply that Cloudflare Pages deployment alone makes live commerce buyable
- **AND** they do not call readiness-only, disabled, or `not_configured` evidence successful PRD Promotion Evidence.

### Requirement: Catalog asset terms

The system SHALL describe Stripe Product image URLs and public catalog asset URLs as environment-scoped catalog promotion data.

#### Scenario: Catalog asset URL is named

- **WHEN** docs, specs, scripts, or validation output describe a Product Projection image URL, Stripe Product image URL, or public catalog asset URL
- **THEN** they identify whether the URL belongs to Local diagnostics, UAT, or PRD
- **AND** they do not describe UAT-hosted catalog assets as PRD-ready unless a later approved change defines a shared canonical asset CDN.
