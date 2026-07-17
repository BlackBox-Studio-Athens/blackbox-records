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

### Requirement: Releases page presents distinct editorial tiers

The system SHALL present the existing featured, selected-upcoming, and remaining-catalog roles on `/releases/` as three visually and semantically distinct tiers in the order `Latest out now`, `Upcoming`, and `Our Releases`.

#### Scenario: All three roles are available

- **GIVEN** the Releases page selection contains a featured release, a selected upcoming release, and remaining catalog entries
- **WHEN** the page renders
- **THEN** the featured release appears in the dominant `Latest out now` Feature Wall
- **AND** the selected upcoming release appears in a separate section headed `Upcoming`
- **AND** every remaining catalog entry appears once under a separate section headed `Our Releases`
- **AND** the visual restructuring does not change which entry owns each role

#### Scenario: Visitor reads the page in source order

- **WHEN** a visitor reads or tabs through the Releases page
- **THEN** the Feature Wall comes before Upcoming
- **AND** Upcoming comes before Our Releases
- **AND** section and release-title headings expose the same hierarchy to assistive technology

#### Scenario: Wide viewport uses the selected asymmetric composition

- **WHEN** all three roles render at a supported wide viewport
- **THEN** the Feature Wall and Upcoming render as sibling regions in one asymmetric row
- **AND** the Feature Wall owns the larger main column while Upcoming owns the smaller right-hand rail
- **AND** Our Releases begins beneath the Feature Wall in the larger main column while Upcoming may continue through the smaller rail

### Requirement: Each release tier keeps role-appropriate emphasis

The system SHALL keep the current Feature Wall as the primary release treatment, present the selected upcoming release as a smaller date-led editorial panel, and present remaining entries as a quiet image-led catalog grid.

#### Scenario: Featured release renders

- **WHEN** the featured release is available
- **THEN** its presentation retains linked artwork, status label, title, artist, semantic date, formats, optional summary, and existing available actions
- **AND** when all three actions are available, their visible order remains Listen, View Release, then the resolved commerce action
- **AND** the actions retain the current outlined rectangular treatment, visible focus, usable target size, and wrapping behavior
- **AND** Listen retains its status indicator and shell-player trigger behavior
- **AND** View Release retains release-detail navigation while the commerce action continues to use the label and destination supplied by the release-commerce owner

#### Scenario: Selected upcoming release renders

- **WHEN** the selected upcoming release is available
- **THEN** its section includes linked artwork, status text, title, artist, semantic release date, optional summary, and optional formats
- **AND** its scale and spacing remain subordinate to the Feature Wall
- **AND** it gains no new Store, checkout, or provider-owned action

#### Scenario: Remaining catalog renders

- **WHEN** one or more remaining catalog entries are available
- **THEN** the `Our Releases` section reuses the existing release-card detail, player-trigger, image, date, title, artist, focus, and overlay behavior
- **AND** it does not add search, filters, pagination, year grouping, a carousel, or placeholder entries

#### Scenario: Release artwork exposes one interaction language

- **WHEN** a pointer or keyboard user interacts with linked artwork in any release tier
- **THEN** the Feature Wall, Upcoming panel, and remaining catalog reuse the same restrained artwork scale and timing
- **AND** the artwork stays clipped to its frame
- **AND** reduced-motion preference removes the artwork transition and transform

#### Scenario: Tier labels and dividers support the hierarchy

- **WHEN** all three tiers render
- **THEN** `Latest out now` and `Upcoming` are more prominent than release metadata while remaining subordinate to release titles
- **AND** `Our Releases` is sized below the page title and proportionately above catalog-card titles
- **AND** adjacent tier regions do not repeat separator rules that read as disconnected boxes

### Requirement: Release tiers omit empty structure and reflow cleanly

The system SHALL omit role sections with no content and SHALL keep the rendered hierarchy usable without two-dimensional scrolling at widths down to 320 CSS pixels.

#### Scenario: Selected upcoming role is empty

- **GIVEN** no selected upcoming release is available
- **WHEN** the Releases page renders
- **THEN** it omits the Upcoming heading and section wrapper
- **AND** the Feature Wall and Our Releases retain their normal order

#### Scenario: Remaining catalog role is empty

- **GIVEN** no remaining catalog entry is available
- **WHEN** the Releases page renders
- **THEN** it omits the Our Releases heading and section wrapper
- **AND** it renders no filler copy or placeholder artwork

#### Scenario: Hierarchy renders at a narrow viewport

- **WHEN** the Releases page renders at 320 CSS pixels wide
- **THEN** the Feature Wall, Upcoming, and Our Releases stack in source order
- **AND** artwork, titles, summaries, metadata, and actions wrap within the viewport without horizontal page scrolling
- **AND** visible focus, text-based status, semantic dates, and usable pointer targets remain available
- **AND** featured artwork remains the only priority image
