## MODIFIED Requirements

### Requirement: Product environment mapping

The system SHALL maintain a single mapping from Product Environments to static hosts, Worker runtime targets, D1 data stores, app-owned Stripe target values, Stripe provider modes, secret stores, validation controls, and environment-derived runtime policies.

#### Scenario: UAT mapping is evaluated

- **WHEN** UAT is described or validated
- **THEN** it maps to GitHub Pages static hosting, the `uat` Worker runtime target, UAT D1, app-owned Stripe target `uat`, Stripe test mode, UAT-scoped GitHub Actions credentials, UAT sink-routing policy, and UAT Promotion Evidence.

#### Scenario: PRD mapping is evaluated

- **WHEN** PRD is described or validated
- **THEN** it maps to Cloudflare Pages static hosting, the `prd` Worker runtime target, PRD D1, app-owned Stripe target `prd`, Stripe live mode, direct production routing policy, and PRD-scoped GitHub Actions credentials
- **AND** live catalog preparation requires operation-specific confirmation for one exact run
- **AND** shopper checkout requires `PRD_LAUNCH_APPROVED=true` plus the runtime `native_checkout_enabled` switch
- **AND** pre-go-live PRD evidence remains readiness, disabled, or `not_configured` evidence rather than successful launch evidence.

#### Scenario: Local mapping is evaluated

- **WHEN** Local is described or validated
- **THEN** it exposes only `mock` and `uat-connected` as normal local modes
- **AND** any additional provider diagnostic command is documented outside the normal Local mode list
- **AND** `mock`, `mock-api`, and `uat-connected` are not counted as additional Product Environments.

#### Scenario: Active production-facing plans are evaluated

- **WHEN** another active OpenSpec change describes production provider mutation, production proof, production checkout, or production launch readiness
- **THEN** that change MUST identify whether it owns readiness, one-run provider preparation, launch approval, or runtime enablement
- **AND** it MUST NOT use one control for more than one of those decisions.

#### Scenario: Runtime profile is resolved

- **WHEN** backend requests, scripts, smoke runners, or validation code need environment-derived values
- **THEN** they resolve Product Environment through the single Local/UAT/PRD mapping
- **AND** they pass Product Environment or Product Environment Profile downstream instead of repeating raw alias checks.
