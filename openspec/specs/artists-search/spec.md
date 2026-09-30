# artists-search Specification

## Purpose

TBD - created by archiving change gate-artists-search-by-roster-size. Update Purpose after archive.

## Requirements

### Requirement: Artists search follows roster size

The Artists route SHALL derive search availability from the same server-rendered Artist collection used for the roster and SHALL expose search only when that collection contains at least six profiles. The roster preview portal is not a search outlet and SHALL NOT change this gate.

#### Scenario: Roster contains at most five artists

- **WHEN** the Artists collection contains zero through five profiles
- **THEN** the route emits no Artists search outlet
- **AND** no reserved search space, search portal, or filter mount exists
- **AND** every roster row remains server-rendered and visible

#### Scenario: Roster contains at least six artists

- **WHEN** the Artists collection contains six or more profiles
- **THEN** the route emits the existing Artists search outlet
- **AND** direct and shell-managed navigation retain the existing search behavior

### Requirement: Artists search filters by genre and sorts the roster

When Artists search is available, it SHALL offer genre filters derived from the roster's genre values with per-genre counts, and a sort choice between name order (A–Z) and latest release. Search text and the genre filter SHALL combine. The visible count, clear action, and empty-state copy SHALL keep their existing wording.

#### Scenario: Visitor filters by genre

- **WHEN** a visitor selects a genre filter
- **THEN** only roster rows with that genre remain visible
- **AND** the selected filter exposes a pressed state to assistive technology
- **AND** the visible artist count updates and a clear action restores every row

#### Scenario: Search and genre combine to no results

- **WHEN** the search text and the selected genre match no artist
- **THEN** the roster shows "No artists match the current filters."
- **AND** the clear action resets both the search text and the genre filter

#### Scenario: Visitor sorts by latest release

- **WHEN** a visitor chooses the latest-release sort
- **THEN** rows order by their latest release date, newest first, with upcoming or undated latest releases first
- **AND** choosing A–Z restores name order

### Requirement: Large rosters provide an A–Z index

When the Artists collection contains at least 13 profiles, the roster SHALL group rows by the first letter of the artist name in A–Z order and SHALL offer an A–Z jump index. Letters without artists SHALL be present but disabled. Grouping SHALL apply only to the A–Z sort.

#### Scenario: Roster reaches 13 artists

- **WHEN** the Artists collection contains 13 or more profiles and the A–Z sort is active
- **THEN** each letter group starts with a visible letter marker
- **AND** activating an enabled letter in the index moves focus and scroll to that group's first artist

#### Scenario: Roster has fewer than 13 artists

- **WHEN** the Artists collection contains 12 or fewer profiles
- **THEN** no A–Z index or letter grouping is rendered
