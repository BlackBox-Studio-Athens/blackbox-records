## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Current catalog verification detects owned orphan objects

**Reason**: Unrelated account objects must not veto a release.
**Migration**: Validate only current release bindings; use Stripe Workbench for separate account investigations.

### Requirement: Ambiguous Price Authority fails closed

**Reason**: Native Product default_price explicitly selects authority among multiple active Prices.
**Migration**: Backfill trusted Product bindings and establish defaults without changing amounts; conflicting bindings/defaults still fail closed.

### Requirement: Stripe catalog identity alignment

**Reason**: The approved single-release and Product-default model replaces this promotion-era contract.
**Migration**: Follow the replacement requirements above; preserve prices and operational state.

### Requirement: Current-state reconciliation remains authoritative

**Reason**: The approved single-release and Product-default model replaces this promotion-era contract.
**Migration**: Follow the replacement requirements above; preserve prices and operational state.

### Requirement: Catalog webhooks reconcile current Stripe state

**Reason**: The approved single-release and Product-default model replaces this promotion-era contract.
**Migration**: Follow the replacement requirements above; preserve prices and operational state.

### Requirement: Catalog mutations use deterministic idempotency

**Reason**: The approved single-release and Product-default model replaces this promotion-era contract.
**Migration**: Follow the replacement requirements above; preserve prices and operational state.

### Requirement: Store Offer snapshots recover from missed webhooks

**Reason**: The approved single-release and Product-default model replaces this promotion-era contract.
**Migration**: Follow the replacement requirements above; preserve prices and operational state.

### Requirement: Dashboard replacement Prices propagate through catalog reconciliation

**Reason**: Sole-active-price discovery and lookup-key repair are replaced by Product default_price.
**Migration**: Set the default in Stripe Dashboard; older active Prices may remain.
