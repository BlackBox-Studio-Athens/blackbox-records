# stripe-catalog-sync Specification

## Purpose

TBD - created by archiving change fix-stripe-checkout-catalog-sync. Update Purpose after archive.

## Requirements

### Requirement: Stripe Prices are the buyable price source of truth

The system MUST NOT use Astro content or browser state as the authority for buyable Store Offer amount, currency, active price identity, or checkout readiness.

#### Scenario: Static storefront renders a buyable item

- **GIVEN** Astro content defines the editorial Store Item route, copy, artwork, and app-owned identifiers
- **WHEN** the storefront needs to show a buyable price or enable checkout
- **THEN** it uses a Worker-owned Store Offer derived from Stripe Price and D1 mapping authority
- **AND** Astro-authored content cannot override that amount or currency.

#### Scenario: Stripe price changes in the Dashboard

- **GIVEN** an operator creates or activates a replacement Stripe Price for a Store Item variant
- **WHEN** the Stripe Product/Price metadata or lookup key still identifies the same `storeItemSlug` and `variantId`
- **THEN** catalog sync updates the browser-safe Store Offer snapshot without requiring an Astro content change
- **AND** checkout start uses the resolved active Stripe Price rather than a stale static price.

#### Scenario: Store Offer snapshot is stale

- **GIVEN** the D1 Store Offer snapshot is missing or its Price identity, amount, currency, or active state differs from current Stripe Price Authority
- **WHEN** the storefront asks the Worker for an authoritative Store Offer or starts checkout
- **THEN** the Worker reconciles the active Stripe Price before returning browser-safe price and checkout readiness
- **AND** returns a non-buyable catalog-drift state if reconciliation cannot confirm the Stripe-backed offer
- **AND** snapshot age alone does not create catalog drift.

#### Scenario: Store Offer cannot be confirmed

- **GIVEN** the Worker cannot verify a current Stripe-backed Store Offer for a buyable variant
- **WHEN** the storefront renders an authoritative Store Offer or checkout start is requested
- **THEN** checkout is disabled or rejected with an actionable catalog-drift error
- **AND** the storefront does not present an Astro fixture price as authoritative.

### Requirement: Stripe catalog drift is fail-closed

The system MUST not create or accept placeholder Stripe Prices for real storefront checkout evidence.

#### Scenario: Storefront item has no matching Stripe catalog entry

- **GIVEN** a Store Item variant is eligible for checkout
- **WHEN** no matching Stripe Product/Price exists for the selected environment
- **THEN** the sync or seed flow fails with an actionable drift report
- **AND** it does not silently create a fallback `€10.00` Price.

### Requirement: Stripe catalog sync is explicit and environment-scoped

The system SHALL make Stripe catalog synchronization dry-run by default and explicit about the target environment.

#### Scenario: Operator runs catalog verification

- **GIVEN** an operator runs the catalog sync command without an apply flag
- **WHEN** Stripe and D1 are inspected
- **THEN** the command reports drift without mutating Stripe Products, Stripe Prices, D1 mappings, stock, or storefront content.

#### Scenario: Operator applies sandbox catalog sync

- **GIVEN** an operator explicitly selects sandbox apply mode
- **WHEN** the command creates or updates Stripe catalog entries or D1 mappings
- **THEN** it writes only environment-scoped sandbox state
- **AND** it keeps Stripe secrets and full account-specific IDs out of committed files.

### Requirement: Stripe catalog reconciliation survives Dashboard changes

The system MUST reconcile Stripe Product and Price changes made outside the repo without requiring Astro content edits, a static-site deployment, or a full-catalog scheduled Worker scan.

#### Scenario: Stripe catalog webhook event is received

- **GIVEN** Stripe sends a Product or Price catalog event for the configured environment
- **WHEN** the event identifies a known `storeItemSlug` and `variantId` through metadata or lookup key
- **THEN** the Worker reconciles only the related D1 mapping and browser-safe Store Offer snapshot
- **AND** unrelated Store Item variants are not reconciled by that event.

#### Scenario: Stripe catalog webhook event is missed

- **GIVEN** Stripe catalog state has changed since the last D1 snapshot
- **WHEN** an authoritative Store Offer read, checkout start, or targeted manual verification runs for the affected Store Item
- **THEN** the Worker or verifier detects current Price Authority and repairs or reports drift for that variant
- **AND** recovery does not require a runtime full-catalog scan.

### Requirement: Stripe catalog forensics are traceable

The system SHALL provide a repeatable Stripe-native forensics path for unexpected Stripe Product and Price creation, update, archive, reactivation, or lookup-key movement.

#### Scenario: Unexpected Stripe catalog object is found

- **GIVEN** a BlackBox-owned Stripe Product or Price appears outside the expected current Store Item catalog
- **WHEN** catalog verification reports the object
- **THEN** the report includes the Product Environment, lookup key when present, app-owned identity metadata when present, action needed, redacted Stripe object IDs, and a timestamp or run identifier suitable for Stripe Workbench investigation
- **AND** the report does not print secrets, raw provider payloads, card data, or full Stripe object IDs.

