## MODIFIED Requirements

### Requirement: All Store provides one complete bounded Coverflow

Every flat Store collection route rendered through `StoreCollectionPage` SHALL optionally enhance its complete canonical collection into one bounded Store Coverflow when it contains more than six canonical Store Items, without changing collection authority, order, identity, availability authority, or full-catalog access. This includes All, BlackBox Releases, populated Merch, and future non-Distro flat categories; Distro remains grouped under its own grouped-category contract.

#### Scenario: All collection is eligible

- **WHEN** `/store/` contains more than six canonical Store Items and Store Coverflow platform support is available
- **THEN** one Coverflow enters `preview` mode with every All Store Item reachable in the existing deterministic All order
- **AND** the first canonical Store Item starts active
- **AND** at most six existing `StoreItemCard` nodes receive stage positions while every other card leaves presentation, focus order, and the accessibility tree
- **AND** the preview exposes the source-derived total, current position, remaining count, active Store Item identity, continuation ratio, Previous, Next, and `View all {total}`
- **AND** the Store Item availability badge is absent from every positioned preview cover so artwork and active identity remain the preview focus.

#### Scenario: Flat collection categories share one eligibility rule

- **WHEN** All, BlackBox Releases, populated Merch, or a future non-Distro flat category rendered through `StoreCollectionPage` contains more than six canonical Store Items and Store Coverflow platform support is available
- **THEN** the same shared Store Coverflow controller and lifecycle enters `preview` mode in that category's existing deterministic order
- **AND** no per-category controller branch, duplicate card graph, alternate collection query, or second Store Item projection is introduced
- **AND WHEN** the flat collection contains six or fewer canonical Store Items
- **THEN** it remains the complete ordinary grid with no Coverflow controls.

#### Scenario: Visitor traverses All

- **WHEN** the visitor uses Previous, Next, a positioned side cover, focus, a qualifying touch swipe, handled wheel input, or focus-scoped Left Arrow or Right Arrow input
- **THEN** the active item changes within the same complete canonical All sequence and wraps at both ends
- **AND** sustained wheel or repeated arrow input can continue through more than one item under the shared Store Coverflow interaction contract
- **AND** no curated subset, random order, duplicate six-card window, or second Store Item projection is used.

#### Scenario: Every flat category shares the interaction contract

- **WHEN** a visitor traverses an eligible flat Store category
- **THEN** wheel cadence, focus-scoped Left Arrow and Right Arrow behavior, hover/focus cue, disclosure behavior, reduced-motion contract, progressive fallback, and cleanup match every other Store Coverflow
- **AND** editorial Releases and Store Item detail routes remain outside Coverflow.

#### Scenario: Visitor opens the complete All catalog

- **WHEN** the visitor activates `View all {total}`
- **THEN** the same server-rendered All `StoreItemCard` nodes appear exactly once in their existing catalog order
- **AND** each card's existing availability presentation is restored unchanged from its canonical Store collection data
- **AND** the selected Store Item receives focus and remains identifiable
- **AND** the control becomes `Show Coverflow`
- **AND WHEN** the visitor activates `Show Coverflow`
- **THEN** the selected Store Item returns as the active cover and preview availability badges are hidden again.

#### Scenario: All enhancement is unavailable

- **WHEN** All contains six or fewer items, JavaScript is disabled, required 3D CSS support is unavailable, or controller mounting fails
- **THEN** every canonical All Store Item remains visible exactly once as an ordinary Store listing card with its existing availability presentation
- **AND** no nonfunctional Coverflow controls or alternate collection order appears.

#### Scenario: All route enters through the app shell

- **WHEN** the persistent app shell loads or restores `/store/`
- **THEN** the All controller mounts against the swapped canonical card nodes for that shell pathname
- **AND** cached runtime state has been sanitized to the deterministic initial preview
- **AND** preview-only badge suppression follows the restored `preview` mode rather than stale card state
- **AND** All gains no Distro search field, search-results mode, format grouping, or Distro hidden-state ownership.

#### Scenario: Flat category app-shell activation is generic

- **WHEN** the app shell loads or restores an eligible flat Store category
- **THEN** the shared controller mounts against the swapped canonical card nodes without awaiting Store HTML application, transition-veil closure, or listing-price presentation
- **AND** the active category receives one controller mount and no category-specific state engine.

#### Scenario: All Store performance remains catalog-owned

- **WHEN** any flat Store Coverflow enhances, changes its active item, or applies the preview-only availability treatment
- **THEN** it reuses the existing Store listing-price projection, card images, canonical links, availability data, and lazy-loading behavior
- **AND** it adds no backend request, per-item price request, commerce projection, content entry, duplicate card node, or eager load for every offstage image.
