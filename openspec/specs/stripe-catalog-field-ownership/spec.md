# stripe-catalog-field-ownership Specification

## Purpose

TBD - created by archiving change implement-stripe-catalog-field-ownership. Update Purpose after archive.

## Requirements

### Requirement: Catalog fields have explicit owners

The system MUST define a field-level ownership contract for catalog fields that cross repo content, D1, Stripe Products, Stripe Prices, Worker Store Offers, browser state, and order reconciliation.

#### Scenario: Ownership matrix is evaluated

- **GIVEN** a catalog field participates in storefront display, hosted Checkout display, checkout amount, availability, stock, Stripe identity, or paid order state
- **WHEN** catalog verification or tests evaluate the field
- **THEN** the system identifies exactly one source of truth for that field
- **AND** identifies the allowed sync direction for that field.

#### Scenario: Field has no owner

- **GIVEN** a new catalog field is added to the projection or reconciliation path
- **WHEN** no source of truth is declared for that field
- **THEN** tests or catalog verification fail before that field is synced to Stripe, D1, browser state, or committed evidence.

### Requirement: Repo product projection updates Stripe Products

The system SHALL project repo-owned product presentation fields to Stripe Products for checkout-eligible Store Item variants.

#### Scenario: Product projection is applied to sandbox

- **GIVEN** a checkout-eligible Store Item variant has repo-owned title, description, image, and app identity fields
- **WHEN** sandbox catalog sync runs with explicit apply mode
- **THEN** the matching Stripe Product is updated with allowed repo-owned Product fields
- **AND** the command does not alter Stripe Price amount, currency, active status, or historical Price records from Astro content.

#### Scenario: Product projection drift is detected

- **GIVEN** a Stripe Product name, description, image, or metadata differs from the repo-owned projection
- **WHEN** catalog verification runs without apply mode
- **THEN** the report identifies Product projection drift for the affected Store Item variant
- **AND** no Stripe or D1 state is mutated.

#### Scenario: Product image is not safe for Stripe

- **GIVEN** a Store Item image cannot be converted to a stable absolute public URL
- **WHEN** catalog projection is verified
- **THEN** the system reports an actionable Product projection issue
- **AND** does not write a broken image URL to Stripe.

### Requirement: Stripe Prices remain payment authority

The system MUST treat Stripe Price amount, currency, active status, Price ID, and lookup key as Stripe-owned payment authority.

#### Scenario: Price changes in Stripe

- **GIVEN** an operator creates or activates a replacement Stripe Price that identifies an existing Store Item variant through metadata or lookup key
- **WHEN** catalog reconciliation runs from webhook, Store Offer read, checkout start, scheduled verification, or manual verification
- **THEN** D1 `VariantStripeMapping` and `StoreOfferSnapshot` are updated to the resolved active Stripe Price
- **AND** browser-visible Store Offer price reflects the Stripe Price without requiring an Astro deploy.

#### Scenario: Repo content changes a display field

- **GIVEN** repo-owned Store Item title, description, or image changes
- **WHEN** Product projection apply runs
- **THEN** Stripe Product presentation fields may be updated
- **AND** Stripe Price amount and currency remain unchanged unless a sandbox-only Price alignment operation is explicitly requested and reported.

#### Scenario: Multiple active Prices match one variant

- **GIVEN** more than one active Stripe Price matches a Store Item variant for the selected environment
- **WHEN** catalog reconciliation runs
- **THEN** the system reports catalog drift and refuses to enable checkout for that variant
- **AND** it does not pick one Price arbitrarily.

### Requirement: Sync loops are prohibited

The system MUST prevent Stripe Dashboard edits and repo content edits from forming bidirectional sync loops.

#### Scenario: Dashboard edits a repo-owned Product field

- **GIVEN** a Stripe Dashboard user changes a Product field that is owned by the repo projection
- **WHEN** catalog verification runs
- **THEN** the system reports the Product field as drift from repo projection
- **AND** does not import the Dashboard value into repo content.

#### Scenario: Repo edits a Stripe-owned Price field

- **GIVEN** repo content or catalog projection attempts to change the buyable amount or currency for an existing Stripe Price
- **WHEN** catalog verification or apply planning runs
- **THEN** the system rejects that as a field-ownership violation
- **AND** requires a replacement Stripe Price alignment path instead.

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

- **GIVEN** the repo has current Store Items and UAT D1 has checkout eligibility state
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
