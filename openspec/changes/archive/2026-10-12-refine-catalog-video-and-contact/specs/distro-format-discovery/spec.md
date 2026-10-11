## MODIFIED Requirements

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
