## MODIFIED Requirements

### Requirement: Native store projection

The system SHALL render native store pages from repo-owned content and stable Store Item projections, with exactly one canonical Store Item owner for each physical sellable edition.

#### Scenario: Shopper opens a store item

- **GIVEN** a release or distro entry projects into a `StoreItem`
- **WHEN** the shopper opens the item route
- **THEN** the page presents editorial content and option availability through app-owned identifiers and browser-safe data.

#### Scenario: Release and Distro describe one physical edition

- **GIVEN** one explicit Release-to-Distro relation identifies a shared physical sellable edition
- **WHEN** Store Items are projected
- **THEN** the Distro record owns exactly one `storeItemSlug` and current standard `variantId`
- **AND** the Release resolves a commerce link to that same Store Item without projecting another Store Item, availability row, stock bucket, or Store Offer

## ADDED Requirements

### Requirement: Store Offer states are coherent

The system MUST represent public Store Offers as states discriminated by the existing `catalogStatus` so checkout readiness and price cannot contradict that status.

#### Scenario: Store Offer is ready

- **GIVEN** availability, positive OnlineStock, Product Projection, D1 mapping, and Stripe Price are confirmed
- **WHEN** the Worker returns a Store Offer
- **THEN** `catalogStatus` is `ready`
- **AND** availability is `available`, `canCheckout` is `true`, and price is non-null

#### Scenario: Store Offer is sold out

- **GIVEN** the canonical Store Item is valid but operational availability or OnlineStock is not buyable
- **WHEN** the Worker returns a Store Offer
- **THEN** `catalogStatus` is `sold_out`
- **AND** availability is `sold_out`, `canCheckout` is `false`, and price is null

#### Scenario: Store Offer has catalog drift

- **GIVEN** Product Projection, D1 mapping, Stripe Price, or another catalog authority cannot be confirmed
- **WHEN** the Worker returns a Store Offer
- **THEN** `catalogStatus` is `catalog_drift`
- **AND** checkout is unavailable, `canCheckout` is `false`, and price is null
