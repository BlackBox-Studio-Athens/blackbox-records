# stripe-catalog-field-ownership Specification

## Purpose

Define editorial, runtime, provider, and operational catalog ownership so publication and recovery cannot overwrite selling prices or commerce history.

## Requirements

### Requirement: CMS product projection updates Stripe Products

The system SHALL derive provider presentation from the CMS-owned content snapshot and apply it only through a bounded backend Product Projection command.

#### Scenario: Item presentation is prepared

- **WHEN** a new item is set up or changed checkout presentation is explicitly applied
- **THEN** only the selected item's validated title, description, safe public image, and app identity are projected
- **AND** no unrelated catalog item, existing Price, inventory, or order changes.

#### Scenario: Editorial text is published without provider synchronization

- **WHEN** ordinary post/page publication or an item change outside checkout presentation updates public pages
- **THEN** it does not require a Stripe write
- **AND** it does not synchronize unrelated provider catalog objects.

#### Scenario: Member publishes changed item presentation

- **WHEN** the guided item publication includes changed checkout title, description, or approved artwork
- **THEN** the same operation applies only that item's Product Projection before requesting static publication
- **AND** existing Price Authority is unchanged and a failed projection is safely resumable without another setup or opening-stock entry.

#### Scenario: Provider image is unsafe

- **WHEN** an image is private, draft-only, invalid, or from an unapproved origin
- **THEN** it is not sent as a public Stripe image and an actionable projection error is reported.

### Requirement: Editorial and provider edits do not form sync loops

The system MUST prevent Stripe Dashboard edits and CMS editorial content edits from forming bidirectional sync loops.

#### Scenario: Dashboard edits a CMS-owned Product field

- **GIVEN** a Stripe Dashboard user changes a Product field that is owned by the CMS projection
- **WHEN** catalog verification runs
- **THEN** the system reports the Product field as drift from CMS projection
- **AND** does not import the Dashboard value into CMS editorial content.

#### Scenario: CMS edits a Stripe-owned Price field

- **GIVEN** CMS editorial content or catalog projection attempts to change the buyable amount or currency for an existing Stripe Price
- **WHEN** catalog verification or apply planning runs
- **THEN** the system rejects that as a field-ownership violation
- **AND** requires a replacement Stripe Price alignment path instead.

### Requirement: CMS Product Projection stays separate from Price Authority

The system SHALL keep CMS-owned Product Projection updates and Stripe-owned Price Authority updates separate during Dashboard price changes.

#### Scenario: Dashboard user changes only Price

- **GIVEN** a Stripe Dashboard user creates a replacement Price for a Store Item variant
- **WHEN** catalog reconciliation runs
- **THEN** the system updates D1 mapping and Store Offer snapshot for Price Authority
- **AND** it does not import Stripe Dashboard Product name, description, image, or tax-code edits back into CMS editorial content.

#### Scenario: Dashboard user edits CMS-owned Product field

- **GIVEN** a Stripe Dashboard user changes a CMS-owned Product name, description, image, or application-owned metadata field
- **WHEN** catalog verification runs
- **THEN** the system reports Product Projection drift
- **AND** it does not overwrite CMS-authored Product Projection data from Stripe Dashboard state.

#### Scenario: CMS content changes product presentation

- **GIVEN** CMS editorial content changes title, description, image, or format presentation
- **WHEN** Product Projection apply runs
- **THEN** Stripe Product presentation fields may be updated according to Product Projection rules
- **AND** Stripe Price amount and currency are unchanged unless a separate approved Price Authority path creates a replacement Price.

### Requirement: Bound Product default is the selling Price Authority

The system MUST use the bound Stripe Product's valid default Price as selling Price Authority. CMS fields, browser state, and database projections SHALL NOT override its amount, currency, active state, or identity.

#### Scenario: Default Price changes

