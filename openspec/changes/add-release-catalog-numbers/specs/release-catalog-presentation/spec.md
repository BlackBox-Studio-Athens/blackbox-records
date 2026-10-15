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
