## ADDED Requirements

### Requirement: Store browse uses one responsive toolbar

Store collection browse controls SHALL use one toolbar row below category navigation. Below 64rem it SHALL contain Search Store and one Filter trigger; at wider widths it SHALL contain the existing Search, Formats, Artists, eligible Pre-orders, View and result count. There SHALL be no desktop side pane or separate view toolbar.

#### Scenario: Shopper opens the phone controls

- **WHEN** Filter is activated below 64rem
- **THEN** one modal bottom sheet shows the existing Distro format links/counts, eligible Pre-orders, View and Artists, in that order
- **AND** Show N items, Close, Escape and Back close it and restore Filter without scrolling the background
- **AND** Forward restores its available local state through the existing marked surface history.

#### Scenario: Shopper uses desktop menus

- **WHEN** the viewport is at least 64rem and text fits normally
- **THEN** Formats and Artists open popovers from the same 44px toolbar row using the same content as the phone sheet
- **AND** reflow uses the compact sheet arrangement before controls or labels clip.

### Requirement: Browse relocation preserves catalogue behavior

Relocated controls SHALL retain existing data, link destinations, counts, matching and catalogue order. All SHALL retain BlackBox releases first by catalog number, then Distro by artist. Formats SHALL remain Distro links and SHALL NOT become cross-category facets. Other collections and Crate eligibility SHALL keep their existing behavior.

#### Scenario: All presents the relocated format links

- **WHEN** the shopper follows a format link from All
- **THEN** it opens the same base-aware Distro fragment destination with the existing Distro count
- **AND** no All-specific format count or in-place All format facet is introduced.

#### Scenario: Shopper changes existing filters

- **WHEN** query, artists or Pre-orders change
- **THEN** the existing matching behavior and result count apply in current canonical order
- **AND** no new data field, catalogue read or per-item offer request is added.

### Requirement: Browse choices have a bounded lifecycle

The unified Filter surface SHALL reuse existing selection and clearing behavior. Closing it SHALL retain active page choices; route cleanup and snapshot restoration SHALL retain their existing reset rules. Native Distro format links SHALL remain reachable without the enhancement.

#### Scenario: Shopper clears filters

- **WHEN** Clear filters, Clear search or artists-only Clear is used
- **THEN** each retains its existing scope and focus behavior
- **AND** results retain the current catalogue order without opening Crate automatically.

#### Scenario: Shopper changes or restores a category

- **WHEN** the page is left, cached or reactivated
- **THEN** stale selection, hidden state, count and open sheets/popovers do not leak
- **AND** valid legacy Distro fragments and existing Pre-orders entry intent remain supported.

#### Scenario: Enhancement is unavailable

- **WHEN** JavaScript is disabled or initialization fails
- **THEN** the complete server-rendered catalog and ordinary format links remain reachable in a visible or native-disclosure fallback
- **AND** a JavaScript-only sheet or popover does not trap the links behind a dead trigger.
