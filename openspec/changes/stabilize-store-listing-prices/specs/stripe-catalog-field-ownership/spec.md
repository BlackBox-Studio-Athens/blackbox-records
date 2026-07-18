## MODIFIED Requirements

### Requirement: Price Authority edits happen only through Stripe-owned paths

The system MUST keep buyable amount, currency, active Price identity, lookup key, and Stripe Price active status under Stripe Price Authority, while using generated Desired Price only to bootstrap missing Price Authority during first publication or explicit UAT reset.

#### Scenario: Operator changes price in Stripe Dashboard

- **GIVEN** an authorized Stripe Dashboard operator needs to change the buyable amount for a Store Item variant
- **AND** they open the existing Stripe Product that already carries complete app identity for that variant
- **WHEN** they create or activate a replacement Price under that Product and archive the stale active Price
- **THEN** the system treats the replacement Price as the candidate Price Authority
- **AND** the operator does not copy app metadata, lookup keys, Stripe IDs, or D1 IDs into the replacement Price
- **AND** repo content, Decap content, browser state, and static build artifacts remain non-authoritative for the amount and currency.

#### Scenario: Decap content includes an editorial item

- **GIVEN** a Decap editor updates a release or distro entry
- **WHEN** the entry is saved
- **THEN** Decap can change editorial fields such as title, summary, image, group, format, order, and page copy
- **AND** Decap does not expose or commit Stripe Price IDs, buyable amounts, currency, active Price state, D1 identifiers, or provider mutation controls.

#### Scenario: New Store Item has no Price Authority

- **GIVEN** generated Desired Catalog State contains a Desired Price for a new Store Item variant
- **AND** no unambiguous valid active Stripe Price exists for that variant in the target Product Environment
- **WHEN** normal catalog promotion runs with explicit apply
- **THEN** the Desired Price may create the variant's initial Stripe Price and corresponding D1 mapping/snapshot
- **AND** the creation remains idempotent, environment-scoped, and subject to current identity and readiness validation.

#### Scenario: Existing Store Item has valid Price Authority

- **GIVEN** one unambiguous valid active Stripe Price already exists for a Store Item variant
- **AND** generated Desired Price differs or another Store Item is added
- **WHEN** normal catalog promotion or verification runs
- **THEN** the existing Stripe Price remains Price Authority
- **AND** promotion does not archive, create, reactivate, replace, or move lookup identity for that Price because of the Desired Price difference
- **AND** unrelated item publication does not mutate that Price.

#### Scenario: Dashboard price intentionally differs from Desired Price

- **GIVEN** an authorized Stripe Dashboard operator creates a valid replacement Price for a Store Item variant
- **AND** generated Desired Price data still contains the previous amount or currency
- **WHEN** webhook reconciliation, Store Offer reads, checkout start, normal catalog verification, or normal catalog promotion runs
- **THEN** the valid Stripe replacement Price is accepted as Price Authority
- **AND** generated Desired Price drift does not repair the Price back to the previous amount.

#### Scenario: Explicit UAT whole-catalog reset is requested

- **GIVEN** an operator explicitly runs the separate UAT-only whole-catalog reset
- **WHEN** reset leaves a Store Item variant without valid Price Authority and catalog bootstrap runs
- **THEN** generated Desired Price may recreate the missing UAT Price
- **AND** this reset behavior is not available to normal promotion or PRD.
