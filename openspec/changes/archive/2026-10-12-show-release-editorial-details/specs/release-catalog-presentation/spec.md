# Spec Delta

## ADDED Requirements

### Requirement: Release details display saved descriptions and tracks

Release detail views SHALL display populated full descriptions and tracklists for both upcoming and released entries, independently of commerce availability. Full pages, overlays and private previews MUST render equivalent editorial content.

#### Scenario: A release has populated editorial details

- **GIVEN** an upcoming or released entry has a full description and tracklist
- **WHEN** its full detail page, overlay or private preview renders
- **THEN** the description preserves formatting and links, including retained Markdown content
- **AND** tracks retain their authored order, side or disc headings, positions and optional durations
- **AND** sections appear in hero, description, tracklist, singles/clips, credits and navigation order where populated

#### Scenario: A release has no full description or tracks

- **WHEN** a Release detail view renders without a populated full description or tracklist
- **THEN** it omits the corresponding heading and section wrapper
- **AND** an explicitly empty editorial description does not reveal retained Markdown content

#### Scenario: Tracklist format differs from the Store offer

- **GIVEN** a release has an authored tracklist and no matching purchasable format
- **WHEN** its detail view renders
- **THEN** the saved tracklist remains visible using its authored format

#### Scenario: Details render on a narrow viewport

- **WHEN** a release detail view renders at 390 CSS pixels wide
- **THEN** description links and track titles wrap within the viewport
- **AND** headings, ordering and optional durations remain readable without horizontal page scrolling

#### Scenario: An unpublished description or tracklist is previewed

- **WHEN** staff previews draft release details
- **THEN** the private preview shows the selected description and tracks
- **AND** public release details continue to show only accepted content until publication
