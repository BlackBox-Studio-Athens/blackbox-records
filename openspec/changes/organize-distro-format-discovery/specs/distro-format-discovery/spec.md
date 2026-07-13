## ADDED Requirements

### Requirement: Distro physical types remain exact

The system MUST preserve each Distro record's accepted physical type in content and inventory data while treating combined browse categories as derived presentation only.

#### Scenario: Small vinyl is grouped for browsing

- **GIVEN** a Distro record has exact group `Vinyl 7-inch` or `Vinyl 10-inch`
- **WHEN** the Distro page groups records for browsing
- **THEN** the record appears under `7-inch & 10-inch Vinyl`
- **AND** the combined label is not persisted as a content group, inventory item type, Store Item field, variant identity, or Store Offer field
- **AND** the record's exact physical type remains visible

#### Scenario: Free-text format differs from physical type wording

- **GIVEN** a Distro record has a valid exact group and free-text `format`
- **WHEN** catalog or browse identity is derived
- **THEN** the exact group remains physical-type authority
- **AND** `format` is used only as display copy

#### Scenario: Content and inventory types disagree

- **GIVEN** a Distro content record resolves bijectively to a Distro Inventory Source row
- **WHEN** its normalized exact group differs from the source item type
- **THEN** validation fails before Desired Catalog State, Product Projections, availability, stock, or Store Offers are generated

#### Scenario: Content and inventory matching is not bijective

- **GIVEN** a Distro content record or inventory row does not resolve to exactly one counterpart
- **WHEN** source reconciliation runs
- **THEN** validation fails before physical types are compared or catalog artifacts are generated

### Requirement: Distro browse ordering is deterministic

The system SHALL derive a stable Distro browse sequence without renumbering existing content.

#### Scenario: Populated groups are rendered

- **WHEN** Distro groups are prepared for the page
- **THEN** populated groups appear in this order: `Vinyl 12-inch`, `7-inch & 10-inch Vinyl`, `CDs`, `Tapes`, `Clothes`, `Other`
- **AND** empty groups are omitted

#### Scenario: Records share or skip order values

- **WHEN** records are ordered within a browse group
- **THEN** ascending `order` is the primary key and title is the deterministic tie-breaker
- **AND** duplicate or gapped `order` values do not require catalog-wide renumbering

#### Scenario: Distro JavaScript is unavailable

- **WHEN** the Distro route is rendered without client JavaScript
- **THEN** every accepted record remains present under its derived browse heading
