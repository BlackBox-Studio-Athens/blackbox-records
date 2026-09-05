## ADDED Requirements

### Requirement: Public catalog reconciliation is mutation-free

The system MUST verify current Stripe catalog state during public Store Offer reads and checkout starts without mutating Stripe Products, Stripe Prices, D1 mappings, or Store Offer snapshots.

#### Scenario: Shopper reads a Store Offer

- **WHEN** the Worker resolves current checkout readiness and price
- **THEN** it performs catalog reconciliation in read-only mode
- **AND** blocking Product Projection, Price authority, identity, stock, or availability drift still disables checkout.

#### Scenario: Shopper starts checkout

- **WHEN** the Worker revalidates a cart before creating Stripe Checkout
- **THEN** it performs catalog reconciliation in read-only mode
- **AND** explicit promotion or signed catalog webhooks remain responsible for catalog repair.
