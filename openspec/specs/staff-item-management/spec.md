# staff-item-management Specification

## Purpose

Let label members create sellable items and change their prices through one reliable staff workflow while preserving Stripe, inventory, and order authority.

## Requirements

### Requirement: Catalog editing builds on EmDash

The label-focused staff interface SHALL use EmDash APIs for content, private drafts, revision conflicts, references and media, and reuse its Portable Text editor. Existing catalogue entries SHALL expose details, photos, price and stock editing on one page without requiring navigation to Selling or Stock. Commerce and stock authority SHALL remain outside EmDash. Creation SHALL guide Details → Price & starting stock → Review, with private editorial autosave and explicit confirmed selling setup. Editorial-only releases SHALL skip selling setup and retain an independent publication path. Existing deep links SHALL remain usable.

#### Scenario: An occasional member resumes an unfinished release

- **WHEN** a member returns to their saved release draft
- **THEN** incomplete editorial details remain private and editable
- **AND** no price or opening stock is created until the member explicitly confirms setup.

#### Scenario: Update an existing catalogue item

- **WHEN** a member edits an item's images and information
- **THEN** they can change its price and stock on the same page using explicit actions
- **AND** revision conflicts, uncertain outcomes, stock history and entered data retain existing protection.

#### Scenario: Switch editing tasks without losing work

- **WHEN** a member switches between Details & photos and Price & stock
- **THEN** the selected item, ongoing uploads and unsaved inputs remain mounted and intact
- **AND** price and stock are directly available beneath the item header without scrolling through editorial fields.

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

### Requirement: Commerce inputs accept only values the commands accept

Staff commerce inputs SHALL accept only values the commerce commands accept:

- EUR amount inputs SHALL ignore keystrokes that cannot lead to an amount the price commands accept.
- Stock removal SHALL NOT exceed current stock (the existing preview guard blocks submission).
- Online quantity SHALL NOT exceed the counted quantity.
- Notes SHALL NOT exceed 500 characters, and searches SHALL NOT exceed 200 characters.
- A stock change reason SHALL be one of Other stock change, Sold at a show, New delivery, or Gift or promo copy. The protected stock-change API SHALL reject any other reason.
- A restored item-setup draft SHALL restore its physical format only when that format is supported.

#### Scenario: A member types an invalid price

- **WHEN** a member types a letter, a third decimal digit or a second separator into a EUR amount
- **THEN** the input keeps its previous value.

#### Scenario: A client sends an unknown stock reason

- **WHEN** a stock change request uses a reason outside the four staff reasons
- **THEN** the Worker rejects the request before recording a ledger entry.

### Requirement: Live price confirmation states the intended action

Live-price confirmation SHALL use direct action wording while retaining its existing required confirmation and operation scope.

#### Scenario: Fixed price

- **WHEN** initial price setup or a price change requires live confirmation
- **THEN** the checkbox reads Apply this price to the live shop beside the item and proposed price
- **AND** existing checkbox and server confirmation requirements remain effective.

#### Scenario: Pay-what-you-want settings

- **WHEN** that price form requires live confirmation
- **THEN** the checkbox reads Apply these pricing settings to the live shop beside proposed minimum, suggested, and maximum amounts
- **AND** confirmation covers only the price operation, not publication or checkout launch.

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

### Requirement: Existing catalog items support explicit initial pricing

An authorized member SHALL set the first price on an eligible existing withheld variant using its verified EmDash source and reviewed saved revision. Initial pricing SHALL preserve item/source/variant identity, public slug, stock and ledger, reservations, orders, intentional pauses and publication state. It SHALL retain accepted input and recoverable progress before external writes, without invoking new-item creation or opening-stock initialization.

#### Scenario: A stocked imported item receives its first price

- **GIVEN** a retained withheld variant has stock 1 physical / 1 online, a ledger entry and safely absent price authority
- **WHEN** the member confirms valid initial pricing for its saved source and supported physical type
- **THEN** price authority is established on that same variant with inventory/history unchanged
- **AND** it remains withheld until the separate existing activation operation.

#### Scenario: Format or stock has not been recorded

- **WHEN** an otherwise eligible retained item lacks runtime format or a stock record
- **THEN** Distro/Merch uses its validated native group and an unset Release type offers the existing supported physical choices
- **AND** a valid existing type is preserved
- **AND** zero/missing stock does not prevent pricing or cause invented stock.

#### Scenario: Preflight rejects a correctable request

- **WHEN** a new request has invalid money, stale reviewed revisions, incomplete source details or missing required live confirmation
- **THEN** it fails before provider writes or an unresolved operation is created
- **AND** the member can correct and review the input.

