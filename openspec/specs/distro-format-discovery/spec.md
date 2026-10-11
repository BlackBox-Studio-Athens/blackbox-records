# distro-format-discovery Specification

## Purpose

TBD - created by archiving change organize-distro-format-discovery. Update Purpose after archive.

## Requirements

### Requirement: Distro physical types remain exact

The system MUST preserve each Distro record's accepted physical type in content and inventory data while treating Store Categories and browse headings as derived presentation only.

#### Scenario: Small vinyl is grouped for browsing

- **GIVEN** a Store Item classified as `Distro` has a source record with exact group `Vinyl 7-inch` or `Vinyl 10-inch`
- **WHEN** the Store Distro category groups records for browsing
- **THEN** the record appears under the matching `Vinyl 7-inch` or `Vinyl 10-inch` heading
- **AND** the two physical types are not combined into one browse group
- **AND** the record's exact physical type remains visible and unchanged in content, inventory, Store Item, variant, and Store Offer authority.

#### Scenario: Free-text format differs from physical type wording

- **GIVEN** a Distro record has a valid exact group and free-text `format`
- **WHEN** catalog or browse identity is derived
- **THEN** the exact group remains physical-type authority
- **AND** `format` is used only as display copy.

#### Scenario: Content and inventory types disagree

- **GIVEN** a Distro content record resolves bijectively to a Distro Inventory Source row
- **WHEN** its normalized exact group differs from the source item type
- **THEN** validation fails before Desired Catalog State, Product Projections, availability, stock, Store Offers, or Store Category presentation is generated.

#### Scenario: Content and inventory matching is not bijective

- **GIVEN** a Distro content record or inventory row does not resolve to exactly one counterpart
- **WHEN** source reconciliation runs
- **THEN** validation fails before physical types are compared or catalog artifacts are generated.

### Requirement: Distro browse ordering is deterministic

Distro SHALL present its distro-sourced Store Items in one mixed-format catalog ordered by band A–Z, with release title and canonical slug breaking ties. Authored order values and physical formats SHALL NOT determine the default catalog order. BlackBox releases SHALL NOT enter this catalog or receive Distro promotion.

#### Scenario: Populated groups are rendered

- **WHEN** Distro renders
- **THEN** populated formats remain available as optional filters in the existing order: Vinyl 12-inch, Vinyl 10-inch, Vinyl 7-inch, CDs, Tapes, Clothes, Other
- **AND** empty formats are omitted
- **AND** formats do not divide the default catalog into sections.

#### Scenario: Records share or skip order values

- **WHEN** records have duplicate, gapped or conflicting authored order values
- **THEN** band order applies without renumbering content.

#### Scenario: Distro JavaScript is unavailable

- **WHEN** JavaScript is disabled
- **THEN** every selected canonical distro-sourced Store Item remains visible exactly once in the same mixed catalog order.

#### Scenario: Band and title ordering differ

- **WHEN** a band's name sorts before another band but its record title sorts after that band's title
- **THEN** band order takes precedence across formats
- **AND** comparison handles case and equivalent Unicode spellings, retaining title and slug tie-breakers.

### Requirement: Recent BlackBox releases receive limited promotion

Distro SHALL promote released BlackBox Store items dated within the inclusive preceding six calendar months at UTC-day granularity. The cutoff SHALL clamp at month-end. Undated, future and explicitly upcoming releases SHALL not receive recent-release promotion. The window SHALL be evaluated when catalog markup renders.

#### Scenario: Recent and older BlackBox items coexist

- **WHEN** eligible recent and older BlackBox Store items are present
- **THEN** recent items lead newest-first with a New release label, while older items remain in the band A–Z remainder
- **AND** promoted items are not repeated in the remainder.

#### Scenario: Release reaches the cutoff

- **WHEN** a release date equals the inclusive six-calendar-month cutoff
- **THEN** it remains promoted
- **AND** a date one day earlier remains alphabetically present without promotion.

#### Scenario: Destination month is shorter

- **WHEN** subtracting six calendar months would produce a nonexistent day
- **THEN** the cutoff uses the destination month's final day, including leap-year February.

#### Scenario: Upcoming or undated items are present

- **WHEN** an item is undated, future-dated or explicitly upcoming
- **THEN** recent-release promotion does not apply and normal Store inclusion rules remain authoritative
- **AND** upcoming status does not imply pre-order eligibility or promotion.

#### Scenario: Retained static output is served

- **WHEN** retained static markup is served
- **THEN** it retains the promotion window from its build until the next normal render/build, without a new scheduled process.
