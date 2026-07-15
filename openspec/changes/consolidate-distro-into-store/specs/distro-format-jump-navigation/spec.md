## MODIFIED Requirements

### Requirement: Distro format navigation mirrors populated browse groups

The Store Distro category SHALL render one server-derived format navigation whose format links, order, counts, and targets come from the same populated Distro-category browse groups as the catalog sections, plus one utility link back to the Store Distro intro.

#### Scenario: Populated groups are available

- **WHEN** `/store/distro/` renders its catalog
- **THEN** one navigation landmark named by the visible `Browse formats` label appears after the Store category navigation, intro, and search control and before the catalog groups
- **AND** it contains exactly one format link for each populated derived browse group in the same order
- **AND** every format link displays and exposes its group name and current Distro-category item count
- **AND** one separately identified `Top` link targets the Store Distro intro
- **AND** empty groups produce neither a format link nor a section.

#### Scenario: Navigation link targets a group

- **WHEN** a visitor activates a format link
- **THEN** its fragment and app-shell target identify the same unique heading used by that group's labelled section
- **AND** the target heading remains visible below the fixed site header and sticky format navigation
- **AND** no second Store Category, route, tab state, filter state, or authored taxonomy is created.

#### Scenario: Visitor browses a deep group

- **WHEN** the visitor reaches a group far below the Store Distro intro
- **THEN** the format navigation remains sticky directly below the fixed site header
- **AND** its format links remain horizontally reachable at narrow widths without causing page-level horizontal overflow
- **AND** the `Top` link remains available without an active-section observer, scroll listener, or duplicate navigation.

#### Scenario: Visitor returns to the category top

- **WHEN** the visitor activates `Top`
- **THEN** its fragment and app-shell target identify the Store Distro intro
- **AND** ordinary anchor behavior remains the no-JavaScript fallback.

#### Scenario: Catalog membership changes

- **WHEN** classified Distro entries enter, leave, or move between populated browse groups
- **THEN** navigation counts and format links follow the resulting server-derived group list without authored navigation data.

### Requirement: Distro format navigation remains progressive and search-safe

The Store Distro format navigation MUST remain usable without client JavaScript and MUST NOT expose stale navigation while client-side Distro search is active.

#### Scenario: Client JavaScript is unavailable

- **WHEN** `/store/distro/` loads without the app shell or search control
- **THEN** every format link remains a native fragment link to its rendered group heading
- **AND** the complete server-rendered Distro-category catalog remains available.

#### Scenario: Distro search query is active

- **WHEN** the normalized Store Distro search query is non-empty
- **THEN** the whole format navigation is hidden from presentation and keyboard focus
- **AND** no filtered count or per-link visibility model is maintained.

#### Scenario: Distro search clears or disconnects

- **WHEN** the query is cleared or the Store Distro search control cleans up on route exit
- **THEN** the server-rendered format navigation is restored without recreating or reordering it.

#### Scenario: Visitor uses the keyboard

- **WHEN** a visitor tabs to and activates a visible format link
- **THEN** the link uses ordinary anchor semantics and reaches its matching group target
- **AND** no carousel, scroll button, or custom keyboard interaction is required.
