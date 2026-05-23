## ADDED Requirements

### Requirement: Persistent catalog webhook synchronization

The system SHALL use a persistent Stripe webhook endpoint as the near-real-time trigger for sandbox catalog reconciliation.

#### Scenario: Stripe catalog object changes

- **GIVEN** the sandbox Stripe account emits `product.created`, `product.updated`, `product.deleted`, `price.created`, `price.updated`, or `price.deleted`
- **WHEN** Stripe delivers the event to the deployed sandbox Worker webhook route
- **THEN** the Worker verifies the event signature with the sandbox `STRIPE_WEBHOOK_SECRET`
- **AND** it reconciles the affected Store Item variant with `apply: true` when the event contains a supported app-owned variant identity.

#### Scenario: Persistent endpoint is not configured

- **GIVEN** the persistent sandbox Stripe webhook endpoint is missing, disabled, has missing catalog events, or has an unverified Worker signing secret
- **WHEN** catalog sync readiness is evaluated
- **THEN** the system treats near-real-time catalog sync as not ready
- **AND** it does not treat a currently-running Stripe CLI listener as a substitute.

### Requirement: Catalog sync remains layered

The system MUST keep catalog correctness protected by multiple controls instead of relying only on webhook delivery.

#### Scenario: Store Offer snapshot is stale or missing

- **GIVEN** the shopper or StoreCart reads a Store Offer
- **WHEN** the Worker cannot trust the current Store Offer snapshot
- **THEN** it reconciles the active Stripe Price before showing checkout readiness
- **AND** it returns a browser-safe non-buyable catalog-drift state if reconciliation cannot confirm authority.

#### Scenario: Checkout starts after catalog drift

- **GIVEN** a shopper starts checkout for a Store Item variant
- **WHEN** the Worker resolves the active Stripe Price
- **THEN** checkout creation fails closed if the Stripe Price is missing, inactive, ambiguous, or mismatched against app-owned identifiers.

#### Scenario: Webhook delivery is missed

- **GIVEN** Stripe catalog state changes but no catalog webhook updates the sandbox Store Offer snapshot
- **WHEN** scheduled catalog verification or `pnpm stripe:catalog:verify --env sandbox` runs
- **THEN** catalog drift is detected or reconciled according to the environment's apply policy.
