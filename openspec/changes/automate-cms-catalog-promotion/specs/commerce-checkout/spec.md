## ADDED Requirements

### Requirement: Promoted catalog items use provider-confirmed Store Offers

The system MUST expose CMS-promoted buyable items to shoppers only after Worker, D1, and Stripe authority agree for the target environment.

#### Scenario: Production item has been promoted

- **GIVEN** Desired Catalog State for a Store Item variant has completed production catalog apply
- **WHEN** a shopper views the Store Offer or starts checkout
- **THEN** the Worker reads production D1 mapping, availability, OnlineStock, Store Offer snapshot, and Stripe Price authority before returning checkout-ready state
- **AND** the browser receives no Stripe Price IDs, D1 identifiers, provider secrets, or unverified static prices.

#### Scenario: Promotion has not completed

- **GIVEN** content exists for a Store Item variant but UAT or production promotion has failed or not yet run
- **WHEN** the shopper requests checkout readiness for that variant in the affected environment
- **THEN** the Worker returns a non-buyable or catalog-drift Store Offer state
- **AND** checkout start is rejected before creating a Stripe Checkout Session.

#### Scenario: Provider state drifts after promotion

- **GIVEN** a promoted production item later has ambiguous, inactive, missing, or mismatched Stripe Price state
- **WHEN** Store Offer read or checkout start reconciles the catalog
- **THEN** the Worker fails closed for that variant
- **AND** the failure is reported as catalog drift rather than falling back to static Desired Price.

### Requirement: Desired Price provisions Stripe Price but does not bypass checkout authority

The system SHALL use Desired Price to provision provider catalog state while preserving Stripe active Price as the runtime payment authority.

#### Scenario: Desired Price matches active Stripe Price

- **GIVEN** Desired Catalog State includes a price amount and currency for a promoted variant
- **WHEN** production apply resolves an active Stripe Price with the same app identity and Desired Price
- **THEN** D1 mapping and Store Offer snapshot point to that Stripe Price
- **AND** checkout uses the Stripe Price resolved from D1/Stripe authority.

#### Scenario: Desired Price differs from active Stripe Price

- **GIVEN** Desired Catalog State changes amount or currency for a promoted variant
- **WHEN** production apply runs
- **THEN** a replacement Stripe Price is created or resolved according to provider rules
- **AND** checkout does not use the new amount until provider state and D1 mapping are verified.

#### Scenario: Browser submits stale cart state

- **GIVEN** a shopper has old StoreCart convenience state for a variant whose Desired Price changed
- **WHEN** checkout starts after promotion
- **THEN** the Worker revalidates current Store Offer and Stripe Price authority
- **AND** ignores any stale browser-stored amount, label, or readiness state.

### Requirement: Production promotion supports retire and pause states

The system SHALL allow D1/operator controls or corrective promotion to disable checkout for a Store Item variant without deleting public editorial content or historical payment records.

#### Scenario: Operator pauses an item from checkout

- **GIVEN** a content item remains editorially visible but D1/operator state pauses checkout
- **WHEN** production promotion runs
- **THEN** D1 availability and Store Offer readiness prevent new checkout for the variant
- **AND** existing orders, stock ledger records, Stripe Products, and historical Prices remain preserved.

#### Scenario: Emergency pause is needed after promotion

- **GIVEN** a production promotion created incorrect checkout readiness
- **WHEN** a pause or corrective promotion is applied
- **THEN** the Worker stops creating new Checkout Sessions for affected variants
- **AND** paid order reconciliation remains available for already-created sessions and completed orders.
