## MODIFIED Requirements

### Requirement: Distro format navigation mirrors populated browse groups

The Store Distro category SHALL render one server-derived format-navigation landmark whose format controls, order, counts, and targets come from the same populated Distro-category browse groups as the catalog sections, plus `All formats` and one utility link back to the Store Distro intro. `Vinyl 10-inch` and `Vinyl 7-inch` SHALL be separate derived groups. With client JavaScript, the navigation SHALL expose one transient format selection and present only the selected group; a valid canonical group fragment at controller connection SHALL select that group once before the route controller performs the final scroll/focus. Without client JavaScript, the same format entries SHALL remain ordinary fragment links into the complete catalog. Desktop and mobile presentations SHALL use the same server-derived group authority.

#### Scenario: Populated groups are available

- **WHEN** `/store/distro/` renders its catalog
- **THEN** one navigation landmark named `Browse Distro formats` appears after the Store category navigation and before the catalog groups
- **AND** its active responsive presentation contains `All formats` followed by exactly one format entry for each populated derived browse group in the same order
- **AND** every format entry displays and exposes its group name and current Distro-category item count
- **AND** `All formats` is the default current selection when no valid initial group fragment is present
- **AND** one separately identified `Top` link targets the Store Distro intro and remains outside the artist filter
- **AND** empty groups produce neither a format entry nor a section
- **AND** desktop and mobile presentations derive from the same server-created group list while CSS exposes only one presentation to layout, assistive technology, and keyboard focus at a time.

#### Scenario: Vinyl size groups are populated

- **WHEN** current Distro entries populate both 7-inch and 10-inch vinyl classifications
- **THEN** navigation and catalog rendering expose separate `Vinyl 10-inch` and `Vinyl 7-inch` groups with their own counts, headings, fragments, and matching intro copy
- **AND** neither group contains items classified in the other size
- **AND** the complete catalog retains the same total membership and canonical item order.

#### Scenario: Visitor opens Browse formats on a narrow viewport

- **WHEN** the viewport is narrower than `64rem`
- **THEN** `All formats` plus every populated format entry and count are visible as wrapping chips without opening a disclosure
- **AND** the current selection is exposed by the selected chip face, which has an ink border and a check mark, and by `aria-current`
- **AND** the chips wrap onto further rows when text size, zoom, or available width requires it
- **AND** no format requires horizontal scrolling, a hidden scrollbar, a clipped-edge inference, a swipe hint, or a custom carousel control
- **AND** the artist filter is a visible `Artists` chip in the Store toolbar that shows how many artists are ticked and opens the Artists sheet, with no native select or disclosure
- **AND** every format chip, the `Artists` chip and `Top` remain at least 44 CSS pixels high with visible focus.

#### Scenario: Navigation link targets a group

- **WHEN** a visitor activates a populated format entry while the Distro enhancement is active
- **THEN** its fragment and app-shell target identify the same unique heading used by that group's labelled section
- **AND** only that format's labelled catalog section remains presented and reachable by keyboard or assistive technology
- **AND** its source order and current item count remain unchanged
- **AND** the selected format is exposed as current in both responsive navigation presentations
- **AND** one selection marker plus CSS removes non-selected groups from presentation without writing card, wrapper, or group `hidden` attributes
- **AND** the enhanced path applies selection before the route controller performs the final scroll/focus
- **AND** the target heading remains visible below the fixed site header
- **AND** no card or group is recreated, reordered, or moved to a second catalog.

#### Scenario: Route starts with a canonical group fragment

- **WHEN** a direct load, restored shell route, or Store All format link connects `/store/distro/` with a fragment matching a rendered group heading
- **THEN** the matching format becomes the initial current selection
- **AND** only its labelled catalog section is presented
- **AND** the route controller performs the final target scroll/focus after applying that selection
- **AND** the fragment is read once without a hash listener, query parameter, persisted selection, or later URL rewriting.

#### Scenario: Visitor restores all formats

- **WHEN** a visitor activates `All formats`
- **THEN** every populated group returns in its original server-derived order
- **AND** `All formats` becomes the exposed current selection
- **AND** each group follows the existing greater-than-six Coverflow threshold, so small groups return to compact grids.

#### Scenario: Visitor browses a deep group

- **WHEN** `All formats` is current and the visitor reaches a group far below the Store Distro intro
- **THEN** the desktop pane remains sticky directly below the fixed site header, while narrow viewports keep the chips in normal flow above the catalog
- **AND** the current selection and `Top` link remain available without a document scroll listener, active-section observer, pagination control, or duplicate navigation landmark.

#### Scenario: Visitor returns to the page top

- **WHEN** the visitor activates `Top`
- **THEN** its fragment and app-shell target identify the Store Distro intro
- **AND** ordinary anchor behavior remains the no-JavaScript fallback.

#### Scenario: Catalog membership changes

