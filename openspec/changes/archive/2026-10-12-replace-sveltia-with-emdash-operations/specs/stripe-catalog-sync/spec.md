## ADDED Requirements

### Requirement: Runtime catalog owns sellable identities

The backend SHALL resolve Store Item and variant identity, source linkage, publication eligibility, and supported sellable policy from persisted runtime catalog records rather than a catalog compiled into application code.

#### Scenario: Member creates a new item

- **WHEN** its guided setup and publication complete
- **THEN** the already-deployed backend can list and resolve it for checkout
- **AND** no source manifest, generated TypeScript import, backend rebuild, or redeployment is required.

#### Scenario: Item title changes

- **WHEN** editorial presentation changes
- **THEN** stable Store Item and variant identities, provider bindings, and order references remain unchanged.

#### Scenario: Runtime catalog is unavailable

- **WHEN** required catalog state cannot be read or is inconsistent
- **THEN** affected commerce fails closed
- **AND** an old compiled catalog or browser payload does not become authority.

#### Scenario: Runtime catalog migration reruns

- **WHEN** records already exist with matching trusted identities
- **THEN** migration reuses them without changing price, stock, reservations, pauses, or historical orders
- **AND** conflicting or duplicate source/variant identities stop the affected import for review.

## MODIFIED Requirements

### Requirement: Catalog initialization resumes without duplicate objects

New items SHALL use stable Product identities, persisted operation results, and scoped Price inspection in addition to Stripe idempotency keys. Initialization SHALL preserve existing Prices, stock, pauses, reservations, and orders.

#### Scenario: Bootstrap is interrupted

- **WHEN** retry follows Product or Price creation, including beyond provider idempotency retention
- **THEN** it verifies and reuses the prior objects and establishes the intended default without duplicates
- **AND** conflicting or paused existing objects require review.

#### Scenario: PRD has no configured Price

- **WHEN** a member explicitly confirms an authorized PRD Item Setup with a valid reviewed price
- **THEN** only that setup can create its initial Price
- **AND** an import, code deploy, test fixture, or unconfirmed request cannot fabricate live pricing.

### Requirement: Stripe sync preserves fixed and custom price identity

The system SHALL preserve supported fixed EUR and pay-what-you-want EUR Price shapes through setup, price changes, reconciliation, and checkout.

#### Scenario: Price is created or reconciled

- **WHEN** its selected Price has a supported amount shape and matching identity, active state, currency, and approved tax policy
- **THEN** the current Stripe Price is accepted independently of former repository desired-price values
- **AND** invalid or conflicting provider state fails closed.

#### Scenario: New custom price is requested

- **WHEN** an authorized setup uses the supported pay-what-you-want policy
- **THEN** it retains the configured minimum, preset, maximum, and existing checkout restrictions
- **AND** it is not silently converted to a fixed Price.

## REMOVED Requirements

### Requirement: Catalog generation requires canonical app identity

**Reason**: Runtime catalog records and explicit staff setup replace generated inventory/desired-price authority.

**Migration**: Use the old manifest only as reviewed migration input. Reconcile existing identities and supported pricing, then remove it from routine runtime/build/publication paths. Keep uniqueness and duplicate-source validation in runtime setup.

### Requirement: The distro manifest is the sole emitted inventory source

**Reason**: Runtime catalog records and explicit staff setup replace generated inventory/desired-price authority.

**Migration**: Use the old manifest only as reviewed migration input. Reconcile existing identities and supported pricing, then remove it from routine runtime/build/publication paths. Keep uniqueness and duplicate-source validation in runtime setup.

### Requirement: Distro desired prices form a closed EUR policy

**Reason**: Runtime catalog records and explicit staff setup replace generated inventory/desired-price authority.

**Migration**: Use the old manifest only as reviewed migration input. Reconcile existing identities and supported pricing, then remove it from routine runtime/build/publication paths. Keep uniqueness and duplicate-source validation in runtime setup.
