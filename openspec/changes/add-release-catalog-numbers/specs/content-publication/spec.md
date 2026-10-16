## ADDED Requirements

### Requirement: Accepted legacy Release snapshots have a bounded catalog upgrade

Readers SHALL deterministically upgrade missing catalog_number only in accepted snapshots using the owner-confirmed release slug assignments. They SHALL preserve immutable stored bytes and identity, reject unknown identities and invalid supplied values, and require explicit valid numbers for new publication candidates.

#### Scenario: Confirmed legacy snapshot renders

- **WHEN** an accepted snapshot lacks catalog_number on caregivers, anarchotribal, disintegration or lotus
- **THEN** the reader supplies BBR#001, BBR#003, BBR#002 or BBR#004 respectively and validates the full upgraded snapshot.

#### Scenario: Legacy release is unmapped

- **WHEN** an accepted snapshot contains an unmapped Release without catalog_number
- **THEN** loading fails with a message naming that slug and the missing owner-confirmed assignment
- **AND** no number is invented.

#### Scenario: A new candidate omits a catalog number

- **WHEN** a new snapshot or publication candidate is validated
- **THEN** missing catalog_number fails even for a known legacy slug.

#### Scenario: Staff publishes an explicit number matching a legacy display default

- **WHEN** a saved Release draft supplies the same catalog_number that rendering supplies for an accepted snapshot lacking the field
- **THEN** saved-change discovery and publication review compare against the stored accepted fields and retain the catalog-number change for publication
- **AND** rendering and candidate assembly retain validated compatibility defaults for other accepted legacy Releases.

#### Scenario: Catalog-number-only publication has an unrelated retained shop operation

- **WHEN** an already-on-sale Release has exactly one reviewed change to catalog_number and no price draft
- **THEN** its individual publish flow uses the normal revision- and baseline-checked website publication path, without a shop synchronization command or live price confirmation
- **AND** retained shop operations remain unchanged; new items, price drafts and other or mixed field changes retain their existing shop publication path and checks.
