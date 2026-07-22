## MODIFIED Requirements

### Requirement: Distro format navigation mirrors populated browse groups

The Store Distro category SHALL render one server-derived format-navigation landmark whose format links, order, counts, and targets come from the same populated Distro-category browse groups as the catalog sections, plus one utility link back to the Store Distro intro. It SHALL present those links as the existing inline row on desktop and as a native disclosure on narrow widths without creating separate navigation authority.

#### Scenario: Populated groups are available

- **WHEN** `/store/distro/` renders its catalog
- **THEN** one navigation landmark named `Browse formats` appears after the Store category navigation, intro, and search control and before the catalog groups
- **AND** its active responsive presentation contains exactly one format link for each populated derived browse group in the same order
- **AND** every format link displays and exposes its group name and current Distro-category item count
- **AND** one separately identified `Top` link targets the Store Distro intro and remains outside the mobile disclosure
- **AND** empty groups produce neither a format link nor a section
- **AND** desktop and mobile presentations derive from the same server-created group list while CSS exposes only one presentation to layout, assistive technology, and keyboard focus at a time.

#### Scenario: Visitor opens Browse formats on a narrow viewport

- **WHEN** the viewport is narrower than `48rem` and the visitor activates the closed `Browse formats` summary
- **THEN** the native disclosure opens and shows every populated format link and count in an auto-fitting one- or two-column panel
- **AND** the panel reflows to one column when text size, zoom, or available width requires it
- **AND** no format requires horizontal scrolling, a hidden scrollbar, a clipped-edge inference, a swipe hint, or a custom carousel control
- **AND** the summary and `Top` targets remain at least 44 CSS pixels high with visible focus.

#### Scenario: Navigation link targets a group

- **WHEN** a visitor activates a format link
- **THEN** its fragment and app-shell target identify the same unique heading used by that group's labelled section
- **AND** the enhanced mobile path closes the format disclosure before scrolling
- **AND** the target heading remains visible below the fixed site header and closed sticky format-navigation row
- **AND** no second Store Category, route, tab state, filter state, authored taxonomy, or active-group observer is created.

#### Scenario: Visitor browses a deep group

- **WHEN** the visitor reaches a group far below the Store Distro intro
- **THEN** the desktop row or closed mobile disclosure remains sticky directly below the fixed site header
- **AND** the `Browse formats` summary and `Top` link remain available without a document scroll listener, active-section observer, pagination control, or duplicate navigation landmark.

#### Scenario: Visitor returns to the page top

- **WHEN** the visitor activates `Top`
- **THEN** its fragment and app-shell target identify the Store Distro intro
- **AND** ordinary anchor behavior remains the no-JavaScript fallback.

#### Scenario: Catalog membership changes

- **WHEN** classified Distro entries enter, leave, or move between populated browse groups
- **THEN** navigation counts and both responsive format-link presentations follow the resulting server-derived group list without authored navigation data.

### Requirement: Distro format navigation remains progressive and search-safe

The Store Distro format navigation MUST remain usable without client JavaScript and MUST NOT expose stale navigation or disclosure state while client-side Distro search is active or after shell snapshot restoration.

#### Scenario: Client JavaScript is unavailable

- **WHEN** `/store/distro/` loads without the app shell or search control
- **THEN** the narrow-width native `Browse formats` disclosure opens and closes through browser behavior
- **AND** every visible format link remains an ordinary fragment link to its rendered group heading
- **AND** the complete server-rendered Distro-category catalog remains available.

#### Scenario: Distro search query is active

- **WHEN** the normalized Store Distro search query is non-empty
- **THEN** any open mobile format disclosure is closed
- **AND** the whole format-navigation landmark is hidden from presentation and keyboard focus
- **AND** no filtered count or per-link visibility model is maintained.

#### Scenario: Distro search clears or disconnects

- **WHEN** the query is cleared or the Store Distro search control cleans up on route exit
- **THEN** the server-rendered format navigation is restored without recreating or reordering it
- **AND** its mobile disclosure returns to the closed server state.

#### Scenario: Shell snapshot is cached and restored

- **WHEN** the app shell caches or restores `/store/distro/`
- **THEN** snapshot sanitation removes stale mobile disclosure `open` state
- **AND** the restored route exposes the closed mobile disclosure or desktop inline row appropriate to the current viewport.

#### Scenario: Visitor uses the keyboard

- **WHEN** a visitor tabs through the visible format navigation
- **THEN** Enter or Space toggles the native mobile summary, Tab reaches each visible format link and `Top`, and Enter follows ordinary anchor semantics
- **AND** no custom arrow-key model, carousel, scroll button, menu widget, or roving tabindex is required.
