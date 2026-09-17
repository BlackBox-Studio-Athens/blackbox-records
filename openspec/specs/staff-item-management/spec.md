# staff-item-management Specification

## Purpose

Let label members create sellable items and change their prices through one reliable staff workflow while preserving Stripe, inventory, and order authority.

## Requirements

### Requirement: Catalog editing builds on EmDash

The label-focused staff interface SHALL use EmDash APIs for content, private drafts, revision conflicts, references and media, and reuse its Portable Text editor. Catalog details SHALL combine Details, Selling and Stock destinations without moving commerce or stock authority into EmDash. Creation SHALL guide Details → Price & starting stock → Review, with private editorial autosave and explicit confirmed selling setup. Editorial-only releases SHALL skip selling setup and retain an independent publication path.

#### Scenario: An occasional member resumes an unfinished release

- **WHEN** a member returns to their saved release draft
- **THEN** incomplete editorial details remain private and editable
- **AND** no price or opening stock is created until the member explicitly confirms setup.

### Requirement: Member language and input are accessible to nontechnical musicians

The member workspace SHALL use short, familiar English for label members who are non-native English speakers. Normal screens SHALL use item names and action labels rather than backend identifiers, provider terminology, or developer vocabulary. Stock movement SHALL accept a positive quantity with a separate Add or Remove choice. EUR price entry SHALL accept either a comma or a decimal point with at most two decimal places. Feedback SHALL distinguish a confirmed result from an uncertain result and offer a clear next action without asking the member to understand retry identities.

#### Scenario: A member records a show sale

- **WHEN** a member selects Remove stock, enters 2, and saves a show sale
- **THEN** the existing stock command records a decrease of two without requiring negative-number input
- **AND** the screen displays the resulting stock and a short confirmation

#### Scenario: A member changes a price with a decimal comma

- **WHEN** a member enters 27,05 EUR and confirms the price change where required
- **THEN** the command uses exactly 2705 minor units
- **AND** a lost reply offers a safe status check using the same retained command, without claiming that the change failed

### Requirement: Item creation combines editorial and commerce setup

The workspace SHALL provide one guided Item Setup for a label Release, Distro item, or Merch item. It SHALL reuse existing source records when selected and create stable application identities without asking members to copy provider or database identifiers.

#### Scenario: A label Release starts with ten vinyl records

- **WHEN** a member selects New Release, chooses or creates its Artist, enters required copy and artwork, confirms a selling price, and enters opening stock 10
- **THEN** setup creates one editorial Release and one linked Store Item with one default vinyl variant
- **AND** opening physical and online stock are each 10 before reservations or subsequent movements
- **AND** the member can publish the result without a commit, SQL seed, catalog manifest edit, or backend deploy.

#### Scenario: A Distro item starts with ten vinyl records

- **WHEN** a member selects New Distro, enters the required item data, confirms a price, and enters opening stock 10
- **THEN** setup creates one Distro source and one Store Item with one default vinyl variant
- **AND** it does not create a label Release or duplicate an existing selected item
- **AND** opening physical and online stock are each 10 before later activity.

#### Scenario: Sensible defaults are shown

- **WHEN** a member starts setup
- **THEN** EUR and one variant are selected, stock defaults to zero until explicitly entered, and online stock defaults to the entered opening physical quantity
- **AND** required price confirmation has no fabricated fallback amount
- **AND** physical format and supported fixed or pay-what-you-want pricing can be reviewed before submission
- **AND** Merch uses its applicable existing physical-type policy rather than a new commerce category field.

#### Scenario: Content is not intended for sale

- **WHEN** a member creates editorial Release content without enabling its sellable item
- **THEN** ordinary draft/publication remains possible without Stripe objects or opening inventory.

### Requirement: Setup survives retries and partial failure

Item Setup SHALL persist an operation identity, input fingerprint, progress, and resulting application/provider identities. Retries SHALL reuse completed work, including after provider idempotency retention has elapsed, and SHALL never reset existing inventory.

#### Scenario: Connection fails after Product creation

- **WHEN** the same setup is retried
- **THEN** it locates and validates the already-created Product and resumes the remaining work
- **AND** it does not create another Product, Price, source record, variant, or opening StockChange.

#### Scenario: Operation identity is reused with different input

- **WHEN** a member retries a setup identity with a changed price, source, or opening quantity
- **THEN** the request is rejected as a conflict
- **AND** the existing operation remains available for explicit resume or review.

#### Scenario: Existing stock has changed

- **WHEN** a setup retry or editorial republish runs after a stock movement or sale
- **THEN** current physical stock, online stock, reservations, and audit history remain unchanged.

#### Scenario: Setup cannot complete safely

- **WHEN** a provider binding conflicts or an interrupted step cannot be classified
- **THEN** the item stays non-buyable with an actionable needs-attention state
- **AND** recovery does not automatically delete or recreate provider or order history.

### Requirement: Staff changes prices through Stripe authority

An authorized member SHALL change an item's price in the staff workspace through a server-validated operation that selects a replacement Stripe Product default Price. The browser and generic editorial fields SHALL NOT own selling price authority.

#### Scenario: Member changes a fixed price

- **WHEN** the member submits a valid EUR amount with the current item revision
- **THEN** the backend creates or reuses the intended replacement Price under the bound Product, selects it as default, and reconciles the Store Offer
- **AND** no static build or backend deployment is required
- **AND** prior Prices and historical order totals remain unchanged.

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

### Requirement: Stock controls reuse the audited stock workflow

The item workspace SHALL use existing stock adjustments, recounts, online allocation, and concurrency checks instead of treating a CMS number as inventory.

#### Scenario: Member changes stock

- **WHEN** the member records a known movement or recount with its reason and expected revision
- **THEN** the existing stock ledger records the verified actor and resulting quantities
- **AND** available stock continues accounting for active reservations.

#### Scenario: Two members edit the same stock

- **WHEN** the second request uses a stale revision
- **THEN** it receives the existing conflict response without lost updates.

### Requirement: Unified UI does not bypass commerce safety

Staff commands SHALL enforce authorization, input validation, environment isolation, audit attribution, and independent live controls at the backend.

#### Scenario: A generic CMS request includes stock or payment fields

- **WHEN** it attempts to change stock, Stripe bindings, checkout gates, order totals, payment status, or fulfillment state
- **THEN** those writes are rejected rather than passed to commerce persistence.

#### Scenario: Member confirms a PRD price or setup action

- **WHEN** the authorized member confirms the specific PRD operation with its item and intended values
- **THEN** only that bounded operation is authorized
- **AND** it does not authorize bulk catalog migration or enable shopper checkout.

#### Scenario: Orders are managed from the unified workspace

- **WHEN** a member opens order details or manual fulfillment
- **THEN** the existing paid-order, delivery-retry, and manual BOX NOW behavior remains in use
- **AND** the CMS cannot mark an unpaid order as paid.
