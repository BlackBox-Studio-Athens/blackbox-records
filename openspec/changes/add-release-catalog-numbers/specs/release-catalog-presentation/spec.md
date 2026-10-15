## ADDED Requirements

### Requirement: Releases have canonical unique catalog numbers

Every publication-complete BlackBox Release SHALL have exactly one unique positive catalog number formatted as BBR# followed by at least three digits, padded only to that minimum. Distro records SHALL NOT carry this field. Numeric comparison SHALL determine catalog order.

#### Scenario: Owner assigns legacy catalog identities

- **WHEN** legacy catalog identities are assigned
- **THEN** the table supplied directly by the owner on 2026-10-15 is caregivers (Chronoboros)=BBR#001, disintegration (Afterwise)=BBR#002, anarchotribal (Ouranopithecus)=BBR#003 and lotus (Sidus)=BBR#004, independent of release dates.

#### Scenario: Canonical catalog number is parsed

- **WHEN** catalog identity is supplied
- **THEN** BBR#001 and BBR#1000 are accepted
- **AND** zero, nonstrings, whitespace, negatives, wrong case, missing #, insufficient padding and redundant padding are rejected.

#### Scenario: Two releases claim one number

- **WHEN** a publication candidate contains duplicate catalog numbers
- **THEN** validation rejects it and identifies the number and clashing Releases, including editorial-only records.

### Requirement: Releases show their catalog number in the date line

The release page and every Releases card SHALL show the release's catalog number at the end of the existing date line, after a middle-dot separator, in the line's own muted uppercase style. Screen readers SHALL hear it as "Catalog number BBR#…"; the separator SHALL be hidden from them. The number SHALL wrap as a unit rather than overflow. No other public surface SHALL change.

#### Scenario: Visitor reads a release

- **WHEN** a visitor opens Disintegration's release page or the Releases page
- **THEN** the page date line reads "Release date / Jun 9, 2026 · BBR#002" and the card date line reads "Jun 2026 · BBR#002"
- **AND** the number is announced as "Catalog number BBR#002".
