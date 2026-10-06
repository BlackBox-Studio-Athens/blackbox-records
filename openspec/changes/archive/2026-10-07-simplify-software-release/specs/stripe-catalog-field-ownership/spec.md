## MODIFIED Requirements

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
- **THEN** the same operation applies only that item's Product Projection before requesting publication
- **AND** existing Price Authority is unchanged and a failed projection is safely resumable without another setup or opening-stock entry.

#### Scenario: Provider image is unsafe

- **WHEN** an image is private, draft-only, invalid, or from an unapproved origin
- **THEN** it is not sent as a public Stripe image and an actionable projection error is reported.

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
- **THEN** sandbox Stripe Product name, description and images are re-synced from the D1 runtime projection for checkout-eligible variants
- **AND** no Price is created and no D1 mapping or Store Offer snapshot is written, because checkout start repairs those
- **AND** the follow-up dry-run reports no Product projection drift.
