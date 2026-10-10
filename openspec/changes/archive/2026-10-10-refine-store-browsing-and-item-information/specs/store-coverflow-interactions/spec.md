# Spec Delta

## MODIFIED Requirements

### Requirement: Store Coverflow uses one shared progressive enhancement contract

Every eligible flat Store collection route rendered through `StoreCollectionPage` and every eligible Distro group SHALL use one Store-level Coverflow controller and lifecycle contract while preserving route-owned canonical Store Item nodes and complete server-rendered catalogs.

#### Scenario: Shared enhancement mounts

- **WHEN** a flat collection or Distro group is eligible under its existing item-count rule, including an explicitly selected Distro format with at least two items, and JavaScript, required 3D CSS support, and a functioning controller caller are available
- **THEN** the shared Store Coverflow controller reads route-owned cards in their existing canonical order and retains `catalog` mode until the visitor chooses Coverflow
- **AND** only explicit Coverflow activation assigns relative stage positions to at most six existing cards
- **AND** no card, Store Item projection, Store data request, authored collection, or commerce identity is duplicated
- **AND** the route's shared browse control owns matching and one controller lifecycle per active route, so the app shell does not also mount it
- **AND** Distro retains group-local view choices, without a page-wide mode synchronizer.

#### Scenario: Flat collection eligibility is universal

- **WHEN** All, BlackBox Releases, populated Merch, or a future non-Distro flat category is rendered through `StoreCollectionPage`
- **THEN** the same greater-than-six eligibility rule, controller, wheel cadence, arrow-key behavior, hover/focus cue, disclosure behavior, reduced-motion contract, and fallback apply without a category-specific branch
- **AND** six or fewer canonical items remain the complete ordinary grid.

#### Scenario: Enhancement is unavailable

- **WHEN** JavaScript is disabled, required 3D CSS support is unavailable, or a direct-load or app-shell controller stalls or rejects mounting
- **THEN** the complete server-rendered catalog remains visible and operable in canonical order
- **AND** no nonfunctional Coverflow controls or pre-hydration hidden catalog state remain.

#### Scenario: Store route exits and re-enters

- **WHEN** the app shell caches, leaves, restores, or reloads a Store route containing Coverflow
- **THEN** generic Store Coverflow snapshot sanitation restores the complete Grid, canonical order, initial selection, labels, and controls
- **AND** selected, ready, reveal, visited, and temporary transition state is removed before caching
- **AND** the route-specific controller remounts once for the active shell pathname and removes its listeners and in-flight animation state during cleanup
- **AND** a prior mount failure does not prevent a later Store activation from rechecking capability and mounting successfully.

#### Scenario: Editorial and detail routes remain outside Coverflow

- **WHEN** editorial Releases or a Store Item detail route renders
- **THEN** it remains outside Store Coverflow eligibility and lifecycle
- **AND** its existing editorial or detail availability and navigation behavior remains unchanged.

#### Scenario: Optional Coverflow becomes available

- **WHEN** an eligible group has a functioning controller and no active text or artist filter
- **THEN** its labelled view choices appear in Grid then Coverflow order, with the current choice exposed programmatically
- **AND** unavailable or pending enhancement leaves Grid usable without queuing user intent.

## REMOVED Requirements

### Requirement: Store Coverflow retains one pre-ready disclosure activation

**Reason**: Grid is fully visible until the optional controller is ready, removing the hidden-catalogue condition that required early disclosure replay.

**Migration**: Remove preview-first pending-disclosure capture and replay; expose Coverflow only after its controller is ready. Keep cleanup for real user-triggered transitions.
