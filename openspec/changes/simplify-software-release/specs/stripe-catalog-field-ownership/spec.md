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
