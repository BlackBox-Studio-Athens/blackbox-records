## ADDED Requirements

### Requirement: All Store provides one complete bounded Coverflow

The All Store route SHALL optionally enhance its complete canonical collection into one bounded Store Coverflow without changing collection authority, order, identity, or full-catalog access.

#### Scenario: All collection is eligible

- **WHEN** `/store/` contains more than six canonical Store Items and Store Coverflow platform support is available
- **THEN** one Coverflow enters `preview` mode with every All Store Item reachable in the existing deterministic All order
- **AND** the first canonical Store Item starts active
- **AND** at most six existing `StoreItemCard` nodes receive stage positions while every other card leaves presentation, focus order, and the accessibility tree
- **AND** the preview exposes the source-derived total, current position, remaining count, active Store Item identity, continuation ratio, Previous, Next, and `View all {total}`.

#### Scenario: Visitor traverses All

- **WHEN** the visitor uses Previous, Next, a positioned side cover, focus, a qualifying touch swipe, or qualifying wheel input
- **THEN** the active item changes within the same complete canonical All sequence and wraps at both ends
- **AND** no curated subset, random order, duplicate six-card window, or second Store Item projection is used.

#### Scenario: Visitor opens the complete All catalog

- **WHEN** the visitor activates `View all {total}`
- **THEN** the same server-rendered All `StoreItemCard` nodes appear exactly once in their existing catalog order
- **AND** the selected Store Item receives focus and remains identifiable
- **AND** the control becomes `Show Coverflow`
- **AND WHEN** the visitor activates `Show Coverflow`
- **THEN** the selected Store Item returns as the active cover.

#### Scenario: All enhancement is unavailable

- **WHEN** All contains six or fewer items, JavaScript is disabled, required 3D CSS support is unavailable, or controller mounting fails
- **THEN** every canonical All Store Item remains visible exactly once as an ordinary Store listing card
- **AND** no nonfunctional Coverflow controls or alternate collection order appears.

#### Scenario: All route enters through the app shell

- **WHEN** the persistent app shell loads or restores `/store/`
- **THEN** the All controller mounts against the swapped canonical card nodes for that shell pathname
- **AND** cached runtime state has been sanitized to the deterministic initial preview
- **AND** All gains no Distro search field, search-results mode, format grouping, or Distro hidden-state ownership.

#### Scenario: All Store performance remains catalog-owned

- **WHEN** the All Coverflow enhances or changes its active item
- **THEN** it reuses the existing Store listing-price projection, card images, canonical links, and lazy-loading behavior
- **AND** it adds no backend request, per-item price request, commerce projection, content entry, or eager load for every offstage image.
