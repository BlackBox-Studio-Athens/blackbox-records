# Spec Delta

## MODIFIED Requirements

### Requirement: Distro format navigation mirrors populated browse groups

The Store Distro category SHALL render one server-derived format-navigation landmark whose format controls, order, counts, and targets come from the same populated Distro-category browse groups as the catalog sections, plus `All formats` and one utility link back to the Store Distro intro. `Vinyl 10-inch` and `Vinyl 7-inch` SHALL be separate derived groups. With client JavaScript, the navigation SHALL expose one transient format selection and present only the selected group; a valid canonical group fragment at controller connection SHALL select that group once before the route controller performs the final scroll/focus. Without client JavaScript, the same format entries SHALL remain ordinary fragment links into the complete catalog. Desktop and mobile presentations SHALL use the same server-derived group authority.

#### Scenario: Populated groups are available

- **WHEN** `/store/distro/` renders its catalog
- **THEN** one navigation landmark named `Browse formats` appears in the desktop left browse pane or the narrow-screen browse disclosure before the catalogue
- **AND** its active responsive presentation contains `All formats` followed by exactly one format entry for each populated derived browse group in the same order
- **AND** every format entry displays and exposes its group name and current Distro-category item count
- **AND** `All formats` is the default current selection when no valid initial group fragment is present
- **AND** one separately identified `Top` link targets the Store Distro intro and remains outside the mobile disclosure
- **AND** empty groups produce neither a format entry nor a section
- **AND** responsive presentations share the same group data and selection, with only the current presentation exposed to layout, assistive technology, and keyboard focus
- **AND** mobile uses one Browse disclosure containing Artists and format navigation, without an additional format disclosure or sticky format bar.

#### Scenario: Vinyl size groups are populated

- **WHEN** current Distro entries populate both 7-inch and 10-inch vinyl classifications
- **THEN** navigation and catalog rendering expose separate `Vinyl 10-inch` and `Vinyl 7-inch` groups with their own counts, headings, fragments, and matching intro copy
- **AND** neither group contains items classified in the other size
- **AND** the complete catalog retains the same total membership and canonical item order.

#### Scenario: Visitor opens Browse formats on a narrow viewport

- **WHEN** the viewport is narrower than the desktop browse-pane breakpoint and the visitor activates the closed `Browse` summary
- **THEN** the native Browse disclosure opens and shows Artists plus All formats and every populated format entry/count in a panel that fits the viewport
- **AND** the summary identifies the current artist and format selections
- **AND** the panel reflows to one column when text size, zoom, or available width requires it
- **AND** no format requires horizontal scrolling, a hidden scrollbar, a clipped-edge inference, a swipe hint, or a custom carousel control
- **AND** the summary and `Top` targets remain at least 44 CSS pixels high with visible focus.

#### Scenario: Navigation link targets a group

- **WHEN** a visitor activates a populated format entry while the Distro enhancement is active
- **THEN** its fragment and app-shell target identify the same unique heading used by that group's labelled section
- **AND** results are limited to that format and the remaining artist/text filters; a format with no matches shows the visible empty-results state
- **AND** canonical item order and format-navigation catalogue totals remain unchanged while the overall result count updates
- **AND** the selected format is exposed as current in both responsive navigation presentations
- **AND** the shared browse visibility update applies format, artist, and text selections without a second hidden-state owner
- **AND** the enhanced path applies selection and closes the mobile Browse disclosure before final scroll/focus
- **AND** matching results focus the visible group heading below the fixed site header; zero matches focus the visible results summary instead of a hidden heading
- **AND** no card or group is recreated, reordered, or moved to a second catalog.

#### Scenario: Route starts with a canonical group fragment

- **WHEN** a direct load, restored shell route, or Store All format link connects `/store/distro/` with a fragment matching a rendered group heading
- **THEN** the matching format becomes the initial current selection
- **AND** only its labelled catalog section is presented
- **AND** the route controller performs the final target scroll/focus after applying that selection
- **AND** the fragment is read once without a hash listener, query parameter, persisted selection, or later URL rewriting.

#### Scenario: Visitor restores all formats

- **WHEN** a visitor activates `All formats`
- **THEN** groups with matches under the remaining artist/text filters appear in their original server-derived order
- **AND** the complete catalogue returns only when those other filters are also clear
- **AND** `All formats` becomes the exposed current selection
- **AND** groups remain in Grid; qualifying groups offer Coverflow only on explicit selection.

#### Scenario: Visitor browses a deep group

