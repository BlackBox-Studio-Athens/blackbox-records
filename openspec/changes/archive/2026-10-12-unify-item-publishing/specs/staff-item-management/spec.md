# Spec Delta

## ADDED Requirements

### Requirement: Item publishing is one action

The item editor SHALL offer one Publish changes action on every item tab. It SHALL count saved editorial changes and the staged price draft, review them together, and publish them in one sequence. Stock operations SHALL remain immediate and SHALL NOT be counted or published by it.

#### Scenario: Member changes the description and the price

- **WHEN** a member edits the description and types a new price on the Price & stock tab
- **THEN** the header shows two changes not live yet and Publish changes stays available on both tabs
- **AND** leaving and returning to the item, on any device, keeps both changes.

#### Scenario: Member publishes an item that is on sale

- **WHEN** the member reviews and confirms Publish changes for an item on sale
- **THEN** the price command runs first, then item publication applies the checkout presentation and publishes the website
- **AND** each step reports its own result, and a failed step can be retried without repeating completed steps.

#### Scenario: Member publishes only a price

- **WHEN** only the price draft differs from the live item
- **THEN** only the price command runs and no website publication is requested.

#### Scenario: Member puts an item on sale for the first time

- **WHEN** a withheld item with a price is reviewed
- **THEN** the review offers an unchecked Put this item on sale in the shop option
- **AND** the item becomes buyable only when the member ticks it and publishes.

## MODIFIED Requirements

### Requirement: Staff changes prices through Stripe authority

An authorized member SHALL change an item's price in the staff workspace through a server-validated operation that selects a replacement Stripe Product default Price. The browser and generic editorial fields SHALL NOT own selling price authority. A typed price SHALL be held as an EmDash price draft until the member confirms it in the item's publish review.

#### Scenario: Member changes a fixed price

- **WHEN** the member submits a valid EUR amount with the current item revision
- **THEN** the backend creates or reuses the intended replacement Price under the bound Product, selects it as default, and reconciles the Store Offer
- **AND** no static build or backend deployment is required
- **AND** prior Prices and historical order totals remain unchanged.

#### Scenario: Member stages a price

- **WHEN** the member types a new price
- **THEN** it is saved as a draft marked not live, with the live price shown beside it
- **AND** shoppers keep the live price until the member publishes.

#### Scenario: Price operation times out

- **WHEN** the response is uncertain or the operation is retried
- **THEN** the persisted operation and current Stripe state determine whether it already completed
- **AND** the retry cannot create duplicate replacement Prices or silently overwrite a newer staff operation.

#### Scenario: Another operator changes the price

- **WHEN** the submitted expected item/default-Price revision no longer matches
- **THEN** the operation reports a conflict and requires a refresh
- **AND** Stripe Dashboard changes remain supported as a deliberate recovery path through existing reconciliation.

#### Scenario: Member edits unsupported money or tax input

- **WHEN** an amount, price kind, currency, or tax configuration violates the approved policy
- **THEN** validation rejects it before a provider write
- **AND** fixed and pay-what-you-want paths retain their existing checkout constraints.
