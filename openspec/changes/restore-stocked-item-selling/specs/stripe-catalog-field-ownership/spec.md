# Spec Delta

## MODIFIED Requirements

### Requirement: Staff and Dashboard commands change Stripe Price Authority

Selling-price changes SHALL use an explicit authorized staff command or deliberate Stripe Dashboard operation. Generic editorial saves and software/content publication SHALL NOT create or replace Price Authority. Initial pricing SHALL be available during new-item setup and for an eligible retained withheld variant with safely absent Price Authority. Missing projections, a nullable provider read or recorded stock SHALL NOT alone authorize provider creation or replacement. Existing environment and operation-specific live confirmation controls SHALL apply.

#### Scenario: Member changes price in the workspace

- **WHEN** the member confirms a valid price operation
- **THEN** the backend creates or reuses the intended Price and selects it as the bound Product's default
- **AND** the amount displayed as authoritative comes from Stripe reconciliation, not the form draft.

#### Scenario: Member edits editorial content

- **WHEN** an entry is saved or published
- **THEN** editorial fields can change but price, stock, provider identifiers, checkout gates, and order state cannot be changed through CMS CRUD.

#### Scenario: Existing price differs from migration input

- **WHEN** an import, setup retry, code deploy, or content publication encounters valid current Price Authority
- **THEN** the current Stripe price is preserved
- **AND** stale desired-price inputs cannot restore an older amount.

#### Scenario: Explicit first publication is requested

- **WHEN** Item Setup has no existing trusted Price and the member confirms its reviewed initial price
- **THEN** the setup command can initialize Price Authority once in that Product Environment
- **AND** a live batch migration remains separately confirmed and fixtures remain Local/UAT only.

#### Scenario: A retained variant receives initial pricing

- **WHEN** a member explicitly confirms the exact initial price for an eligible withheld variant
- **THEN** the bounded operation establishes or recovers that variant's environment-owned Product and intended default Price
- **AND** its runtime linkage and verified price projection are recorded without changing inventory, order history, pauses or editorial/publication state
- **AND** the confirmation does not authorize catalog batches, item activation or shopper launch.

#### Scenario: Initial-price preflight finds existing or ambiguous authority

- **WHEN** provider inspection finds an existing valid default, a deleted/inactive/foreign Product, an invalid default, a legacy Price-only binding or a Product not safely attributable to the retained operation
- **THEN** it refuses duplicate creation or implicit Product adoption
- **AND** current valid authority is preserved and the selected item is directed to the existing price-change/reconciliation path or a bounded binding review.
