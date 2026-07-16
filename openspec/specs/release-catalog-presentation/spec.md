# release-catalog-presentation Specification

## Purpose

TBD - created by archiving change deduplicate-release-page-highlights. Update Purpose after archive.

## Requirements

### Requirement: Releases page assigns exclusive presentation roles

The system SHALL assign each Release entry on `/releases/` to at most one top-level presentation role: featured release, selected upcoming release, or remaining catalog entry.

#### Scenario: Featured and upcoming releases are selected

- **GIVEN** the catalog contains an out-now release, a future release, and other releases
- **WHEN** the Releases page selects the newest out-now release as featured and the nearest future release as upcoming
- **THEN** neither selected release appears again in the remaining catalog grid
- **AND** every other release remains in the grid once and in the existing catalog order

#### Scenario: No upcoming release exists

- **GIVEN** the catalog contains a featured release but no future release
- **WHEN** the Releases page renders
- **THEN** it omits the upcoming presentation
- **AND** it excludes only the featured release from the remaining catalog grid

#### Scenario: No out-now release exists

- **GIVEN** the current fallback selects a future-dated release for the feature position
- **WHEN** another future release is selected for the upcoming position
- **THEN** the two selections remain distinct
- **AND** neither selected release appears in the remaining catalog grid

#### Scenario: No releases remain after selection

- **GIVEN** every available release has been assigned to a highlighted role
- **WHEN** the Releases page renders
- **THEN** it omits the empty remaining-catalog grid section

### Requirement: Selected upcoming release has self-contained artwork and information

The system SHALL present the selected upcoming release with enough existing content to identify and open it without relying on a duplicate catalog card.

#### Scenario: Upcoming release is rendered

- **WHEN** a selected upcoming release is available
- **THEN** the presentation includes linked cover artwork, linked title, artist, and semantic release date
- **AND** the artwork uses Astro image handling with the authored alt text or release title fallback
- **AND** summary and format information renders only when the existing content provides it

#### Scenario: Upcoming artwork loads beside the feature

- **WHEN** the Releases page renders both featured and upcoming artwork
- **THEN** the featured artwork remains the only priority image
- **AND** the upcoming artwork uses responsive card-scale delivery with normal loading priority
