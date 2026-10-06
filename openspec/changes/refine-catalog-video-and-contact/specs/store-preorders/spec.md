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

### Requirement: Prepared desktop films retain source detail

Sidus and Afterwise SHALL use matching locally encoded 1920px-wide silent H.264 backgrounds at desktop widths of at least 1280px, without upscaling the original sources. Each desktop derivative SHALL remain below 4 MiB. Smaller screens SHALL retain the existing backgrounds below 900 kB. Loading and playback SHALL retain the existing motion preferences, data saving, visibility and player coordination.

#### Scenario: Desktop viewport displays a recognized clip

- **WHEN** a desktop visitor displays Sidus or Afterwise with automatic motion permitted
- **THEN** only the active clip's desktop derivative loads and plays
- **AND** the original title, selected excerpt and explicit full-video action remain unchanged.

#### Scenario: Smaller viewport or motion restriction applies

- **WHEN** the viewport is below 1280px or motion/data-saving preferences prohibit playback
- **THEN** the existing small derivative applies or no background is requested, respectively
- **AND** older clip payloads without a desktop URL retain their existing fallback.

### Requirement: International visitors can browse Home preorders

The Home preorder showcase SHALL retain active preorder chapters for visitors outside Greece and reuse the shared international email-order notice. Shopper country SHALL NOT hide the catalog. Checkout and delivery eligibility SHALL remain server-owned.

#### Scenario: A visitor is detected outside Greece

- **WHEN** active Home preorders exist and the shopper country is outside Greece
- **THEN** the same preorder chapters remain visible alongside the email-order notice
- **AND** the visitor can correct the shipping hint to Greece through the existing control.

#### Scenario: Greek or unknown-country visitor browses Home

- **WHEN** the shopper country is Greece or unknown
- **THEN** the active preorder chapters remain visible without an international warning.
