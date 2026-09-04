## MODIFIED Requirements

### Requirement: Price Authority edits happen only through Stripe-owned paths

The system MUST keep buyable amount, currency, active Price identity, lookup key, and Stripe Price active status under Stripe Price Authority, while using generated Desired Price only to bootstrap missing Price Authority during first publication or explicit UAT reset.

#### Scenario: Operator changes price in Stripe Dashboard

- **GIVEN** an authorized Stripe Dashboard operator needs to change the buyable amount for a Store Item variant
- **AND** they open the existing Stripe Product that already carries complete app identity for that variant
- **WHEN** they create or activate a replacement Price under that Product and archive the stale active Price
- **THEN** the system treats the replacement Price as the candidate Price Authority
- **AND** the operator does not copy app metadata, lookup keys, Stripe IDs, or D1 IDs into the replacement Price
- **AND** repository-authored editorial content, browser state, and static build artifacts remain non-authoritative for the amount and currency.

#### Scenario: Decap content includes an editorial item

- **GIVEN** a Sveltia editor updates a release or distro entry
- **WHEN** the entry is saved
- **THEN** Sveltia can change editorial fields such as title, summary, image, group, format, order, and page copy
- **AND** Sveltia does not expose or commit Stripe Price IDs, buyable amounts, currency, active Price state, D1 identifiers, or provider mutation controls.

#### Scenario: Generated DesiredPrice exists

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

### Requirement: Product Projection remains separate from Price Authority

The system SHALL keep repo-owned Product Projection updates and Stripe-owned Price Authority updates separate during Dashboard price changes.

#### Scenario: Dashboard user changes only Price

- **GIVEN** a Stripe Dashboard user creates a replacement Price for a Store Item variant
- **WHEN** catalog reconciliation runs
- **THEN** the system updates D1 mapping and Store Offer snapshot for Price Authority
- **AND** it does not import Stripe Dashboard Product name, description, image, or tax-code edits back into repo content.

#### Scenario: Dashboard user edits repo-owned Product field

- **GIVEN** a Stripe Dashboard user changes a Product name, description, image, or repo-owned metadata field
- **WHEN** catalog verification runs
- **THEN** the system reports Product Projection drift
- **AND** it does not overwrite repo-authored Product Projection data from Stripe Dashboard state.

#### Scenario: Repo content changes product presentation

- **GIVEN** Sveltia-managed or other repo content changes title, description, image, or format presentation
- **WHEN** Product Projection apply runs
- **THEN** Stripe Product presentation fields may be updated according to Product Projection rules
- **AND** Stripe Price amount and currency are unchanged unless a separate approved Price Authority path creates a replacement Price.

### Requirement: Editorial CMS identifies authoritative commerce operations

The system MUST explain inside the Sveltia editor where common non-editorial Store Item operations happen and MUST preserve existing authority boundaries.

#### Scenario: Editor needs to change a Store Item price

- **WHEN** an editor looks for price controls while editing a Release or Distro Store Item
- **THEN** the CMS states that price changes happen in Stripe Dashboard by creating a replacement Price under the existing Product and following existing verification
- **AND** it does not expose or ask the editor to copy Stripe IDs, lookup keys, metadata identities, D1 IDs, amounts, or currency into Sveltia.

#### Scenario: Editor needs to change available stock

- **WHEN** an editor needs to record stock movement or change online quantity
- **THEN** the CMS identifies the protected `/stock/` operations surface as the stock authority
- **AND** it does not represent a Sveltia field, content order, or content deletion as stock state.

#### Scenario: Editor needs to stop an item selling

- **WHEN** an editor needs to stop checkout for an editorially visible Store Item
- **THEN** the CMS directs them to online-stock or commerce-operator checkout controls
- **AND** it states that deleting the Release or Distro content entry is not the supported stop-selling action.

#### Scenario: Editor needs order or fulfillment work

- **WHEN** an editor needs to inspect payment, order, or fulfillment state
- **THEN** the CMS states that Worker/Stripe paid-order state and the existing manual fulfillment process own that work
- **AND** it does not expose order mutation, BOX NOW credentials, voucher state, tracking state, or provider payloads.
