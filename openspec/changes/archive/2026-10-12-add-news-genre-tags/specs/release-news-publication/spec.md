## ADDED Requirements

### Requirement: News cards identify the linked Artist's music

Homepage and News listing cards SHALL display the linked Artist's published genre beside the date and before the title, on mobile and desktop. The tag SHALL be non-interactive, readable, monochrome and able to wrap without horizontal overflow. News without an Artist SHALL retain its existing presentation without a blank tag.

#### Scenario: Visitor encounters release news before the roster

- **WHEN** the visitor reaches News on the homepage or `/news/`
- **THEN** Disintegration shows Post Rock, Anarchotribal shows Experimental Weird Rock, and Caregivers shows Hardcore before their titles
- **AND** the visitor does not need to reach Artists, hover, or open a detail to identify the genre.

#### Scenario: Genre is changed in a private Artist draft

- **WHEN** the linked Artist has unpublished genre changes
- **THEN** public News cards retain the accepted published genre
- **AND** accepting that Artist's updated genre changes the corresponding card tags without editing the News articles.

#### Scenario: General news has no Artist

- **WHEN** an article has no selected Artist
- **THEN** it remains valid and displays its date, title and summary without a genre placeholder.

## MODIFIED Requirements

### Requirement: Existing News presentation is reused

The implementation SHALL use the current News collection, routes, cards, detail overlays, metadata, sitemap, and existing release artwork. Its optional Artist reference SHALL supply genre metadata through the existing card presentation without a separate presentation layer.

#### Scenario: Release news renders through existing surfaces

- **WHEN** the site builds with both entries
- **THEN** each entry renders on the homepage and `/news/`
- **AND** each entry has a working direct detail route and app-shell overlay route
- **AND** each internal Release link stays within the configured `/blackbox-records/` UAT base or `/` PRD base from both detail surfaces
- **AND** its lead image uses the existing matching release artwork with meaningful alt text.
