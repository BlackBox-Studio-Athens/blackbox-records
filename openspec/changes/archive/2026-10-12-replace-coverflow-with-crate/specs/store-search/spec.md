## MODIFIED Requirements

### Requirement: All Store search covers the rendered catalog

The system SHALL provide Search Store on `/store/` across all rendered Store Items, including label releases, Distro, and any populated merch, using existing title, artist/label, and available format/group metadata.

#### Scenario: A match is outside the current preview

- **WHEN** the query matches an item that is not on screen
- **THEN** that item is included in the visible results
- **AND** search is not limited to the currently focused or first group of cards.

#### Scenario: Optional metadata is absent

- **WHEN** an item has no group or format metadata
- **THEN** its title and artist/label remain searchable
- **AND** missing metadata does not remove the item or create searchable placeholder text.

### Requirement: Search results and clearing are accessible

Search SHALL expose a labeled search input, clear action, polite result count, and explicit no-results state while coordinating with existing catalog disclosure.

#### Scenario: Shopper enters a query

- **WHEN** a nonempty trimmed query becomes active
- **THEN** search reveals all matching cards, hides unmatched cards, and prevents preview controls from obscuring results
- **AND** keyboard focus remains in the search input while results update.

#### Scenario: Query has no matches

- **WHEN** the matching set is empty
- **THEN** one visible accessible empty state and zero-result count are shown
- **AND** a clear action remains available.

#### Scenario: Shopper clears active search

- **WHEN** the query is cleared or becomes whitespace-only
- **THEN** every All Store card returns in canonical order in the complete catalog presentation
- **AND** stale hidden states, empty messages, and counts are removed or updated
- **AND** activating Clear search returns focus to the search input before removing the clear control
- **AND** Grid | Crate returns where the restored Grid holds an item with a bin.

#### Scenario: Search has never been activated

- **WHEN** the All route starts with an empty query
- **THEN** its existing default preview or catalog presentation remains unchanged.

### Requirement: Store search is isolated to supported route activations

The search enhancement MUST mount only for the active All or Distro search placeholder and MUST leave clean server-authored state on navigation, cache capture, or teardown.

#### Scenario: Shopper moves between All and Distro

- **WHEN** a searched route is left, cached, restored, or revisited through history
- **THEN** query, filtered visibility, pending work, and result feedback do not leak into another activation
- **AND** there is one active search control and at most one Store Crate for the active searchable shelf, with ordinary-grid search usable when the Store Crate is unavailable.

#### Scenario: Shopper opens another category

- **WHEN** BlackBox Releases, Merch, or an unrelated route is active
- **THEN** the new All search control does not mount or run there
- **AND** category navigation and existing behavior remain unchanged.

#### Scenario: JavaScript or enhancement fails

- **WHEN** search cannot initialize
- **THEN** the baseline server-rendered catalog and item links remain usable
- **AND** no pre-hydration search hiding or empty placeholder control blocks discovery.

#### Scenario: All disclosure precedes search readiness

- **WHEN** the shopper activates All's View all control once before the shared module is ready
- **THEN** that activation opens the complete catalog exactly once when initialization succeeds
- **AND** initialization failure removes enhancement hiding and nonfunctional controls so the complete ordinary grid remains usable.