- **WHEN** `All formats` is current and the visitor reaches a group far below the Store Distro intro
- **THEN** the desktop browse pane remains available beneath the fixed site header, and the narrow-screen browse disclosure remains reachable in normal document flow
- **AND** the current selection and `Top` link remain available without a document scroll listener, active-section observer, pagination control, or duplicate navigation landmark.

#### Scenario: Visitor returns to the page top

- **WHEN** the visitor activates `Top`
- **THEN** its fragment and app-shell target identify the Store Distro intro
- **AND** ordinary anchor behavior remains the no-JavaScript fallback.

#### Scenario: Catalog membership changes

- **WHEN** classified Distro entries enter, leave, or move between populated browse groups
- **THEN** navigation counts, responsive format entries, and selectable groups follow the resulting server-derived group list without authored navigation data.

### Requirement: Distro format navigation remains progressive and search-safe

The Store Distro format navigation MUST remain usable without client JavaScript and MUST preserve active format and artist selection during text search while clearing transient state on shell snapshot restoration. The shared browse control SHALL remain the sole writer of card, wrapper, and group `hidden` state.

#### Scenario: Client JavaScript is unavailable

- **WHEN** `/store/distro/` loads without the app shell or search control
- **THEN** the narrow-width native Browse disclosure opens and closes through browser behavior
- **AND** it contains functional format links without inert artist controls
- **AND** every visible format entry remains an ordinary fragment link to its rendered group heading
- **AND** `All formats` links to the complete catalog start
- **AND** the complete server-rendered Distro-category catalog remains available.

#### Scenario: Distro search query is active

- **WHEN** the normalized Store Distro search query becomes non-empty
- **THEN** the current format and artist selections remain selected and intersect with text matches
- **AND** format controls remain visible or available inside the labelled browse disclosure
- **AND** source-derived category format counts do not become dynamic search counts
- **AND** only one overall matching-item count is announced.

#### Scenario: Distro search clears or disconnects

- **WHEN** the query is cleared
- **THEN** text matching is removed while current artist and format choices remain effective
- **AND WHEN** the browse control cleans up on route exit
- **THEN** the full catalogue, All artists, All formats, and closed mobile disclosure are restored without recreating or reordering cards.

#### Scenario: Shell snapshot is cached and restored

- **WHEN** the app shell caches or restores `/store/distro/`
- **THEN** snapshot sanitation removes stale selected-format/current markers and mobile disclosure state while existing search sanitation owns `hidden` restoration
- **AND** route reconnection selects the valid current group fragment or falls back to `All formats`
- **AND** a valid selected group receives its final target scroll/focus only after it is presented
- **AND** the restored route exposes the closed mobile disclosure or desktop browse pane appropriate to the current viewport.

#### Scenario: Visitor uses the keyboard

- **WHEN** a visitor tabs through the visible format navigation
- **THEN** Enter or Space toggles the native mobile summary, Tab reaches each visible format entry and `Top`, and Enter activates the focused entry
- **AND** the current selection remains programmatically exposed
- **AND** no custom arrow-key model, carousel, scroll button, menu widget, or roving tabindex is required.

### Requirement: All Store exposes Distro format discovery

The All Store route SHALL expose a compact Distro format ledger when the classified Distro collection has populated groups, using the same server-derived Distro group names, counts, and fragment targets as the Store Distro route without repeating its introduction or a standalone Distro subtotal.

#### Scenario: All Store renders Distro discovery

- **GIVEN** `/store/` contains a populated classified Distro collection
- **WHEN** the All Store document renders
- **THEN** it shows one `Browse Distro formats` navigation landmark before the All card collection without Distro introduction copy or a standalone Distro item total
- **AND** each populated Distro group appears once in the same order and with the same current count as `/store/distro/`.

#### Scenario: All Store format link opens canonical Distro group

- **WHEN** a visitor activates an All Store Distro format link
- **THEN** it is a base-aware ordinary link to the matching `/store/distro/#distro-group-*` target
- **AND** it does not create an All-local duplicate group, filter state, tab state, or second Distro card projection.

#### Scenario: Distro group membership changes

- **WHEN** accepted Distro records enter, leave, or move between populated browse groups
- **THEN** All Store Distro counts and links follow the same server-derived group list when the next accepted content snapshot is rendered, including retained static builds
- **AND** no authored navigation count or duplicated catalog membership is required.

#### Scenario: JavaScript is unavailable on All Store

- **WHEN** a visitor follows an All Store Distro format link without client JavaScript
- **THEN** the ordinary link reaches the rendered canonical Store Distro group heading
- **AND** complete Distro browsing remains available.
