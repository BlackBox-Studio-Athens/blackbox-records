## ADDED Requirements

### Requirement: Dashboard replacement Prices propagate through catalog reconciliation

The system MUST treat a Stripe Dashboard replacement Price as the accepted operator path for changing a Store Item variant's buyable amount or currency.

#### Scenario: Replacement Price becomes active authority

- **GIVEN** a Stripe Dashboard operator creates an active replacement Price for an existing Store Item variant
- **AND** the replacement Price carries the deterministic lookup key or app identity metadata for `storeItemSlug` and `variantId`
- **AND** the previous Price is inactive, archived, or no longer matches the active lookup key
- **WHEN** catalog reconciliation runs for that variant
- **THEN** D1 `VariantStripeMapping` points to the replacement Price
- **AND** D1 `StoreOfferSnapshot` stores the replacement amount, currency, lookup key, active status, and Price identity.

#### Scenario: Replacement Price uses metadata identity

- **GIVEN** a replacement Price does not have the expected lookup key
- **AND** it carries complete app identity metadata for the same Product Environment, Store Item, and variant
- **WHEN** catalog reconciliation runs
- **THEN** the system MAY resolve that Price as the active authority only when it is the only active Product/Price candidate for that variant
- **AND** the reconciliation report includes an action to repair missing or stale metadata/lookup-key alignment when apply mode is allowed.

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
