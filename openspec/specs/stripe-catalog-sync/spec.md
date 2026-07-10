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

### Requirement: Dashboard replacement Prices propagate through catalog reconciliation

The system MUST treat a Stripe Dashboard replacement Price as the accepted operator path for changing a Store Item variant's buyable amount or currency.

#### Scenario: Replacement Price becomes active authority

- **GIVEN** a Stripe Dashboard operator creates an active replacement Price for an existing Store Item variant
- **AND** the replacement Price belongs to the existing active Product with complete matching app identity metadata
- **AND** the previous Price is inactive, archived, or no longer matches the active lookup key
- **WHEN** catalog reconciliation runs for that variant
- **THEN** D1 `VariantStripeMapping` points to the replacement Price
- **AND** D1 `StoreOfferSnapshot` stores the replacement amount, currency, lookup key, active status, and Price identity.

#### Scenario: Replacement Price inherits Product identity

- **GIVEN** a replacement Price has no lookup key or Price-level app identity metadata
- **AND** its active parent Product carries complete app identity metadata for the same Product Environment, Store Item, and variant
- **WHEN** catalog reconciliation runs
- **THEN** the system MAY resolve that Price as authority only when it is the sole active Price candidate under that identified Product
- **AND** apply reconciliation repairs the canonical lookup key and Price metadata without operator entry
- **AND** it does not rewrite already-matching Product identity metadata as part of Price-only repair.

#### Scenario: Replacement Price or Product identity conflicts

- **GIVEN** a replacement Price carries a non-empty lookup key or app identity that conflicts with its Product or expected Store Item variant
- **WHEN** catalog reconciliation runs
- **THEN** the system reports Price Authority drift and fails closed
- **AND** it does not overwrite the conflicting identity or make checkout ready.

#### Scenario: Amount or currency changed on old Price is not expected

- **GIVEN** an operator attempts to change a buyable amount or currency by editing repo content or stale generated expected-price data
- **WHEN** catalog reconciliation evaluates the Store Item variant
- **THEN** the system rejects that path as field-ownership drift
- **AND** requires a Stripe replacement Price or approved environment-scoped catalog promotion flow.

### Requirement: Catalog webhooks reconcile current Stripe state

The system SHALL process Stripe Product and Price webhook events as change notifications and reconcile current Stripe catalog state before mutating D1 Store Offer authority.

#### Scenario: Price update event arrives

- **GIVEN** Stripe sends a signed `price.updated` event for a known Store Item variant
- **WHEN** the Worker records the event and identifies the matching Product Environment and variant from metadata or lookup key
- **THEN** the Worker retrieves or lists current Stripe Product/Price candidates through the catalog gateway
- **AND** reconciliation uses the current active Stripe state rather than copying the webhook payload amount directly into D1.

#### Scenario: Price creation event arrives

- **GIVEN** Stripe sends a signed `price.created` event for a replacement Price
- **WHEN** the event identifies a known Store Item variant
- **THEN** the Worker reconciles the variant and updates D1 only if exactly one active Price is authoritative for that variant
- **AND** checkout remains unavailable for the variant when reconciliation reports blocking Price Authority drift.

#### Scenario: Product update event arrives

- **GIVEN** Stripe sends a signed `product.updated` event for a Product carrying app identity metadata
- **WHEN** the Worker identifies affected Store Item variants in the same Product Environment as the Worker
- **THEN** the Worker reconciles matching variants so Product active status, Product Projection drift, and linked Price authority are reflected in D1 and diagnostics.

#### Scenario: Catalog event belongs to another Product Environment

- **GIVEN** Stripe sends a signed Product or Price event whose `appEnv` metadata or environment-scoped lookup key does not match the Worker's Product Environment
- **WHEN** the Worker processes the event
- **THEN** the Worker records or logs an ignored non-retryable outcome
- **AND** it does not mutate D1 mappings, D1 Store Offer snapshots, Stripe state, or checkout readiness for the receiving environment.

#### Scenario: Catalog event identity is malformed

- **GIVEN** Stripe sends a signed Product or Price event with malformed `variantId`, malformed `storeItemSlug`, or incomplete app identity
- **WHEN** the Worker cannot safely identify one local Store Item variant in the same Product Environment
- **THEN** the Worker records or logs an ignored non-retryable outcome with redacted context
- **AND** it does not retry indefinitely or mutate D1.

#### Scenario: Deleted catalog event lacks variant identity

- **GIVEN** Stripe sends a `price.deleted` or `product.deleted` event that does not include Store Item identity metadata
- **WHEN** the Worker cannot identify a variant from the event payload
- **THEN** the Worker records or logs the ignored catalog event without mutating D1
- **AND** scheduled or manual catalog verification remains responsible for detecting any resulting drift.

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

### Requirement: Ambiguous Price Authority fails closed

The system MUST refuse to choose a buyable Price when Stripe Dashboard state has ambiguous active Prices for one Store Item variant.

#### Scenario: Two active Prices match one variant

- **GIVEN** two or more active Stripe Prices match the same Product Environment, `storeItemSlug`, and `variantId`
- **WHEN** catalog reconciliation runs from webhook, Store Offer read, checkout start, scheduled verification, or manual verification
- **THEN** the result reports `ambiguous_active_price`
- **AND** no D1 Store Offer snapshot is promoted as checkout-ready for that variant.

#### Scenario: Active Price has wrong identity

- **GIVEN** an active Stripe Price is linked to a Product but its metadata or lookup key identifies a different Store Item variant
- **WHEN** catalog reconciliation evaluates the local D1 mapping
- **THEN** the result reports Price Authority drift
- **AND** checkout remains disabled for the affected variant until a matching active Price exists.

### Requirement: Store Offer snapshots recover from missed webhooks

The system SHALL keep Store Offer reads, checkout start, scheduled verification, and manual catalog verification as backstops when webhook propagation is delayed or missed.

#### Scenario: Webhook was missed

- **GIVEN** Stripe Price state changed but D1 `StoreOfferSnapshot` still contains the old Price
- **WHEN** a shopper-facing Store Offer read runs
- **THEN** the Worker reconciles current Stripe state before returning price/readiness
- **AND** the response returns the current replacement Price or a fail-closed catalog-drift state.

#### Scenario: Manual verification runs after price change

- **GIVEN** an operator changes a Price in Stripe Dashboard
- **WHEN** `pnpm stripe:catalog:verify --env uat` runs
- **THEN** the report classifies Product Projection, Price Authority, D1 mapping, and Store Offer snapshot status for the changed variant
- **AND** it does not print Stripe secrets or full account-private object IDs.

#### Scenario: Scheduled verification catches stale state

- **GIVEN** webhook delivery failed for a Stripe Dashboard price change
- **WHEN** scheduled catalog verification runs in the configured Product Environment
- **THEN** it detects stale or mismatched Store Offer snapshot state
- **AND** applies or reports recovery according to that environment's mutation policy.
