## MODIFIED Requirements

### Requirement: Environment terms

The system SHALL use canonical environment terminology across specs, docs, workflows, tests, validation output, and handoff notes.

#### Scenario: Product Environment is named

- **WHEN** a user-facing or maintainer-facing artifact describes where the product runs
- **THEN** it uses Local, UAT, or PRD
- **AND** it does not use `sandbox`, `production`, `test`, `live`, GitHub Actions environment names, or provider mode names as product environment substitutes.

#### Scenario: Product Environment code value is named

- **WHEN** code, config, tests, or generated evidence name a Product Environment value
- **THEN** it uses `LOCAL`, `UAT`, or `PRD`
- **AND** human-readable prose may use Local, UAT, or PRD as labels.

#### Scenario: Platform Environment is named

- **WHEN** an artifact describes a GitHub Actions environment, Wrangler environment, Cloudflare Pages project, Worker runtime target, Stripe mode, or secret store
- **THEN** it labels that concept as a platform/provider/configuration layer
- **AND** Cloudflare/Wrangler Worker runtime targets use `local`, `uat`, or `prd`.
- **AND** Stripe provider mode may still use test/live terminology where that is the accurate provider concept.

### Requirement: Catalog Promotion terms

The system SHALL use Catalog Promotion language consistently for generated catalog artifacts, provider catalog publication, and runtime/operator controls.

#### Scenario: Promotion artifacts and evidence are discussed

- **GIVEN** current Store Item content is intended to be represented in provider catalog state
- **WHEN** specs, docs, tests, workflows, or code describe the publication path
- **THEN** `DesiredCatalogState` is the generated repo-owned promotion input
- **AND** `DesiredCatalogEntry` describes one buyable variant's desired Product Projection, Desired Price, target environments, availability, and first-publication stock intent
- **AND** Desired Catalog target environments use `uat` and `prd`
- **AND** `DesiredPrice` means the repo/provider-policy instruction used to provision or replace provider Prices, not checkout runtime authority
- **AND** `ProviderCatalogState` means the observed Stripe/D1 state after verification
- **AND** `PromotionRun` means one environment-scoped execution against an artifact commit
- **AND** `PromotionEvidence` means redacted machine-readable proof for success, failure, skipped, superseded, or not-configured outcomes.

#### Scenario: UAT Catalog Alignment is referenced

- **GIVEN** UAT Stripe Products, Stripe Prices, D1 mappings, Store Offer snapshots, stock, and availability are verified together
- **WHEN** specs, code, tests, docs, or diagnostics name that proof
- **THEN** they use `UAT Catalog Alignment`
- **AND** state whether the proof is dry-run, apply, smoke, or provider-live evidence.

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
- **AND** it uses `UAT Provider Smoke` for UAT checkout/provider proof
- **AND** it uses `Promotion Smoke` for environment-scoped catalog or checkout readiness evidence written by the promotion workflow.
