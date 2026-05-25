## Purpose

Define canonical BlackBox Records commerce and workflow language so specs, code, tests, docs, and UI copy use one vocabulary.

## Requirements

### Requirement: Commerce identity terms

The system SHALL distinguish content identity, shopper-facing sellable identity, backend sellable units, and external payment identifiers.

#### Scenario: Checkout uses app identities

- **GIVEN** a shopper starts checkout
- **WHEN** browser code sends checkout input
- **THEN** the payload uses app-owned identities such as `storeItemSlug`, `variantId`, `CartLine`, and `CartQuantity`
- **AND** it does not include Stripe Price IDs, D1 identifiers, payment state, order state, or backend secrets.

### Requirement: Authority terms

The system MUST preserve the distinction between browser convenience state, Worker authority, Stripe authority, and D1 operational state.

#### Scenario: Cart draft becomes checkout

- **GIVEN** a `StoreCart` contains a `CartDraft`
- **WHEN** checkout starts
- **THEN** the Worker validates every `CartLine`, `CartQuantity`, `StoreOffer`, `OnlineStock`, Stripe Price Mapping, feature gate, and shipping-mode requirement before creating a Stripe Checkout Session.

### Requirement: Workflow terms

The system SHALL treat OpenSpec as the source of truth for current plans, baseline requirements, active changes, validation evidence, and deferred gates.

#### Scenario: New decision changes domain language

- **GIVEN** a task introduces or changes a domain term
- **WHEN** the term affects specs, tests, route names, UI copy, ADRs, or handoff notes
- **THEN** the relevant OpenSpec baseline spec or active change is updated in the same work.

### Requirement: Environment terms

The system SHALL use canonical environment terminology across specs, docs, workflows, tests, validation output, and handoff notes.

#### Scenario: Product Environment is named

- **WHEN** a user-facing or maintainer-facing artifact describes where the product runs
- **THEN** it uses Local, UAT, or PRD
- **AND** it does not use `sandbox`, `production`, `test`, `live`, GitHub Actions environment names, or Wrangler environment names as product environment substitutes.

#### Scenario: Local mode is named

- **WHEN** docs, scripts, or validation output describe normal Local operation
- **THEN** they use `mock` or `uat-connected`
- **AND** they map the mode back to the Local Product Environment.

#### Scenario: PRD readiness is discussed

- **WHEN** docs, workflows, smoke tests, or Promotion Evidence discuss PRD before go-live
- **THEN** they state whether the action is readiness-only, disabled, not configured, or explicitly opened
- **AND** they do not imply that Cloudflare Pages deployment alone makes live commerce buyable.

### Requirement: Catalog Promotion terms

The system SHALL use Catalog Promotion language consistently for CMS-driven provider catalog publication.

#### Scenario: Promotion artifacts and evidence are discussed

- **GIVEN** Decap-authored content is intended to become buyable
- **WHEN** specs, docs, tests, workflows, or code describe the publication path
- **THEN** `DesiredCatalogState` is the generated repo-owned promotion input
- **AND** `DesiredCatalogEntry` describes one buyable variant's desired Product Projection, Desired Price, target environments, availability, smoke-candidate flag, and first-publication stock intent
- **AND** `DesiredPrice` means the CMS/repo instruction used to provision or replace provider Prices, not checkout runtime authority
- **AND** `ProviderCatalogState` means the observed Stripe/D1 state after verification
- **AND** `PromotionRun` means one environment-scoped execution against an artifact commit
- **AND** `PromotionEvidence` means redacted machine-readable proof for success, failure, skipped, superseded, or not-configured outcomes.
