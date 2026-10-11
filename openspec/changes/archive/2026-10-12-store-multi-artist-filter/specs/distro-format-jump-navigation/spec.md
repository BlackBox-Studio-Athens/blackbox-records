## MODIFIED Requirements

### Requirement: Distro format navigation mirrors populated browse groups

Distro SHALL derive one Browse Distro formats navigation from the selected items' physical options, retaining existing format names, ordering, counts and fragment identities. Enhanced selection SHALL filter individual cards in the mixed catalog. Desktop and mobile SHALL use the same derived authority and expose All formats initially unless a valid format fragment selects otherwise.

#### Scenario: Populated groups are available

- **WHEN** Distro renders
- **THEN** All formats precedes one ordinary link and canonical count per populated format
- **AND** empty formats are omitted, and Top remains separately accessible.

#### Scenario: Vinyl size groups are populated

- **WHEN** accepted source groups include 7-inch and 10-inch vinyl
- **THEN** the choices, counts and legacy fragments remain distinct without separate catalog sections or changed physical types.

#### Scenario: Visitor opens Browse formats on a narrow viewport

- **WHEN** the viewport is narrower than `64rem`
- **THEN** `All formats` plus every populated format entry and count are visible as wrapping chips without opening a disclosure
- **AND** the current selection is exposed by the selected chip face, which has an ink border and a check mark, and by `aria-current`
- **AND** the chips wrap onto further rows when text size, zoom, or available width requires it
- **AND** no format requires horizontal scrolling, a hidden scrollbar, a clipped-edge inference, a swipe hint, or a custom carousel control
- **AND** the artist filter is a visible `Artists` chip in the Store toolbar that shows how many artists are ticked and opens the Artists sheet, with no native select or disclosure
- **AND** every format chip, the `Artists` chip and `Top` remain at least 44 CSS pixels high with visible focus.

#### Scenario: Navigation link targets a group

- **WHEN** an enhanced format link is activated
- **THEN** only matching cards remain visible in their canonical order
- **AND** the link exposes current selection, the catalog remains a valid focus/scroll target, and no card is recreated or moved.

#### Scenario: Route starts with a canonical group fragment

- **WHEN** a route connects with a rendered legacy format fragment
- **THEN** that format is selected before final focus/scroll, while invalid or malformed fragments fall back to All formats.

#### Scenario: Visitor restores all formats

- **WHEN** All formats is selected
- **THEN** the format restriction clears while artist and text filters retain their selections and canonical order.

#### Scenario: Visitor browses a deep group

- **WHEN** the visitor browses deep into the mixed catalog
- **THEN** the existing responsive browse pane retains its format choices and current selection without duplicate navigation or a new scroll observer.

#### Scenario: Visitor returns to the page top

- **WHEN** the visitor activates the existing Top link
- **THEN** ordinary anchor and shell navigation reach the Distro intro with the no-JavaScript fallback preserved.

#### Scenario: Catalog membership changes

- **WHEN** canonical entries enter, leave or change physical format
- **THEN** format choices and counts derive from the current complete collection without authored counts.

### Requirement: Distro format navigation remains progressive and search-safe

Format navigation SHALL remain ordinary fragment links without JavaScript and compose with artist and text filtering when enhanced. Transient selection SHALL reset on route cleanup and shell snapshot restoration without hiding the navigation or recreating cards.

#### Scenario: Client JavaScript is unavailable

- **WHEN** JavaScript is disabled
- **THEN** links reach their preserved fragment anchors at the mixed catalog start and every canonical item remains available.

#### Scenario: Distro search query is active

- **WHEN** text or artist filtering is active
- **THEN** the selected format remains active, matching is intersected, and format navigation stays accessible.

#### Scenario: Distro search clears or disconnects

- **WHEN** text is cleared
- **THEN** other active filters remain effective
- **AND WHEN** the route disconnects
- **THEN** transient format and visibility markers return to their server state.

#### Scenario: Shell snapshot is cached and restored

- **WHEN** the shell caches or restores Distro
- **THEN** existing sanitation removes transient selection and visibility state, ticked artists, the artist find query, pinned artist options and an open Artists sheet
- **AND** reconnection applies a valid current fragment or All formats, with usable focus even for zero matches.

#### Scenario: Visitor uses the keyboard

- **WHEN** a visitor tabs through format links and activates one with Enter
- **THEN** native link semantics, visible focus and current selection remain available without a custom menu or roving tabindex.
- **AND** the `Artists` chip opens the Artists sheet.

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
