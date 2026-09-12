## MODIFIED Requirements

### Requirement: Product environment mapping

The system SHALL maintain a single mapping from Product Environments to static hosts, Worker runtime targets, D1 data stores, app-owned Stripe target values, Stripe provider modes, secret stores, validation controls, and environment-derived runtime policies.

#### Scenario: UAT mapping is evaluated

- **WHEN** UAT is described or validated
- **THEN** it maps to a dedicated Cloudflare Pages UAT project for static hosting, the `uat` Worker runtime target, UAT D1, app-owned Stripe target `uat`, Stripe test mode, UAT-scoped GitHub Actions credentials, UAT sink-routing policy, and UAT Promotion Evidence.

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

### Requirement: PRD Holding Page is a temporary PRD deployment surface

The system SHALL classify the PRD Holding Page as a temporary public deployment surface within PRD, not as a fourth Product Environment and not as a replacement for UAT or the full PRD readiness site.

#### Scenario: Environment matrix includes the holding state

- **WHEN** environment documentation describes prelaunch public hosting
- **THEN** the PRD Holding Page maps to the `holding` branch of the existing Cloudflare Pages project
- **AND** the dedicated Cloudflare Pages UAT project remains UAT
- **AND** the Pages production `main` deployment remains the full disabled PRD readiness surface.

#### Scenario: Colleagues review the final visible site

- **WHEN** non-technical colleagues need to review design and content before launch
- **THEN** they use the existing UAT review URL
- **AND** the documented visible launch differences are limited to the final hostname, removal of the UAT-only Review Site Marker or another explicitly documented review cue, production-only metadata/configuration, and explicitly gated provider behavior.