#### Scenario: Operator investigates a recent catalog mutation

- **GIVEN** an operator needs to identify which actor created or updated a Stripe Product or Price
- **WHEN** the operator follows the documented Stripe Workbench and Events runbook
- **THEN** the runbook directs them to inspect event type, event created time, redacted resource ID, `request.id`, `request.idempotency_key`, source, endpoint, method, status, API key label when visible, and related Worker/catalog run evidence.

#### Scenario: Stripe event is outside native retention

- **GIVEN** the relevant Stripe Event is older than Stripe's native Events API retention window
- **WHEN** forensics are attempted
- **THEN** the system relies on local catalog reports, ignored evidence exports, Worker logs, and D1 state
- **AND** the docs state that Stripe Events may no longer be available for that timestamp.

### Requirement: Catalog reports expose safe mutation correlation

The system SHALL expose safe correlation fields for catalog verification, apply, cleanup, and repair actions.

#### Scenario: Apply report includes Stripe mutation context

- **GIVEN** a catalog apply creates, restores, archives, or updates a Stripe Product or Price
- **WHEN** the apply report is formatted
- **THEN** each mutation action includes Product Environment, `storeItemSlug`, `variantId`, action kind, lookup key, idempotency key or stable idempotency hash, and redacted Stripe object IDs when available.

#### Scenario: Dry-run report has no provider side effects

- **GIVEN** catalog verification runs without apply
- **WHEN** drift would require Product or Price mutation
- **THEN** the report lists planned action kinds and forensics handles
- **AND** no Stripe Product, Stripe Price, D1 mapping, stock, or Store Offer snapshot is mutated.

### Requirement: Product and Price creation shape is explicit

The system MUST make Stripe Product and Price creation shape explicit so catalog repair cannot accidentally create duplicate provider objects.

#### Scenario: Price is created for an existing Product

- **GIVEN** catalog reconciliation has resolved or created the intended Stripe Product
- **WHEN** it creates a Stripe Price for that Product
- **THEN** the Price create request references the existing Product ID
- **AND** it does not send `product_data` unless the flow is explicitly classified as a combined Product/Price create.

#### Scenario: Product creation includes default price data

- **GIVEN** a future flow creates a Stripe Product with `default_price_data`
- **WHEN** the request is prepared
- **THEN** the flow is reported and logged as combined Product/Price creation
- **AND** tests prove it cannot silently bypass normal Price identity, metadata, lookup-key, and idempotency checks.

### Requirement: Catalog webhook handling is replay-safe

The system MUST safely handle duplicate, failed, retried, and out-of-order Stripe catalog webhook deliveries.

#### Scenario: Duplicate catalog event is delivered

- **GIVEN** the Worker has already recorded a Stripe catalog event ID with succeeded processing status
- **WHEN** Stripe retries the same event
- **THEN** the Worker returns a successful acknowledgement
- **AND** it does not run a second D1 mutation for that duplicate event.

#### Scenario: First processing attempt fails after event receipt

- **GIVEN** the Worker records a Stripe catalog event receipt before reconciliation completes
- **WHEN** Stripe or D1 fails before reconciliation is marked succeeded
- **THEN** the event remains retryable through pending or failed processing status, or through an equivalent success-after-work recording strategy
- **AND** a later Stripe retry can run reconciliation instead of being skipped as a completed duplicate.

#### Scenario: Events arrive out of order

- **GIVEN** Stripe delivers `price.created`, `price.updated`, and `product.updated` events in an order that does not match the latest Dashboard state
- **WHEN** each event is processed
- **THEN** reconciliation resolves current Stripe catalog candidates each time
- **AND** the final D1 Store Offer snapshot reflects the latest unambiguous active Price.

#### Scenario: Reconciliation fails transiently

- **GIVEN** a signed catalog event identifies a known variant
- **WHEN** the Worker cannot read Stripe or D1 during reconciliation
- **THEN** the webhook response is retryable rather than falsely acknowledging successful propagation
- **AND** duplicate suppression does not skip the retry unless a prior attempt already succeeded.

### Requirement: Catalog generation requires canonical app identity

The system MUST validate one canonical app-owned source, Store Item slug, and variant identity for every physical sellable edition before provider or operational artifacts are emitted.

#### Scenario: Canonical identity is valid

- **GIVEN** all direct Release and Distro projections resolve to existing sources
- **WHEN** catalog validation runs
- **THEN** every physical sellable edition has one source owner, one unique `storeItemSlug`, and one unique current standard `variantId`
- **AND** Desired Catalog State, Product Projections, availability, and stock artifacts consume that same validated projection

#### Scenario: Catalog identity is ambiguous

