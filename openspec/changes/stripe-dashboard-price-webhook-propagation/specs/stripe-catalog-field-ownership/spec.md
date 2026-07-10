## ADDED Requirements

### Requirement: Price Authority edits happen only through Stripe-owned paths

The system MUST keep buyable amount, currency, active Price identity, lookup key, and Stripe Price active status under Stripe Price Authority.

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

#### Scenario: Generated DesiredPrice exists

- **GIVEN** generated Desired Catalog State contains Desired Price data for environment-scoped promotion
- **WHEN** day-to-day price operations happen in Stripe Dashboard
- **THEN** Desired Price remains promotion input or verification context
- **AND** Worker checkout, Store Offer display, webhook reconciliation, and day-to-day verification continue to use resolved Stripe Price Authority.

#### Scenario: Dashboard price intentionally differs from Desired Price

- **GIVEN** an authorized Stripe Dashboard operator creates a valid replacement Price for a Store Item variant
- **AND** generated Desired Price data still contains the previous amount or currency
- **WHEN** day-to-day webhook reconciliation, Store Offer reads, checkout start, or UAT catalog verification runs
- **THEN** the valid Stripe replacement Price is accepted as Price Authority
- **AND** generated Desired Price drift does not trigger automatic repair back to the old amount unless an explicit promotion/apply mode is selected.

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

- **GIVEN** Decap or repo content changes title, description, image, or format presentation
- **WHEN** Product Projection apply runs
- **THEN** Stripe Product presentation fields may be updated according to Product Projection rules
- **AND** Stripe Price amount and currency are unchanged unless a separate approved Price Authority path creates a replacement Price.

### Requirement: Field ownership diagnostics stay explicit

The system MUST classify Stripe Dashboard price changes separately from repo Product Projection drift and D1 Store Offer snapshot drift.

#### Scenario: Price changed cleanly in Stripe

- **GIVEN** a replacement Price is the only active Price for a variant
- **AND** D1 has not yet been updated
- **WHEN** verification runs
- **THEN** diagnostics identify Store Offer snapshot or mapping drift
- **AND** they do not report the replacement amount as a repo-content violation.

#### Scenario: Dashboard creates wrong-currency Price

- **GIVEN** a Stripe Price uses a currency that violates current Store Item policy or environment expectations
- **WHEN** catalog verification runs
- **THEN** diagnostics classify the issue as Price Authority drift
- **AND** checkout remains unavailable for that variant until a valid active Price exists.

#### Scenario: Diagnostics mention Stripe objects

- **GIVEN** a report references Stripe Product, Price, webhook, or API objects
- **WHEN** output is printed, logged, or written as evidence
- **THEN** object identifiers are redacted
- **AND** secrets, raw webhook payloads, and full provider IDs are not committed.
