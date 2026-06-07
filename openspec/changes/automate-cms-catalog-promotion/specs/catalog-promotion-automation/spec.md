## ADDED Requirements

### Requirement: Store Item content defines generated Desired Catalog State

The system SHALL derive a Desired Catalog State for current Store Item variants from Astro content plus explicit generated policy.

#### Scenario: Maintainer publishes a release or distro item in Decap

- **GIVEN** a maintainer creates or updates a release or distro item in Decap
- **WHEN** artifact generation runs
- **THEN** artifact generation produces a Desired Catalog State entry with app identity, Product Projection, Desired Price, tax code, availability intent, and target environment metadata
- **AND** the entry is stable enough for repeatable D1, Stripe, Worker, and smoke automation.

#### Scenario: Required Store Item fields are missing

- **GIVEN** a release or distro item is part of the Store Item catalog
- **WHEN** title, format, image, or app identity cannot be resolved
- **THEN** content validation and catalog artifact generation fail before provider mutation
- **AND** the failure identifies the CMS item and missing field without printing provider secrets.

#### Scenario: Production price is inferred only from explicit commerce input

- **GIVEN** a Store Item would target PRD
- **WHEN** Desired Catalog State is generated
- **THEN** the production Desired Price comes from an explicitly approved provider policy
- **AND** it does not fall back to sandbox format defaults unless that policy is explicitly enabled for production.

### Requirement: Generated catalog artifacts are committed by automation

The system MUST keep generated catalog artifacts in the repository and automatically commit them when CMS content changes cause drift.

#### Scenario: Decap commit changes catalog content

- **GIVEN** a Decap-authored commit changes release, distro, artist, or media fields that affect catalog projection
- **WHEN** the catalog artifact workflow runs
- **THEN** it runs the artifact generator
- **AND** it creates a bot commit containing only generated catalog artifacts when those artifacts drift.

#### Scenario: Bot artifact commit reruns workflows

- **GIVEN** the artifact workflow creates a bot commit
- **WHEN** CI runs on that bot commit
- **THEN** catalog artifact checks pass without creating another artifact commit
- **AND** provider promotion uses the bot commit rather than the earlier CMS-only commit.

#### Scenario: Generated artifacts cannot be produced

- **GIVEN** content is invalid or incomplete
- **WHEN** artifact generation fails
- **THEN** the promotion stops before D1, Stripe, Worker, or frontend deployment changes
- **AND** the maintainer-facing workflow status explains which content item must be fixed.

### Requirement: UAT and production share one promotion state machine

The system SHALL promote catalog changes through UAT and production using one environment-parameterized state machine.

#### Scenario: Promotion targets UAT and production

- **GIVEN** Desired Catalog State targets UAT-plus-production
- **WHEN** a Promotion Run starts
- **THEN** UAT and production execute the same ordered stages: generate artifacts, run repo gates, verify runtime configuration, prepare D1, dry-run catalog, apply catalog, verify catalog, deploy Worker, deploy or confirm frontend, run smoke, and record evidence
- **AND** environment-specific values are supplied by configuration rather than separate hand-written procedures.

#### Scenario: UAT succeeds and production starts

- **GIVEN** a Promotion Run targets both environments
- **WHEN** UAT provider apply, deployment, and smoke evidence pass
- **THEN** the production run starts from the same committed Desired Catalog State
- **AND** production does not regenerate or reinterpret catalog data from a different commit.

#### Scenario: UAT fails

- **GIVEN** a Promotion Run targets both environments
- **WHEN** UAT artifact, provider, deployment, or smoke validation fails
- **THEN** production promotion is skipped
- **AND** no production D1, Stripe, Worker, or frontend state is mutated by that run.

### Requirement: Production catalog apply is automatic and environment-scoped

The system MUST support automated production catalog apply from Desired Catalog State without requiring normal manual provider dashboard work.

#### Scenario: New production item is promoted

- **GIVEN** a CMS item targets UAT-plus-production and UAT proof has passed for the same Desired Catalog State
- **WHEN** production catalog apply runs
- **THEN** it creates or updates app-owned Stripe Product fields, creates or resolves the active Stripe Price for the Desired Price, updates production D1 mapping and Store Offer snapshot, and records redacted actions
- **AND** the maintainer does not need to manually create Stripe Products, Stripe Prices, D1 rows, or Worker deployment state.

#### Scenario: Production Desired Price changes

- **GIVEN** a production item has an existing active Stripe Price
- **WHEN** Desired Price amount, currency, or price revision changes
- **THEN** production apply creates or resolves a replacement active Stripe Price rather than mutating the historical Price amount
- **AND** D1 mapping and Store Offer snapshot move only after the replacement Price is verified.

#### Scenario: Production apply is rerun

