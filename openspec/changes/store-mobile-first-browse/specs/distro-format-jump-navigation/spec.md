## MODIFIED Requirements

### Requirement: Distro format navigation mirrors populated browse groups

Distro SHALL retain its existing Browse Distro formats links, names, ordering, counts and fragment identities. Enhanced selection SHALL retain its existing Distro-card filtering behavior. Phones SHALL place these links inside the unified Filter sheet; desktop SHALL place them in a Formats popover. Relocation SHALL NOT change their data or destinations.

#### Scenario: Populated groups are available

- **WHEN** Distro format navigation renders
- **THEN** All formats precedes the existing ordinary link and Distro count for each populated format
- **AND** empty formats remain omitted and existing Top navigation stays reachable.

#### Scenario: Vinyl size groups are populated

- **WHEN** accepted source groups include 7-inch and 10-inch vinyl
- **THEN** choices, counts and legacy fragments remain distinct without separate catalog sections or changed physical types.

#### Scenario: Visitor opens Browse formats on a narrow viewport

- **WHEN** the viewport is below 64rem and Filter is opened
- **THEN** all existing format links/counts appear inside that one bottom sheet with 44px targets and visible focus
- **AND** current format remains exposed with the existing selected treatment and aria-current
- **AND** Artists uses the same sheet, without outside wrapping format rows or a separate phone Artists trigger.

#### Scenario: Navigation link targets a group

- **WHEN** an enhanced Distro format link is activated
- **THEN** the existing matching cards remain visible in canonical order without recreation or reordering
- **AND** the catalog remains a valid focus/scroll target.

#### Scenario: Route starts with a canonical group fragment

- **WHEN** Distro connects with a rendered legacy format fragment
- **THEN** the existing format is selected before final focus/scroll
- **AND** invalid or malformed fragments fall back to All formats.

#### Scenario: Visitor restores all formats

- **WHEN** All formats is selected
- **THEN** its existing format restriction clears while artist and text selections retain their behavior and canonical order.

#### Scenario: Visitor browses a deep group

- **WHEN** the visitor browses deep into Distro
- **THEN** the toolbar's Filter or Formats control exposes the existing choices and current selection without a side pane, duplicate active navigation or new scroll observer.

#### Scenario: Visitor returns to the page top

- **WHEN** the existing Top link is activated from the relocated links
- **THEN** ordinary anchor and shell navigation retain a valid Distro top target without restoring the visible Store introduction
- **AND** the no-JavaScript fallback remains usable.

#### Scenario: Catalog membership changes

- **WHEN** accepted Distro entries change
- **THEN** the existing Distro derivation supplies updated format links/counts
- **AND** All, BlackBox Releases and Merch do not introduce their own format totals.

### Requirement: Distro format navigation remains progressive and search-safe

Format navigation SHALL retain ordinary fragment links without JavaScript and its existing artist/text composition when enhanced. Phones and desktop SHALL preserve a reachable server-rendered fallback when the sheet or popover is unavailable. Existing route and snapshot cleanup SHALL remove transient state without hiding those links.

#### Scenario: Client JavaScript is unavailable

- **WHEN** JavaScript is disabled
- **THEN** the format links remain reachable in visible markup or a native disclosure
- **AND** their preserved fragments reach the mixed Distro catalog start with every canonical item available.

#### Scenario: Distro search query is active

- **WHEN** text or artist filtering is active
- **THEN** the selected format retains its existing intersection behavior
- **AND** the relocated format navigation stays accessible.

#### Scenario: Distro search clears or disconnects

- **WHEN** text is cleared
- **THEN** other filters remain effective
- **AND WHEN** the route disconnects
- **THEN** transient format and visibility return to the existing server state.

#### Scenario: Shell snapshot is cached and restored

- **WHEN** the shell caches or restores Distro
- **THEN** existing sanitation removes selection, visibility, ticked artists, artist find text, pinned entries and open sheets/popovers
- **AND** reconnection retains valid-fragment or All formats behavior with usable focus even for zero matches.

#### Scenario: Visitor uses the keyboard

- **WHEN** a visitor tabs to the format links and activates one with Enter
- **THEN** native link semantics, visible focus and current selection remain available
- **AND** Artists is reachable within the shared phone sheet or desktop Artists popover.

### Requirement: All Store exposes Distro format discovery

All Store SHALL retain the existing Distro format ledger's names, Distro counts and base-aware fragment destinations. Only placement SHALL change to the phone Filter sheet or desktop Formats popover; selection SHALL NOT become an All-specific facet or change All's catalogue order.

#### Scenario: All Store renders Distro discovery

- **WHEN** All renders a populated Distro collection
- **THEN** the existing Distro links/counts appear in the shared sheet or popover without a duplicate Distro introduction, subtotal or data derivation.

#### Scenario: All Store format link opens canonical Distro group

- **WHEN** an All Store format link is activated
- **THEN** it opens the existing base-aware Distro format fragment
- **AND** the destination retains its existing enhanced Distro filtering behavior.

#### Scenario: Distro group membership changes

- **WHEN** accepted Distro membership changes
- **THEN** All and Distro continue to share the existing Distro-derived counts and links without authored or category-wide replacement totals.

#### Scenario: JavaScript is unavailable on All Store

- **WHEN** All is opened without JavaScript and a format link is followed
- **THEN** the link remains reachable through the fallback and reaches the complete mixed Distro catalog at its canonical fragment.

### Requirement: Store artist filter accepts several artists

The existing multi-artist filter SHALL retain its source credits, counts, matching and selection behavior. Desktop SHALL place it in the Artists popover; phones SHALL place it in the unified Filter sheet. The existing find field and selected group SHALL remain available without a second phone sheet or new data derivation.

#### Scenario: Shopper ticks several artists on a wide viewport

- **WHEN** a shopper opens the Artists popover at 64rem or wider and ticks two artists
- **THEN** native labelled checkboxes show the existing credits/counts, with no All artists choice
- **AND** results match either artist plus the other active restrictions in their existing catalogue order
- **AND** selected entries remain alphabetically pinned under Selected · 2 with artists-only Clear, moved checkboxes keep focus, and unticking restores their alphabetical option position.

#### Scenario: Shopper finds an artist

- **WHEN** Find an artist receives text
- **THEN** it narrows unticked option names only, keeping selected entries pinned
- **AND** No artist matches. appears for an empty option match
- **AND** the find query does not filter catalog results.

#### Scenario: Shopper filters artists on a narrow viewport

- **WHEN** the viewport is below 64rem
- **THEN** Artists appears inside the single Filter sheet beside existing Formats, Pre-orders and View
- **AND** the background page does not scroll
- **AND** Show N items, Close, Escape and Back close the sheet and restore Filter focus, with Forward restoring available state
- **AND** the sheet closes when the desktop arrangement takes over.

#### Scenario: Shopper clears filters

- **WHEN** an existing filter is active
- **THEN** Clear filters remains a 44px text action with visible focus in the shared controls
- **AND** it retains its existing clearing and search-focus behavior
- **AND** enhancement readiness and failure do not leave usable-looking dead artist controls.
