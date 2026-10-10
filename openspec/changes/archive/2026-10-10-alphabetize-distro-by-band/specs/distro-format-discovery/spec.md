## MODIFIED Requirements

### Requirement: Distro browse ordering is deterministic

Distro SHALL present one mixed-format catalog with recent released BlackBox titles first, newest-first, and all other items in band A–Z order. Release title and canonical slug SHALL break alphabetical ties. Existing authored order values and physical format SHALL not determine this presentation.

#### Scenario: Populated groups are rendered

- **WHEN** Distro renders
- **THEN** accepted formats remain available as optional filters in the existing order: Vinyl 12-inch, Vinyl 10-inch, Vinyl 7-inch, CDs, Tapes, Clothes, Other
- **AND** empty formats are omitted
- **AND** formats do not split the default catalog into sections.

#### Scenario: Records share or skip order values

- **WHEN** records have duplicate, gapped or conflicting editorial order values
- **THEN** the catalog follows promotion and band ordering without renumbering source content.

#### Scenario: Band and title ordering differ

- **WHEN** a band's name sorts before another band's name but its release title sorts after that band's title
- **THEN** band order takes precedence regardless of format
- **AND** comparison handles case and equivalent Unicode spellings, retaining title and slug tie-breakers.

#### Scenario: Distro JavaScript is unavailable

- **WHEN** JavaScript is disabled
- **THEN** every canonical selected Store Item remains visible exactly once in the same mixed catalog order.

## ADDED Requirements

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
