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

#### Scenario: Checkout route is named

- **WHEN** specs, code, tests, docs, or UI copy name the shopper checkout document route
- **THEN** they use `/store/checkout/` for checkout review and payment start
- **AND** they use `/store/checkout/return/` for hosted checkout return status
- **AND** they describe `/store/{storeItemSlug}/checkout/` only as an item-scoped compatibility route.

#### Scenario: Store Item projection is named

- **WHEN** specs, code, tests, docs, or UI copy describe a `StoreItem`
- **THEN** they use `storePath` for the item detail route
- **AND** they do not describe `checkoutPath` as a Store Item projection field.

### Requirement: Authority terms

The system MUST preserve the distinction between browser convenience state, Worker authority, Stripe authority, and D1 operational state.

#### Scenario: Cart draft becomes checkout

- **GIVEN** a `StoreCart` contains a `CartDraft`
- **WHEN** checkout starts
- **THEN** the Worker validates every `CartLine`, `CartQuantity`, `StoreOffer`, `OnlineStock`, Stripe Price Mapping, feature gate, and shipping-mode requirement before creating a Stripe Checkout Session.

### Requirement: Workflow terms

The system SHALL treat OpenSpec as the source of truth for current plans, baseline requirements, active changes, validation evidence, deferred gates, and approved refactor portfolios.

#### Scenario: New decision changes domain language

- **GIVEN** a task introduces or changes a domain term
- **WHEN** the term affects specs, tests, route names, UI copy, ADRs, or handoff notes
- **THEN** the relevant OpenSpec baseline spec or active change is updated in the same work.

#### Scenario: Refactor portfolio is named

- **WHEN** specs, tasks, docs, tests, or closeout notes describe grouped simplification work
- **THEN** they use Refactor Portfolio for an approved set of targeted behavior-preserving refactor candidates
- **AND** they do not use Refactor Portfolio for unbounded cleanup, style-only churn, or unrelated rewrites.

### Requirement: Environment terms

The system SHALL use canonical environment terminology across specs, docs, workflows, tests, validation output, handoff notes, and code-facing policy names. Product Environment is the only app-wide environment identity. Product Environment Profile is the typed implementation profile derived from Product Environment; it is not a new environment term.

#### Scenario: Product Environment is named

- **WHEN** a user-facing or maintainer-facing artifact describes where the product runs
- **THEN** it uses Local, UAT, or PRD
- **AND** it does not use `sandbox`, `production`, `test`, `live`, GitHub Actions environment names, or Wrangler environment names as product environment substitutes.

#### Scenario: Platform Environment is named

- **WHEN** an artifact describes a GitHub Actions environment, Wrangler environment, Cloudflare Pages project, Worker runtime target, Stripe mode, or secret store
- **THEN** it labels that concept as a platform/provider/configuration layer
- **AND** it maps the concept back to Local, UAT, or PRD.

#### Scenario: Product Environment Profile is named

- **WHEN** specs, tests, code, validation output, or handoff notes describe environment-derived policy in implementation
- **THEN** they use Product Environment Profile for the typed profile derived from Local, UAT, or PRD
- **AND** they do not introduce separate profile names for email, checkout, provider, or smoke policy unless those names describe fields owned by the Product Environment Profile.

### Requirement: Catalog Promotion terms

The system SHALL use Catalog Promotion language consistently for generated catalog artifacts, provider catalog publication, and runtime/operator controls.

#### Scenario: Promotion artifacts and evidence are discussed

- **GIVEN** current Store Item content is intended to be represented in provider catalog state
- **WHEN** specs, docs, tests, workflows, or code describe the publication path
- **THEN** `DesiredCatalogState` is the generated repo-owned promotion input
- **AND** `DesiredCatalogEntry` describes one buyable variant's desired Product Projection, Desired Price, target environments, availability, and first-publication stock intent
- **AND** `DesiredPrice` means the repo/provider-policy instruction used to provision or replace provider Prices, not checkout runtime authority
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

### Requirement: Smoke terminology

The system SHALL use canonical smoke terms across scripts, workflows, specs, tests, docs, and evidence.

#### Scenario: Smoke terms are named

- **WHEN** an artifact references shared smoke plumbing or evidence
- **THEN** it uses `Smoke Harness` for the shared Playwright, route probing, redaction, secret scanning, and evidence-writing helpers
- **AND** it uses `Smoke Suite` for a domain-owned runner and its named scenarios
- **AND** it uses `Smoke Scenario` for one named check within a suite
- **AND** it uses `Smoke Evidence` for the redacted per-scenario evidence and run summary
- **AND** it uses `Static Smoke` for read-only UAT static or CMS/browser validation that does not create provider state
- **AND** it uses `Provider Smoke` for Stripe- and D1-authoritative hosted-checkout and promotion evidence
- **AND** it uses `Promotion Smoke` for environment-scoped catalog or checkout readiness evidence written by the promotion workflow.

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

### Requirement: Release date research terms are canonical

The system SHALL use consistent terminology for release-date research across specs, tools, tests, reports, docs, and handoff notes.

#### Scenario: Actual Release Date is named

- **WHEN** an artifact describes the date a release or catalog item publicly became released
- **THEN** it uses `Actual Release Date`
- **AND** it does not use that term for upload, preorder, announcement, store availability, repress, or reissue dates unless the evidence basis confirms that date is the intended release event

#### Scenario: Platform Upload Date is named

- **WHEN** an artifact describes a date from a DSP, auto-generated video page, importer timestamp, or platform-specific availability record
- **THEN** it uses `Platform Upload Date`
- **AND** it does not treat that date as an Actual Release Date without independent release evidence

#### Scenario: Release Date Evidence is named

- **WHEN** an artifact describes source URLs, matched metadata, source tier, basis, precision, confidence, and notes used to support a date
- **THEN** it uses `Release Date Evidence`
- **AND** it keeps that evidence separate from public release summary copy and checkout/catalog authority

#### Scenario: Release Date Confidence is named

- **WHEN** an artifact describes whether a date may be applied automatically or needs review
- **THEN** it uses `Release Date Confidence`
- **AND** it distinguishes high-confidence exact dates from weak, partial, upload-only, or conflicting date candidates