- **WHEN** a staff command or authorized Dashboard action selects a valid replacement default Price
- **THEN** signed webhook or authoritative-read reconciliation updates the D1 mapping and Store Offer without a static deploy
- **AND** older active Prices do not create ambiguity or get archived automatically.

#### Scenario: Editorial presentation changes

- **WHEN** Product Projection applies approved CMS title, description, or artwork
- **THEN** it does not change selling amount, currency, Price kind, or historical order values.

#### Scenario: Product default is invalid

- **WHEN** the bound Product's default is missing, inactive, foreign, or violates approved currency/tax/amount policy
- **THEN** checkout fails closed instead of choosing an arbitrary active Price or inventing a fallback.

### Requirement: Staff and Dashboard commands change Stripe Price Authority

Selling-price changes SHALL use an explicit authorized staff command or deliberate Stripe Dashboard operation. Generic editorial saves and software/content publication SHALL NOT create or replace Price Authority.

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

### Requirement: Unified workspace routes actions to their authority

The unified workspace SHALL expose editorial and commerce actions together while visibly distinguishing their consequences and enforcing their separate backend ownership.

#### Scenario: Member needs price or stock work

- **WHEN** the member opens a Store Item
- **THEN** price changes use the protected price command and stock changes use the existing stock adjustment/count controls
- **AND** the member does not copy Stripe IDs, lookup keys, metadata, or D1 identities between tools.

#### Scenario: Member needs to stop selling

- **WHEN** the member pauses an item or changes online allocation
- **THEN** the operation affects runtime checkout eligibility without requiring editorial deletion.

#### Scenario: Member needs order or fulfillment work

- **WHEN** the member opens Orders
- **THEN** the workspace uses existing Worker-owned paid orders and manual fulfillment
- **AND** CMS records cannot override payment, order totals, provider secrets, or fulfillment authority.

### Requirement: Catalog fields have explicit owners

The system MUST define a field-level ownership contract for catalog fields that cross CMS editorial content, D1, Stripe Products, Stripe Prices, Worker Store Offers, browser state, and order reconciliation.

#### Scenario: Ownership matrix is evaluated

- **GIVEN** a catalog field participates in storefront display, hosted Checkout display, checkout amount, availability, stock, Stripe identity, or paid order state
- **WHEN** catalog verification or tests evaluate the field
- **THEN** the system identifies exactly one source of truth for that field
- **AND** identifies the allowed sync direction for that field.

#### Scenario: Field has no owner

- **GIVEN** a new catalog field is added to the projection or reconciliation path
- **WHEN** no source of truth is declared for that field
- **THEN** tests or catalog verification fail before that field is synced to Stripe, D1, browser state, or committed evidence.

### Requirement: Catalog webhooks are replay-safe

The system SHALL process Stripe catalog webhook events idempotently and reconcile current Stripe state rather than trusting event ordering.

#### Scenario: Duplicate catalog event arrives

- **GIVEN** Stripe delivers the same catalog event more than once
- **WHEN** the Worker receives the duplicate delivery
- **THEN** processing is deduplicated or safely replayed without duplicating state transitions
- **AND** the endpoint still returns a successful acknowledgement for already-handled events.

#### Scenario: Catalog events arrive out of order

- **GIVEN** Stripe delivers Product and Price events in an order that does not match the latest Stripe object state
- **WHEN** the Worker processes the event
- **THEN** reconciliation resolves current Stripe Product and Price state before updating D1 Store Offer data.

### Requirement: Sandbox catalog alignment covers every checkout-eligible variant

The system MUST verify sandbox catalog alignment for every checkout-eligible Store Item variant, not only a single fixture item.

#### Scenario: UAT catalog verification runs

- **GIVEN** the runtime catalog has current Store Items and UAT D1 has checkout eligibility state
- **WHEN** `pnpm stripe:catalog:verify --env uat` runs
- **THEN** the report covers every checkout-eligible Store Item variant
- **AND** classifies identity, Product projection, Price authority, D1 readiness, and Store Offer snapshot status.

