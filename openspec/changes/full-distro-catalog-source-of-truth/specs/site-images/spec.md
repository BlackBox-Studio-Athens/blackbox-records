## ADDED Requirements

### Requirement: Distro artwork comes from repo-approved sources

The system SHALL source missing or uncertain distro artwork through repo-approved tooling and evidence.

#### Scenario: Missing distro artwork is needed

- **GIVEN** a Distro Inventory Source row lacks a matching repo-owned image
- **WHEN** later implementation prepares content for that item
- **THEN** it uses `tools/artwork-fetcher` before choosing a fallback asset
- **AND** it records enough source evidence to distinguish verified artwork, known-missing artwork, and fallback artwork.

#### Scenario: Existing image is reused

- **GIVEN** an existing distro content entry clearly matches a Distro Inventory Source row or approved Current-Site Extra
- **WHEN** later implementation reconciles that item
- **THEN** it may reuse the current repo-owned image
- **AND** it must preserve valid alt text and Astro image handling.

#### Scenario: Artwork is known missing

- **GIVEN** `tools/artwork-fetcher` or a human-reviewed override marks an item's artwork as known missing
- **WHEN** later implementation needs the site image
- **THEN** a generic format-appropriate fallback asset is allowed
- **AND** the alt text must not falsely describe the fallback as original cover art.

#### Scenario: Verified prior tool output exists

- **GIVEN** prior `tools/artwork-fetcher` output contains verified artwork for Nausea Bomb or Salto Mortale
- **WHEN** later implementation reconciles those items
- **THEN** the implementation may reuse those verified outputs instead of fetching again.

#### Scenario: Vagina Lips artwork remains missing

- **GIVEN** prior `tools/artwork-fetcher` output marks The Vagina Lips artwork as known missing
- **WHEN** no new verified override is found
- **THEN** implementation may use an existing cassette fallback asset
- **AND** the alt text must identify it as a cassette-format fallback for The Vagina Lips Random Tapes.
