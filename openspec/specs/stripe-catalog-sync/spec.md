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
