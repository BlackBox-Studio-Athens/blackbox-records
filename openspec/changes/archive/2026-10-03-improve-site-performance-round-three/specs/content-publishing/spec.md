## ADDED Requirements

### Requirement: Published content reads are linear and snapshot-scoped

Static and hosted page renders SHALL read published content with work linear in the records they use, and any reuse SHALL be scoped to one accepted snapshot.

#### Scenario: A Store collection page renders

- **WHEN** a Store collection or category page lists its Store Items
- **THEN** each Store Item's availability is computed once from that item without rebuilding the Store Item list
- **AND** the category navigation reuses the listing already computed for the page
- **AND** the rendered output is identical to the previous implementation's.

#### Scenario: A snapshot is parsed

- **WHEN** the reader parses an accepted snapshot or a publication candidate
- **THEN** its schemas are built once per process, not once per record
- **AND** the final publication candidate still receives one full parse with the same validation errors, messages, and paths.

#### Scenario: A page reads a collection or entry

- **WHEN** a render calls `getCollection` or `getEntry` for an accepted snapshot
- **THEN** projections may be reused only for that same snapshot object and media base, with an id index for entries
- **AND** a new snapshot never sees another snapshot's projections
- **AND** staff previews with preview overrides bypass the reuse.