#### Scenario: A member resumes interrupted initial pricing

- **WHEN** the initiating authorized member reopens Selling and explicitly resumes its retained operation
- **THEN** the accepted input is available without relying on browser storage
- **AND** recovery reuses the operation's verified Product/Price work, including after provider idempotency retention expires
- **AND** it uses the accepted source revision/presentation even if a newer private draft exists
- **AND** it neither publishes that draft nor creates duplicate provider objects.

#### Scenario: A completed request is repeated

- **WHEN** the same accepted request is repeated after completion, including after later revisions or publication
- **THEN** it returns its completed receipt without repeating provider writes
- **AND** a different actor or payload cannot reuse that operation identity.

#### Scenario: Another request or stock movement overlaps

- **WHEN** initial-price requests compete or stock changes while pricing runs
- **THEN** only one unresolved catalog operation can perform setup
- **AND** the competing request receives a conflict or existing safe status
- **AND** the stock movement is preserved.

### Requirement: Selling explains current readiness and recovery

Selling SHALL show the applicable Set price, Change price or blocked-state action for the selected item. Missing details, unfinished operations and unsafe bindings SHALL have useful guidance. Reading Selling SHALL NOT mutate catalog, provider, inventory or publication state.

#### Scenario: Content has no linked shop item

- **WHEN** a fresh selected-record read confirms the content is unlinked
- **THEN** Selling offers the existing guided setup
- **AND** the existing server guard prevents duplicate setup.

#### Scenario: A retained item is eligible for its first price

- **WHEN** Selling finishes loading
- **THEN** it displays No price set, a blank amount and Set price
- **AND** missing setup is not represented only by a generic administrator error.

#### Scenario: A configured item has an incomplete private draft

- **WHEN** current price authority is valid but unrelated private editorial work is incomplete
- **THEN** Change price remains usable
- **AND** the draft does not replace current provider presentation.

#### Scenario: Details or provider evidence block setup

- **WHEN** required details are missing or a bound provider identity is missing, invalid, foreign or ambiguous
- **THEN** Selling offers the applicable Details or administrator-review guidance
- **AND** it does not infer safe setup from an empty/failed price read or automatically repair legacy bindings.

#### Scenario: Another kind of catalog operation is pending

- **WHEN** new-item setup, replacement pricing or publication is unfinished
- **THEN** Selling retains that operation's existing recovery behavior
- **AND** it does not send it through initial pricing or claim server-restored input that the older operation does not retain.

#### Scenario: Access or provider service fails

- **WHEN** authorization, configuration or provider availability prevents loading
- **THEN** Selling shows the existing safe sign-in, retry or administrator guidance
- **AND** it does not authorize price creation.

### Requirement: The stock-to-selling journey preserves current state and member input

The selected stock record SHALL provide a direct same-item Selling handoff. Selling SHALL load on entry or explicit refresh and refresh the affected summary/publication prerequisites after confirmed completion. While editing, it SHALL preserve entered money and the reviewed baseline until submission or deliberate reset. Existing editorial unsaved-change behavior SHALL be preserved. Submitted operations SHALL remain recoverable; this change does not require unsent price drafts to persist across navigation or reloads.

#### Scenario: Member continues from recorded stock

- **WHEN** a confirmed stock operation is followed by the Selling action
- **THEN** the correct existing item opens without a new search or new-item form
- **AND** returning to Stock shows current quantities.

#### Scenario: Initial pricing completes

- **WHEN** the server confirms completion
- **THEN** Selling shows the confirmed price and refreshes the affected summary/publication prerequisites
- **AND** it does not publish or activate the item
- **AND** incomplete setup shows a prerequisite instead of an unrelated publication failure.

#### Scenario: A price conflict or explicit refresh occurs while editing

- **WHEN** submission finds a changed revision
- **THEN** the entered amount remains visible with conflict guidance and an explicit Refresh/review action
- **AND** the form does not silently adopt a newer revision
- **AND** a refresh that discards unsaved values requires confirmation.

#### Scenario: A late read or failed refresh follows navigation or success

- **WHEN** a read completes for a previously selected item or fails after a confirmed mutation
- **THEN** it cannot overwrite the current item or imply the mutation failed
- **AND** a failed post-success read offers Refresh rather than another save.

#### Scenario: Member uses a narrow screen or keyboard

- **WHEN** Selling is used at 320 CSS pixels or entirely with a keyboard
- **THEN** inputs and actions remain usable with labels, error associations, visible focus and announced feedback
- **AND** existing 44-pixel primary touch targets are preserved.
