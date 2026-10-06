## ADDED Requirements

### Requirement: Afterwise uses the existing film backdrop

The Home preorder showcase SHALL recognize Afterwise's `Cl7rWCTGEqY` clip and provide the existing native film presentation using a small silent asset and a performance poster. Full playback SHALL remain an explicit Watch action.

#### Scenario: Afterwise clip is published

- **WHEN** Disintegration's accepted content includes the recognized clip
- **THEN** its showcase clip retains the published title and full-video ID and receives the matching local film/poster URLs
- **AND** motion preferences, visibility handling and shell audio coordination remain active.

#### Scenario: Clip is unknown or removed

- **WHEN** content contains an unmapped clip or removes the recognized clip
- **THEN** existing fallback behavior applies without stale Afterwise media being assigned to another video.

### Requirement: International visitors can browse Home preorders

The Home preorder showcase SHALL retain active preorder chapters for visitors outside Greece and reuse the shared international email-order notice. Shopper country SHALL NOT hide the catalog. Checkout and delivery eligibility SHALL remain server-owned.

#### Scenario: A visitor is detected outside Greece

- **WHEN** active Home preorders exist and the shopper country is outside Greece
- **THEN** the same preorder chapters remain visible alongside the email-order notice
- **AND** the visitor can correct the shipping hint to Greece through the existing control.

#### Scenario: Greek or unknown-country visitor browses Home

- **WHEN** the shopper country is Greece or unknown
- **THEN** the active preorder chapters remain visible without an international warning.
