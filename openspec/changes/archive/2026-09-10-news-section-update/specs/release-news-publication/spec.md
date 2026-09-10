## ADDED Requirements

### Requirement: Label releases receive complete News coverage

The site SHALL provide one News article for Afterwise's _Disintegration_ and one News article for Ouranopithecus' _Anarchotribal_ so the pre-launch site records BlackBox Records' participation in both releases.

#### Scenario: Disintegration retrospective is present

- **WHEN** the News collection is built
- **THEN** it contains a _Disintegration_ article identifying Afterwise, the June 9, 2026 release, and BlackBox Records' label role
- **AND** its body links through a base-safe relative URL to the matching internal Release detail and links to the official Afterwise Bandcamp album page
- **AND** it presents the verified six-track sequence plus useful performer, recording, mixing, mastering, artwork, and label credits
- **AND** it distinguishes Bandcamp-confirmed Digital availability from label-owned Black Vinyl LP and CD formats

#### Scenario: Anarchotribal retrospective is present

- **WHEN** the News collection is built
- **THEN** it contains an _Anarchotribal_ article identifying Ouranopithecus, the June 6, 2026 release, and BlackBox Records' label role
- **AND** its body links through a base-safe relative URL to the matching internal Release detail and links to the official Ouranopithecus Bandcamp album page
- **AND** it presents the verified ten-track sequence plus useful performer, recording, mixing, mastering, production, guest, and artwork credits
- **AND** it distinguishes Bandcamp-confirmed Digital availability from the label-owned Vinyl format

### Requirement: Release news facts preserve evidence boundaries

Release News content SHALL prefer matching official artist or label sources and MUST NOT turn weak, stale, conflicting, or unrelated-label search results into release facts.

#### Scenario: Official Disintegration evidence exists

- **WHEN** the official Afterwise Bandcamp page identifies _Disintegration_ release details
- **THEN** the News and matching Release content use those details and link to that source where editorial links are rendered
- **AND** June 9, 2026 is treated as the Actual Release Date instead of the conflicting September 1 content value

#### Scenario: Official Anarchotribal evidence exists

- **WHEN** the official Ouranopithecus Bandcamp page and verified Tidal album identify _Anarchotribal_ release details
- **THEN** the News and matching Release content use those details and link to the Bandcamp source where editorial links are rendered
- **AND** June 6, 2026 is treated as the Actual Release Date instead of the conflicting December 1 content value
- **AND** it does not use an unrelated Blackbox/Black Box label as evidence

### Requirement: News and Release details share verified facts

The site SHALL present the same verified dates, track counts, formats, performer credits, production credits, artwork credits, and label participation across each News article and its matching Release detail without requiring a new content relation or runtime synchronization layer.

#### Scenario: Shared facts are reviewed

- **WHEN** either release's News article and Release detail are compared
- **THEN** their dates, track counts, artist names, contributor names, credit roles, format claims, and BlackBox Records participation do not conflict
- **AND** the Release `credits` list remains the complete structured credit record
- **AND** the News body may use a shorter narrative credit selection while linking readers to the Release detail
- **AND** the album-level Bandcamp and Tidal values from `7193409a` remain unchanged

### Requirement: News and catalog content form a coherent timeline

The site SHALL align each article's editorial date and tense with the represented event while keeping matching Release and Artist content consistent.

#### Scenario: Pre-launch historical release is backfilled

- **WHEN** the _Disintegration_ article is added after its verified release event
- **THEN** its News publish date is `2026-06-09`
- **AND** the matching Release `release_date` is `2026-06-09`
- **AND** matching Artist copy describes the album in past or present tense rather than as a future summer release

#### Scenario: Anarchotribal historical release is backfilled

- **WHEN** the _Anarchotribal_ article is added after its verified release event
- **THEN** its News publish date is `2026-06-06`
- **AND** the matching Release `release_date` is `2026-06-06`
- **AND** matching Artist copy no longer exposes an upcoming title-TBA placeholder
- **AND** the article describes the album as released

#### Scenario: News listing is ordered for launch

- **WHEN** the existing descending News sort runs with the three release articles
- **THEN** _Disintegration_ appears before _Anarchotribal_
- **AND** _Anarchotribal_ appears before _Caregivers_
- **AND** no future-dated News entry or scheduling code is required

### Requirement: Existing News presentation is reused

The implementation SHALL use the current News collection, routes, cards, detail overlays, metadata, sitemap, and existing release artwork without adding a new schema or presentation layer.

#### Scenario: Release news renders through existing surfaces

- **WHEN** the site builds with both entries
- **THEN** each entry renders on the homepage and `/news/`
- **AND** each entry has a working direct detail route and app-shell overlay route
- **AND** each internal Release link stays within the configured `/blackbox-records/` UAT base or `/` PRD base from both detail surfaces
- **AND** its lead image uses the existing matching release artwork with meaningful alt text
