## MODIFIED Requirements

### Requirement: Store category membership is faceted and presentation-only

The system MUST derive deterministic Store Category memberships for each canonical Store Item without changing commerce source identity or authority, while deduplicating every selected view.

#### Scenario: Release-sourced Store Item is classified

- **WHEN** a canonical release-sourced Store Item is classified
- **THEN** it belongs to both BlackBox Releases and Distro, using the same source, slug and commerce identity.

#### Scenario: Clothes Store Item is classified

- **WHEN** a distro-sourced Store Item has exact accepted group Clothes
- **THEN** it belongs to Distro and Merch without changing its exact physical type or source identity.

#### Scenario: Remaining Distro Store Item is classified

- **WHEN** a distro-sourced Store Item is not Clothes
- **THEN** it belongs to Distro.

#### Scenario: All collection is derived

- **WHEN** All is prepared
- **THEN** each canonical Store Item appears exactly once and has at least one named category membership
- **AND** overlapping named memberships do not duplicate an item within any collection.

#### Scenario: Category authority is inspected

- **WHEN** category membership is derived or serialized
- **THEN** it remains frontend presentation data and does not become a commerce source kind, D1 field, Worker API, offer, Stripe field, checkout payload, cart identity or stock authority.

### Requirement: Store category pages render honest collection states

Each discoverable Store category route SHALL render its canonical Store Items once and preserve ordinary Store Item navigation, existing editorial exclusions and authoritative availability.

#### Scenario: All or BlackBox Releases renders items

- **WHEN** All or BlackBox Releases renders
- **THEN** each selected item appears once and links to its canonical Store Item detail route.

#### Scenario: One Store Item has multiple category memberships

- **WHEN** a Store Item belongs to multiple named categories
- **THEN** it appears once in each selected collection and once in All
- **AND** no additional offer, stock record, checkout identity or Store Item is created.

#### Scenario: Distro category renders items

- **WHEN** Distro renders
- **THEN** canonical distro-sourced and release-sourced Store Items share one mixed-format ordered catalog
- **AND** older BlackBox releases remain alphabetically discoverable
- **AND** Clothes membership does not remove an item from Distro
- **AND** search, optional format filtering, explicit-choice Coverflow and complete no-JavaScript access remain available.

#### Scenario: Merch category is empty

- **WHEN** no canonical Merch items exist and a visitor opens Merch
- **THEN** the route replaces its location with base-aware Store All and supplies the existing meta-refresh fallback and ordinary Store link without an empty shelf or commerce placeholder.

#### Scenario: Merch becomes populated

- **WHEN** accepted content creates canonical Merch membership
- **THEN** the route, category navigation and sitemap derive it without authored counts and without the empty-route redirect.

## REMOVED Requirements

### Requirement: Distro browse-group introductions use restrained editorial typography

**Reason**: The mixed catalog has no format section headings or introductions.
**Migration**: Preserve the existing Distro hero introduction and Store card typography; optional format links filter the single catalog.