#### Scenario: UAT catalog apply succeeds

- **GIVEN** sandbox Stripe credentials and UAT D1 access are available
- **WHEN** `pnpm stripe:catalog:verify --env uat --apply` runs after a clean dry-run plan is reviewed
- **THEN** sandbox Stripe Products, sandbox Stripe Prices where permitted, D1 mappings, and Store Offer snapshots are aligned for checkout-eligible variants
- **AND** the follow-up dry-run reports no blocking catalog drift.

### Requirement: Stripe native identity fields are owned by the application

The system SHALL identify BlackBox-owned Stripe catalog objects through application-owned Stripe lookup keys and metadata.

#### Scenario: Catalog Product and Price are created

- **GIVEN** catalog apply creates a Stripe Product and Price for a Store Item variant
- **WHEN** the Stripe objects are sent to Stripe
- **THEN** the Price uses the deterministic lookup key `blackbox:{environment}:{storeItemSlug}:{variantId}`
- **AND** Product and Price metadata include `appEnv`, `sourceId`, `sourceKind`, `storeItemSlug`, and `variantId`.

#### Scenario: Product ID strategy is evaluated

- **GIVEN** the implementation considers deterministic Stripe Product IDs
- **WHEN** existing active Products already use Stripe-generated IDs
- **THEN** Product ID is not treated as the sole source of identity
- **AND** any deterministic Product ID adoption is limited to fresh create or full recreate flows with lookup key and metadata still present.

#### Scenario: Dashboard identity edit creates drift

- **GIVEN** a Stripe Dashboard user removes or changes lookup key or app identity metadata on a BlackBox-owned Product or Price
- **WHEN** catalog reconciliation or verification runs
- **THEN** the object is reported as identity drift or ignored as untrusted if ownership cannot be proven
- **AND** the Dashboard value is not imported into repo content or trusted browser state.

### Requirement: Stripe identity is environment-scoped

The system MUST prevent UAT, PRD, and Local catalog identities from being accepted across Product Environments.

#### Scenario: UAT verifier sees sandbox legacy identity

- **GIVEN** Stripe contains an object identified as `blackbox:sandbox:*`
- **WHEN** UAT verification expects `blackbox:uat:*`
- **THEN** the object is reported as legacy or foreign identity
- **AND** it is not accepted as the active UAT Store Offer.

#### Scenario: PRD identity appears in UAT

- **GIVEN** a Stripe object identifies `appEnv=prd` or uses a `blackbox:prd:*` lookup key
- **WHEN** UAT verification or reconciliation inspects it
- **THEN** the object is treated as foreign-environment drift
- **AND** UAT D1 mappings and Store Offer snapshots are not updated from that object.

### Requirement: Field ownership diagnostics stay explicit

The system MUST classify Stripe Dashboard price changes separately from CMS Product Projection drift and D1 Store Offer snapshot drift.

#### Scenario: Price changed cleanly in Stripe

- **GIVEN** a replacement Price is the valid default Price of the bound Product
- **AND** D1 has not yet been updated
- **WHEN** verification runs
- **THEN** diagnostics identify Store Offer snapshot or mapping drift
- **AND** they do not report the replacement amount as an editorial-content violation.

#### Scenario: Dashboard creates wrong-currency Price

- **GIVEN** a Stripe Price uses a currency that violates current Store Item policy or environment expectations
- **WHEN** catalog verification runs
- **THEN** diagnostics classify the issue as Price Authority drift
- **AND** checkout remains unavailable for that variant until its bound Product has a valid default Price.

#### Scenario: Diagnostics mention Stripe objects

- **GIVEN** a report references Stripe Product, Price, webhook, or API objects
- **WHEN** output is printed, logged, or written as evidence
- **THEN** object identifiers are redacted
- **AND** secrets, raw webhook payloads, and full provider IDs are not committed.
