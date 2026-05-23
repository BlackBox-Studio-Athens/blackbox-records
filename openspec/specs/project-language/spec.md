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

### Requirement: Authority terms

The system MUST preserve the distinction between browser convenience state, Worker authority, Stripe authority, and D1 operational state.

#### Scenario: Cart draft becomes checkout

- **GIVEN** a `StoreCart` contains a `CartDraft`
- **WHEN** checkout starts
- **THEN** the Worker validates every `CartLine`, `CartQuantity`, `StoreOffer`, `OnlineStock`, Stripe Price Mapping, feature gate, and shipping-mode requirement before creating a Stripe Checkout Session.

### Requirement: Workflow terms

The system SHALL treat OpenSpec as the source of truth for current plans, baseline requirements, active changes, validation evidence, and deferred gates.

#### Scenario: New decision changes domain language

- **GIVEN** a task introduces or changes a domain term
- **WHEN** the term affects specs, tests, route names, UI copy, ADRs, or handoff notes
- **THEN** the relevant OpenSpec baseline spec or active change is updated in the same work.
