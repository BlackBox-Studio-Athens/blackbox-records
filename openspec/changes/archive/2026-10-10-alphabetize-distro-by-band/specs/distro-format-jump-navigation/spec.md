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

- **WHEN** Distro renders on a phone
- **THEN** existing wrapping format links remain visible outside the Artist disclosure, with complete labels, counts, keyboard focus and no horizontal scrolling.

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
- **THEN** existing sanitation removes transient selection and visibility state
- **AND** reconnection applies a valid current fragment or All formats, with usable focus even for zero matches.

#### Scenario: Visitor uses the keyboard

- **WHEN** a visitor tabs through format links and activates one with Enter
- **THEN** native link semantics, visible focus and current selection remain available without a custom menu or roving tabindex.

### Requirement: All Store exposes Distro format discovery

All Store SHALL retain its compact Distro format ledger, using the same names, counts and fragment targets as Distro, including canonical BlackBox Store items without a duplicate catalog or subtotal.

#### Scenario: All Store renders Distro discovery

- **WHEN** All renders a populated Distro collection
- **THEN** one Browse Distro formats landmark precedes the All cards with matching Distro counts and no repeated Distro introduction or subtotal.

#### Scenario: All Store format link opens canonical Distro group

- **WHEN** an All Store format link is activated
- **THEN** its base-aware ordinary destination is the existing Distro format fragment, whose enhanced view filters the mixed catalog.

#### Scenario: Distro group membership changes

- **WHEN** accepted Store items enter, leave or change physical formats
- **THEN** both pages derive matching counts and links on their next render without authored counts.

#### Scenario: JavaScript is unavailable on All Store

- **WHEN** an All Store format link is followed without JavaScript
- **THEN** its fragment reaches the complete mixed Distro catalog.
