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

- **GIVEN** the D1 Store Offer snapshot is missing or stale
- **WHEN** the storefront asks the Worker for a buyable Store Offer
- **THEN** the Worker reconciles the active Stripe Price before returning browser-safe price and checkout readiness
- **AND** returns a non-buyable catalog-drift state if reconciliation cannot confirm the Stripe-backed offer.

#### Scenario: Store Offer cannot be confirmed

- **GIVEN** the Worker cannot verify a current Stripe-backed Store Offer for a buyable variant
- **WHEN** the storefront renders or checkout start is requested
- **THEN** checkout is disabled or rejected with an actionable catalog-drift error
- **AND** the storefront does not present an Astro fixture price as authoritative.

### Requirement: Stripe catalog identity alignment

The system SHALL align each buyable Store Item variant with a Stripe Product and active Stripe Price through app-owned identifiers.

#### Scenario: Buyable variant is verified against Stripe

- **GIVEN** a Store Item variant is buyable
- **WHEN** catalog verification runs for the selected environment
- **THEN** Stripe has an active Product/Price pair whose metadata or lookup key identifies the same `storeItemSlug` and `variantId`
- **AND** D1 `VariantStripeMapping` points to that Price.

#### Scenario: Mapping points at the wrong Stripe Price

- **GIVEN** D1 maps a `variantId` to a Stripe Price
- **WHEN** that Price metadata, lookup key, amount, currency, or active status does not match the Store Offer contract
- **THEN** catalog verification fails and reports the variant without printing secrets.

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

The system MUST reconcile Stripe Product and Price changes made outside the repo without requiring Astro content edits or a static-site deployment.

#### Scenario: Stripe catalog webhook event is received

- **GIVEN** Stripe sends a Product or Price catalog event for the configured environment
- **WHEN** the event identifies a known `storeItemSlug` and `variantId` through metadata or lookup key
- **THEN** the Worker reconciles the related D1 mapping and browser-safe Store Offer snapshot.

#### Scenario: Stripe catalog webhook event is missed

- **GIVEN** Stripe catalog state has changed since the last D1 snapshot
- **WHEN** scheduled catalog verification runs
- **THEN** the Worker detects and reports drift for the affected Store Item variants without creating or reactivating Stripe catalog objects.

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

### Requirement: Current catalog verification detects owned orphan objects

The system MUST detect active BlackBox-owned Stripe catalog objects that are not part of the current expected Store Item catalog for the selected Product Environment.

#### Scenario: Active owned Price is not expected

- **GIVEN** a Stripe Price is active and identifies BlackBox ownership through lookup key or metadata
- **WHEN** catalog verification runs for a Product Environment
- **THEN** the Price is reported as drift if its `storeItemSlug`, `variantId`, or Product Environment is not in the current expected catalog
- **AND** checkout is not enabled from that unexpected Price.

#### Scenario: Legacy sandbox identity is still present

- **GIVEN** Stripe contains an active object with legacy `blackbox:sandbox:*` identity or documented legacy UAT naming
- **WHEN** UAT catalog verification runs
- **THEN** the object is reported separately from current `blackbox:uat:*` catalog entries
- **AND** the cleanup action is explicit and redacted.

#### Scenario: Cleanup apply is requested

- **GIVEN** owned orphan drift has been reviewed in dry-run output
- **WHEN** an explicit cleanup apply command runs
- **THEN** it mutates only confirmed BlackBox-owned objects for the selected Product Environment
- **AND** it refuses to mutate objects whose ownership or Product Environment cannot be classified.

### Requirement: Current-state reconciliation remains authoritative

The system MUST use current Stripe Product and Price state for catalog authority rather than stale local report data, Stripe search snapshots, or webhook payload snapshots.

#### Scenario: Catalog reconciliation resolves a Store Item variant

- **GIVEN** the Worker or catalog verifier needs the current Price for a Store Item variant
- **WHEN** reconciliation runs
- **THEN** it resolves candidates through current Stripe list or retrieve operations by lookup key, metadata, and existing D1 mapping
- **AND** it does not treat Stripe Search results as the only source of checkout authority.

#### Scenario: Stripe Search is used

- **GIVEN** an operator or script uses Stripe Search for catalog diagnostics
- **WHEN** results are inspected
- **THEN** the results are used for drift discovery, backfill, or duplicate investigation
- **AND** checkout readiness still depends on the reconciler's current-state validation.

### Requirement: Catalog mutations use deterministic idempotency

The system MUST use deterministic Stripe idempotency keys for mutating Product and Price API requests issued by catalog verification, catalog apply, and catalog cleanup flows.

#### Scenario: Logical catalog mutation is retried

- **GIVEN** a catalog mutation request fails after being sent to Stripe
- **WHEN** the same logical mutation is retried with the same amount, currency, Product Projection, repair target, and action identity
- **THEN** the Stripe idempotency key is the same
- **AND** retrying cannot create an additional Product or Price for that logical mutation.

#### Scenario: Intended mutation input changes

- **GIVEN** the target amount, currency, Product Projection, repair target, or mutation purpose changes
- **WHEN** the catalog mutation is prepared again
- **THEN** the Stripe idempotency key identity changes
- **AND** Stripe does not treat the changed operation as a retry of the previous request.

#### Scenario: Idempotency key is built

- **GIVEN** catalog code prepares a Stripe mutating API request
- **WHEN** the idempotency key is built
- **THEN** the key is bounded to Stripe's accepted key length
- **AND** the identity includes a stable request-shape fingerprint for the Stripe write parameters that define that logical mutation.

#### Scenario: Stripe response is replayed

- **GIVEN** Stripe reports that a response was served from a prior idempotent request
- **WHEN** local evidence or diagnostics are recorded
- **THEN** the report captures safe request correlation such as request ID, action kind, replay status, Product Environment, and variant identity when available
- **AND** it does not use replay status as proof that the resulting catalog state is still current.

#### Scenario: Scheduled verification runs

- **GIVEN** scheduled catalog verification runs for UAT
- **WHEN** drift is detected
- **THEN** scheduled verification reports drift without relying on idempotency keys to prevent provider mutation
- **AND** no Stripe Product or Price is created, reactivated, or archived by the scheduled job.

#### Scenario: Independent apply runs overlap

- **GIVEN** two independent catalog apply or cleanup runs are started
- **WHEN** they target the same Product Environment
- **THEN** orchestration uses run identity, dry-run review, and workflow or operator concurrency controls
- **AND** Stripe idempotency keys are not treated as a distributed lock for independent runs.

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