- **WHEN** classified Distro entries enter, leave, or move between populated browse groups
- **THEN** navigation counts, responsive format entries, and selectable groups follow the resulting server-derived group list without authored navigation data.

### Requirement: Distro format navigation remains progressive and search-safe

The Store Distro format navigation MUST remain usable without client JavaScript and MUST NOT expose stale selection or artist-filter state while client-side Distro search is active or after shell snapshot restoration. Distro search SHALL remain the sole writer of card, wrapper, and group `hidden` state.

#### Scenario: Client JavaScript is unavailable

- **WHEN** `/store/distro/` loads without the app shell or search control
- **THEN** the narrow-width format chips are visible without client behavior
- **AND** every visible format entry remains an ordinary fragment link to its rendered group heading
- **AND** `All formats` links to the complete catalog start
- **AND** the complete server-rendered Distro-category catalog remains available.

#### Scenario: Distro search query is active

- **WHEN** the normalized Store Distro search query becomes non-empty
- **THEN** any selected format is reset to `All formats` before matching begins
- **AND** the selection-owned route marker is removed before search writes result visibility
- **AND** the whole format-navigation landmark is hidden from presentation and keyboard focus
- **AND** search continues matching the complete Distro catalog without maintaining per-format result counts.

#### Scenario: Distro search clears or disconnects

- **WHEN** the query is cleared or the Store Distro search control cleans up on route exit
- **THEN** every group and the server-rendered format navigation are restored without recreating or reordering them
- **AND** `All formats` is current.

#### Scenario: Shell snapshot is cached and restored

- **WHEN** the app shell caches or restores `/store/distro/`
- **THEN** snapshot sanitation removes stale selected-format/current markers, ticked artists, the artist find query, pinned artist options and an open Artists sheet while existing search sanitation owns `hidden` restoration
- **AND** route reconnection selects the valid current group fragment or falls back to `All formats`
- **AND** a valid selected group receives its final target scroll/focus only after it is presented
- **AND** the restored route exposes the narrow chips or desktop pane appropriate to the current viewport.

#### Scenario: Visitor uses the keyboard

- **WHEN** a visitor tabs through the visible format navigation
- **THEN** Tab reaches each visible format entry and `Top`, Enter activates the focused entry, and the `Artists` chip opens the Artists sheet
- **AND** the current selection remains programmatically exposed
- **AND** no custom arrow-key model, carousel, scroll button, menu widget, or roving tabindex is required.

## ADDED Requirements

### Requirement: Store artist filter accepts several artists

Store All and Store Distro SHALL offer one artist filter built from the catalog's artist or label credits, in which a shopper may tick any number of artists. No ticked artist SHALL mean every artist. Results SHALL include an item when its credit matches any ticked artist and it also matches the active text, format and Pre-orders filters. The filter SHALL be server-rendered in its final box, disabled until the Store search enhancement is ready.

#### Scenario: Shopper ticks several artists on a wide viewport

- **WHEN** the viewport is at least `64rem` wide and the shopper ticks two artists in the `Artists` pane
- **THEN** each artist is a labelled native checkbox showing the artist and its item count, with no `All artists` choice
- **AND** the results and result count show only items credited to either ticked artist, in their existing order
- **AND** the ticked artists appear in their alphabetical order in a `Selected · 2` group above the scrolling list, with a `Clear` button that unticks only artists
- **AND** a checkbox that moves between the group and the list keeps keyboard focus
- **AND** unticking an artist returns it to its alphabetical position in the list.

#### Scenario: Shopper finds an artist

- **WHEN** the shopper types into `Find an artist`
- **THEN** only unticked artists whose normalized name contains the normalized text stay in the list
- **AND** ticked artists remain visible in the `Selected` group
- **AND** `No artist matches.` appears when no unticked artist matches
- **AND** the find text does not filter results.

#### Scenario: Shopper filters artists on a narrow viewport

- **WHEN** the viewport is narrower than `64rem`
- **THEN** the Store toolbar shows a 44px `Artists` chip, with `· N` and an ink edge while N artists are ticked, beside the Pre-orders chip and Clear filters
- **AND** at 375 CSS pixels and wider, the `Artists` chip, the Pre-orders chip and Clear filters share one row, and they wrap onto further rows only when text size, zoom or width requires it
- **AND** activating `Artists` opens a modal bottom sheet labelled `Artists` holding the same checkbox list, find box and `Selected` group, while the page behind does not scroll
- **AND** the sheet's `Show N items` button names the current result count, and it, `Close` and Escape close the sheet and return focus to the `Artists` chip
- **AND** an open sheet closes when the viewport reaches `64rem`.

#### Scenario: Shopper clears filters

- **WHEN** any of text, artist or Pre-orders filtering is active
- **THEN** a `Clear filters` text button appears in the toolbar in bold 16px Inter with a 2px underline and a leading × mark, at least 44px high
- **AND** activating it clears the query, every ticked artist, the Pre-orders filter and the format selection, and focuses the search box.
