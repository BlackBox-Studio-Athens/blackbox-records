## Purpose

Let shoppers search the complete All Store shelf using the existing Distro search behavior while preserving catalog order, shell navigation, and pricing performance.

## ADDED Requirements

### Requirement: All Store search covers the rendered catalog

The system SHALL provide Search Store on `/store/` across all rendered Store Items, including label releases, Distro, and any populated merch, using existing title, artist/label, and available format/group metadata.

#### Scenario: A match is outside the current preview

- **WHEN** the query matches an item beyond the visible coverflow preview
- **THEN** that item is included in the visible results
- **AND** search is not limited to the currently focused or first group of cards.

#### Scenario: Optional metadata is absent

- **WHEN** an item has no group or format metadata
- **THEN** its title and artist/label remain searchable
- **AND** missing metadata does not remove the item or create searchable placeholder text.

### Requirement: Store search preserves existing exact-first matching

The system MUST reuse the existing Distro local search behavior, returning exact normalized substring matches before considering fuzzy fallback, without remote search or catalog reordering.

#### Scenario: Exact matches exist

- **WHEN** a case-insensitive query matches one or more searchable item texts exactly as a substring
- **THEN** every exact match is shown
- **AND** fuzzy-only matches are excluded
- **AND** visible cards retain their original catalog order and identities.

#### Scenario: No exact match exists

- **WHEN** no item contains the normalized query
- **THEN** the existing fuzzy fallback determines the matching set
- **AND** matching cards still retain their original catalog order.

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
- **AND** existing explicit disclosure controls can return to preview where coverflow is eligible and supported.

#### Scenario: Search has never been activated

- **WHEN** the All route starts with an empty query
- **THEN** its existing default preview or catalog presentation remains unchanged.

### Requirement: Store search is isolated to supported route activations

The search enhancement MUST mount only for the active All or Distro search placeholder and MUST leave clean server-authored state on navigation, cache capture, or teardown.

#### Scenario: Shopper moves between All and Distro

- **WHEN** a searched route is left, cached, restored, or revisited through history
- **THEN** query, filtered visibility, pending work, and result feedback do not leak into another activation
- **AND** there is one active search control and at most one coverflow controller for the active searchable shelf, with ordinary-grid search usable when coverflow is unavailable.

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

### Requirement: Search does not increase commerce reads

The system MUST perform typing, filtering, and clearing locally and SHALL preserve existing Store performance acceptance thresholds and one listing-price projection per route activation.

#### Scenario: Shopper changes a query

- **WHEN** search input changes or is cleared
- **THEN** it issues no additional listing-price, per-item Store Offer, or remote-search request
- **AND** prices continue updating the existing card nodes independently.

#### Scenario: Search performance is measured

- **WHEN** All and Distro are exercised under the existing fixed load and mobile-stress profiles
- **THEN** LCP remains at most 2.5 seconds, CLS at most 0.1, and search adds no task of 50 milliseconds or longer
- **AND** reduced-motion and keyboard interaction remain usable.
