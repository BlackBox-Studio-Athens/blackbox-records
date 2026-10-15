## ADDED Requirements

### Requirement: Staff operates on structured catalog numbers

The shared model SHALL construct catalog numbers from positive safe integer ordinals, return null for invalid numeric inputs, and read safe ordinals without rounding. Next free number SHALL be maximum plus one across used numbers, starting at BBR#001, preserving gaps and canonical string storage. Existing canonical strings outside the safe numeric input range SHALL remain readable without precision loss.

#### Scenario: Staff constructs and reads a number

- **WHEN** Staff supplies ordinal 2
- **THEN** the constructed value is BBR#002 and reading its ordinal yields 2
- **AND** zero, negative, fractional, non-finite and unsafe ordinals return null.

#### Scenario: Staff suggests the next available number

- **WHEN** saved numbers include BBR#001 and BBR#004
- **THEN** the suggestion is BBR#005 rather than filling a gap
- **AND** an empty inventory suggests BBR#001.

### Requirement: Staff can read reserved release numbers privately

The CMS SHALL offer an authenticated editorial-staff GET of every canonical number reserved by current saved draft and live release revisions, with release id, slug, title and draft/published status, plus the next free number. The response SHALL be private and no-store. Unavailable or mismatched saved revisions SHALL fail the read. This read SHALL NOT save content, publish or infer legacy identities.

#### Scenario: A release has a different saved draft number

- **WHEN** its live revision uses BBR#002 and its private draft uses BBR#005
- **THEN** both numbers are returned with the same release id and their respective statuses
- **AND** identical draft/live numbers are listed once as published.

#### Scenario: Anonymous or lower-role callers request availability

- **WHEN** a caller is unauthenticated, has a role below 30, or uses a method other than GET
- **THEN** the endpoint returns 403 with private no-store caching and no inventory.

### Requirement: Draft saves enforce release catalog-number uniqueness

The supported native Staff release create/update write path SHALL reject a supplied canonical number reserved by another release's current draft or live revision before persistence. The rejection SHALL be a field-scoped catalog_number validation error naming that release. Self-saves by id or slug and absent/null/empty draft values SHALL remain allowed. Concurrent release saves SHALL serialize the uniqueness check through persistence. Publication-time uniqueness checks SHALL remain active.

#### Scenario: A different release owns the supplied number

- **WHEN** a save claims BBR#002 reserved by Disintegration
- **THEN** the CMS returns 422 with fieldErrors.catalog_number equal to BBR#002 is already used by Disintegration.
- **AND** the rejected write is not forwarded to native persistence.

#### Scenario: A release retains its own catalog number

- **WHEN** a release saves its own reserved number using its id or slug
- **THEN** the uniqueness check allows the save.

#### Scenario: Inventory cannot be verified during a save

- **WHEN** saved release data cannot be read safely
- **THEN** the CMS rejects the save as unavailable instead of treating the number as free.

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

### Requirement: Staff enters catalog numbers as structured values

The Release editor and new-release setup SHALL present the catalog number as a fixed BBR# prefix with a digits-only input, never free text. The stored value SHALL always be the canonical number built from the typed digits. The field SHALL show, from the staff catalog-number read, whether the number is free, this release's current number, or already used by a named release, and SHALL offer the next free number as a one-click choice. Server-side save and publication checks remain authoritative.

#### Scenario: Staff pick a number another release uses

- **WHEN** staff type 2 while Disintegration already has BBR#002
- **THEN** the field shows "BBR#002 is already used by Disintegration. Pick another number." and offers "Use" with the next free number.