- **GIVEN** a previous production apply attempt partially completed or the workflow was retried
- **WHEN** production apply runs again for the same Desired Catalog State revision
- **THEN** idempotency keys and provider lookup rules prevent duplicate active Products or Prices
- **AND** the final post-apply verification decides success from current provider and D1 state.

#### Scenario: Production apply finds ambiguous provider state

- **GIVEN** more than one active Stripe Price or Product can satisfy the same Store Item variant identity
- **WHEN** production apply runs
- **THEN** it fails without choosing arbitrarily
- **AND** checkout for that variant remains disabled or catalog-drifted until a corrective promotion or operator cleanup resolves ambiguity.

### Requirement: Production provider mutation is narrow and reversible

The system SHALL mutate only app-owned production provider state and SHALL preserve historical payment evidence.

#### Scenario: Stripe object lacks app-owned identity

- **GIVEN** a Stripe Product or Price does not contain the expected BlackBox production metadata or lookup key
- **WHEN** production apply evaluates it
- **THEN** the object is not mutated, archived, reused, or reported as safe to own
- **AND** the Promotion Run fails if no unambiguous app-owned object can be resolved.

#### Scenario: Stale production Price is replaced

- **GIVEN** a replacement active Price has been created and verified for a Store Item variant
- **WHEN** production apply retires the stale app-owned active Price from checkout use
- **THEN** it archives or deactivates only the stale app-owned Price
- **AND** it does not delete the Product, delete the Price, alter paid order history, or erase Promotion Evidence.

#### Scenario: Item is retired from checkout

- **GIVEN** D1/operator state marks a Store Item variant as paused or no longer buyable
- **WHEN** production apply runs
- **THEN** production D1 availability and Store Offer readiness are updated to prevent new checkout
- **AND** historical Stripe objects and existing orders remain intact.

### Requirement: Stock seeding does not override production stock authority

The system MUST distinguish first-publication stock initialization from ongoing production stock authority.

#### Scenario: New production variant has initial stock

- **GIVEN** operator-approved production policy includes first-publication stock initialization
- **WHEN** production D1 readiness runs for a variant with no existing stock row
- **THEN** it creates the initial stock and online stock rows
- **AND** the Promotion Evidence records that stock was initialized from the approved policy.

#### Scenario: Existing production variant has stock

- **GIVEN** a production variant already has D1 stock state
- **WHEN** content or Desired Catalog State changes for product copy, price, or media
- **THEN** production promotion does not overwrite current D1 stock quantities
- **AND** stock changes remain owned by stock operator workflows.

#### Scenario: Production stock is missing

- **GIVEN** Desired Catalog State targets production checkout but no initial stock is supplied and no D1 stock row exists
- **WHEN** production readiness validation runs
- **THEN** the variant remains non-buyable
- **AND** the failure tells the operator that stock must be initialized before checkout can be enabled.

### Requirement: Promotion evidence is redacted and actionable

The system SHALL produce machine-readable Promotion Evidence for every UAT and production Promotion Run.

#### Scenario: Promotion succeeds

- **GIVEN** a Promotion Run completes for an environment
- **WHEN** evidence is recorded
- **THEN** it includes source commit, artifact commit, affected Store Items, Desired Catalog State revisions, D1 readiness summary, provider dry-run/apply summaries, deploy versions, smoke outcomes, and final status
- **AND** it redacts full provider IDs, secrets, account-private values, webhook secrets, and raw payment payloads.

#### Scenario: Promotion fails

- **GIVEN** a Promotion Run fails
- **WHEN** evidence is recorded
- **THEN** it identifies the failed stage, affected Store Item variants, whether any provider or D1 mutation occurred, and the safe rerun or rollback command
- **AND** it does not mark the CMS publish as buyable until verification passes.

#### Scenario: Maintainer checks status

- **GIVEN** a maintainer published editorial content through Decap and does not use CLI tools
- **WHEN** the Promotion Run finishes
- **THEN** GitHub status, action summary, or CMS-adjacent status surfaces show whether UAT and production are buyable, failed, or waiting on content correction.

### Requirement: Reset is excluded from normal promotion

The system MUST NOT use catalog reset as part of ordinary generated artifact publication.

#### Scenario: New item is added

- **GIVEN** a CMS publish adds one new buyable item
- **WHEN** catalog promotion runs
- **THEN** it uses dry-run, apply, verify, deploy, and smoke steps
- **AND** it does not run sandbox reset or any production reset operation.

#### Scenario: Whole sandbox catalog must be recreated

- **GIVEN** an operator intentionally wants to recreate the whole sandbox catalog
- **WHEN** reset tooling is used
- **THEN** it remains a separate explicit sandbox-only operation
- **AND** the production promotion pipeline does not expose or call an equivalent production reset.