- **GIVEN** the projected catalog contains a duplicate source tuple, Store Item slug, variant ID, or cross-source physical duplicate
- **WHEN** catalog generation runs
- **THEN** validation fails with the conflicting app identities
- **AND** no provider, availability, stock, or Store Offer artifact is written

### Requirement: The distro manifest is the sole emitted inventory source

The system SHALL generate current distro catalog entries only from the validated repository-owned Distro Inventory Source manifest.

#### Scenario: Catalog artifacts are generated

- **WHEN** distro Product Projection or Desired Catalog State is built
- **THEN** every emitted item maps to exactly one manifest row
- **AND** Astro content contributes only matched editorial projection data.

#### Scenario: Current content is absent from the manifest

- **WHEN** a distro content entry has no canonical manifest row
- **THEN** it is not emitted into current catalog artifacts or checkout eligibility.

#### Scenario: Approved historical extra is emitted

- **WHEN** Spinners or Wreckquiem is generated
- **THEN** its manifest row remains the authority
- **AND** currentSiteExtra records provenance only.

#### Scenario: Rejected duplicate is evaluated

- **WHEN** the Knot On Knot? source row is read
- **THEN** duplicateOf resolves to the canonical Knot On Knot row
- **AND** no second Store Item is emitted.

### Requirement: Distro desired prices form a closed EUR policy

The system SHALL project each emitted distro row to exactly one valid fixed or pay-what-you-want desired price.

#### Scenario: Numeric source price is projected

- **WHEN** sourcePrice is numeric
- **THEN** the fixed EUR amount equals that value in minor units.

#### Scenario: ΕΣ source price is projected

- **WHEN** sourcePrice is ΕΣ
- **THEN** the custom EUR price uses minimum 100, preset 500, and maximum 10000 minor units.

#### Scenario: Blank source price is projected

- **WHEN** sourcePrice is blank
- **THEN** the closed item-type default is used
- **AND** an unknown item type fails validation.

### Requirement: Stripe sync preserves fixed and custom price identity

The system SHALL map fixed desired prices to Stripe unit_amount and pay-what-you-want desired prices to custom_unit_amount.

#### Scenario: Price is created or reconciled

- **WHEN** catalog sync handles a valid distro desired price
- **THEN** it accepts only the matching price kind, EUR currency, and configured amount shape
- **AND** ambiguous or mismatched provider state fails closed.

### Requirement: Each variant binds one Product and its default Price

Each variant SHALL bind to one Stripe Product in D1. The Product's default Price SHALL select its selling price. Runtime validation SHALL confirm app identity, environment, active state, one-time price type, EUR currency, supported fixed/custom amount, and approved inclusive VAT configuration.

#### Scenario: A Product default changes

- **WHEN** an operator chooses a replacement default Price while older Prices remain active
- **THEN** detail, checkout, and targeted snapshot refresh use the new default Price
- **AND** older Prices do not cause ambiguity or get archived by synchronization.

#### Scenario: Bound identity conflicts

- **WHEN** a bound Product or selected Price identifies another environment or variant
- **THEN** reconciliation fails closed without rewriting that identity.

### Requirement: Runtime price resolution retrieves the bound Product

Runtime reconciliation SHALL retrieve the bound Product and its expanded default Price directly. Account-wide scans SHALL NOT select runtime price authority.

#### Scenario: Default Price is missing

- **WHEN** a bound Product has no valid default Price
- **THEN** the item reports catalog drift rather than selecting another active Price or generating a fallback amount.

### Requirement: Catalog notifications refresh only bound Products

Signed Product and Price events SHALL identify an affected item through its persisted Product binding and reread current provider state. Event metadata, amount, and arrival order SHALL NOT select selling authority.

#### Scenario: Replacement Price has no app metadata

- **WHEN** its signed event references a bound Product
- **THEN** only that item is refreshed from the current default Price.

#### Scenario: An unrelated event arrives

- **WHEN** its Product has no local binding
- **THEN** it is acknowledged without catalog mutation.

### Requirement: Catalog initialization resumes without duplicate objects

New UAT items SHALL use stable Product identities and scoped Price inspection in addition to Stripe idempotency keys. Ordinary synchronization SHALL preserve existing Prices, stock, pauses, reservations, and orders.

#### Scenario: Bootstrap is interrupted

- **WHEN** a retry occurs after Product or Price creation
- **THEN** it reuses those objects and establishes the default without duplicates
- **AND** conflicting or paused existing objects require review.

#### Scenario: PRD has no configured Price

- **WHEN** live preparation is explicitly authorized
- **THEN** missing PRD pricing blocks readiness; test fixtures never create live selling prices.

### Requirement: Authoritative reads refresh listing snapshots

Detail and checkout reads SHALL resolve the current default Price and refresh the corresponding D1 mapping and snapshot without mutating provider presentation or Prices. Targeted manual repair SHALL remain available.

#### Scenario: Webhook is missed

- **WHEN** an authoritative read follows a Dashboard price change
- **THEN** it returns current authority and repairs the listing projection or fails closed.
