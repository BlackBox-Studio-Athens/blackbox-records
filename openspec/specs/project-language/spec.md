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

#### Scenario: Platform Environment is named

- **WHEN** an artifact describes a GitHub Actions environment, Wrangler environment, Cloudflare Pages project, Worker runtime target, Stripe mode, or secret store
- **THEN** it labels that concept as a platform/provider/configuration layer
- **AND** it maps the concept back to Local, UAT, or PRD.

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

### Requirement: Catalog ownership terms are canonical

The system SHALL use consistent terms for Stripe catalog field ownership across specs, code, tests, docs, validation output, and handoff summaries.

#### Scenario: Catalog Field Ownership is referenced

- **GIVEN** a spec, test, script, or doc describes which system owns a catalog field
- **WHEN** it names that boundary
- **THEN** it uses `Catalog Field Ownership` to mean the declared source of truth and allowed sync direction for a catalog field.

#### Scenario: Product Projection is referenced

- **GIVEN** repo-owned product presentation fields are sent to Stripe Product fields
- **WHEN** specs, code, tests, docs, or diagnostics name that process
- **THEN** they use `Product Projection`
- **AND** do not describe it as bidirectional sync.

#### Scenario: Price Authority is referenced

- **GIVEN** Stripe Price amount, currency, active status, lookup key, or Price identity controls Store Offer price and checkout creation
- **WHEN** specs, code, tests, docs, or diagnostics name that authority
- **THEN** they use `Price Authority`
- **AND** distinguish it from repo-owned Product Projection.

#### Scenario: Sandbox Catalog Alignment is referenced

- **GIVEN** sandbox Stripe Products, Stripe Prices, D1 mappings, Store Offer snapshots, stock, and availability are verified together
- **WHEN** specs, code, tests, docs, or diagnostics name that proof
- **THEN** they use `Sandbox Catalog Alignment`
- **AND** state whether the proof is dry-run, apply, smoke, or provider-live evidence.

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

### Requirement: Cache policy terms

The system SHALL use canonical cache-policy terms across specs, docs, validation output, and implementation notes.

#### Scenario: Static cache behavior is named

- **WHEN** docs or validation describe long-lived caching for content-fingerprinted build files
- **THEN** they use `Static Asset Cache`
- **AND** they do not use that term for Worker API JSON, checkout state, stock state, or Decap/CMS behavior.

#### Scenario: Route document freshness is named

- **WHEN** docs or validation describe HTML route documents, overlay partials, `sitemap.xml`, or `robots.txt`
- **THEN** they use `Document Revalidation`
- **AND** they avoid implying those documents are immutable assets.

#### Scenario: Worker API freshness is named

- **WHEN** docs or validation describe checkout, Store Offer, stock, order, webhook, or provider-mutation API responses
- **THEN** they use `Worker API Freshness`
- **AND** they preserve the distinction from `Authoritative Commerce State`.

#### Scenario: Authority-bearing state is named

- **WHEN** docs, specs, tests, or UI copy describe price, stock, payment, order, checkout eligibility, provider mapping, or feature-gate authority
- **THEN** they use `Authoritative Commerce State`
- **AND** they state that browser, CDN, service-worker, and same-session shell caches do not own that state.

#### Scenario: Shell memory cache is named

- **WHEN** docs or code comments describe the app-shell page snapshot cache or overlay fragment cache
- **THEN** they use `Same-Session Shell Cache`
- **AND** they do not describe it as CDN caching, browser HTTP caching, or Worker caching.
