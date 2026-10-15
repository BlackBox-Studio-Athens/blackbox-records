## ADDED Requirements

### Requirement: Catalog number completeness is enforced at publication

Staff SHALL be able to save an unfinished Release without a catalog number. Publication SHALL require canonical catalog_number and SHALL report duplicate numbers in review. Schema preparation SHALL add the string field labelled Catalog number idempotently. Explicit backfill SHALL use only owner-confirmed assignments and SHALL NOT publish.

#### Scenario: An unfinished Release is saved

- **WHEN** catalog_number is absent, null or empty
- **THEN** private draft saving remains available
- **AND** publication completeness reports Enter a catalog number such as BBR#001 (starting at 001).

#### Scenario: Review detects a clash with accepted content

- **WHEN** a selected Release claims another candidate Release's catalog number
- **THEN** its review completeness issues name the number and clashing Releases.

#### Scenario: Confirmed legacy Releases are backfilled

- **WHEN** the operator checks missing catalog numbers for caregivers, anarchotribal, disintegration and lotus
- **THEN** the reviewed plan uses the owner-confirmed BBR#001, BBR#003, BBR#002 and BBR#004 assignments respectively
- **AND** applying the plan stages private drafts without publishing or changing accepted snapshots.
