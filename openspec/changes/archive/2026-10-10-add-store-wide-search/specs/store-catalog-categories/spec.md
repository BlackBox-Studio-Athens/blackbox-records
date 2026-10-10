## MODIFIED Requirements

### Requirement: All Store provides one complete bounded Coverflow

Every flat Store collection route rendered through `StoreCollectionPage` SHALL optionally enhance its complete canonical collection into one bounded Store Coverflow when it contains more than six canonical Store Items, without changing collection authority, order, identity, availability authority, or full-catalog access. This includes All, BlackBox Releases, populated Merch, and future non-Distro flat categories; Distro remains grouped under its own grouped-category contract. All Store search SHALL use the same canonical cards and shared search-results state while a query is active.

#### Scenario: All collection is eligible

- **WHEN** `/store/` contains more than six canonical Store Items, no search query is active, and Store Coverflow platform support is available
- **THEN** one Coverflow enters `preview` mode on initial activation with every All Store Item reachable in the existing deterministic All order
- **AND** the first canonical Store Item starts active
- **AND** at most six existing `StoreItemCard` nodes receive stage positions while every other card leaves presentation, focus order, and the accessibility tree
- **AND** the preview exposes one source-derived current-position/total indicator, active Store Item identity, continuation ratio, Previous, Next, and `View all {total}`, without separate total/current/remaining metric blocks
- **AND** the Store Item availability badge is absent from every positioned preview cover so artwork and active identity remain the preview focus.

#### Scenario: Flat collection categories share one eligibility rule

- **WHEN** All, BlackBox Releases, populated Merch, or a future non-Distro flat category rendered through `StoreCollectionPage` contains more than six canonical Store Items and Store Coverflow platform support is available
- **THEN** the same shared Store Coverflow controller and lifecycle enters `preview` mode on initial activation in that category's existing deterministic order
- **AND** no per-category controller branch, duplicate card graph, alternate collection query, or second Store Item projection is introduced
- **AND WHEN** the flat collection contains six or fewer canonical Store Items
- **THEN** it remains the complete ordinary grid with no Coverflow controls, with All search still available when its enhancement initializes.

#### Scenario: Visitor traverses All

- **WHEN** the visitor uses Previous, Next, a positioned side cover, focus, a qualifying touch swipe, handled wheel input, or focus-scoped Left Arrow or Right Arrow input in preview mode
- **THEN** the active item changes within the same complete canonical All sequence and wraps at both ends
- **AND** sustained wheel or repeated arrow input can continue through more than one item under the shared Store Coverflow interaction contract
- **AND** no curated subset, random order, duplicate six-card window, or second Store Item projection is used.

#### Scenario: Every flat category shares the interaction contract

- **WHEN** a visitor traverses an eligible flat Store category in preview mode
- **THEN** wheel cadence, focus-scoped Left Arrow and Right Arrow behavior, hover/focus cue, disclosure behavior, reduced-motion contract, progressive fallback, and cleanup match every other Store Coverflow
- **AND** editorial Releases and Store Item detail routes remain outside Coverflow.

#### Scenario: Visitor opens the complete All catalog

- **WHEN** the visitor activates `View all {total}`
- **THEN** the same server-rendered All `StoreItemCard` nodes appear exactly once in their existing catalog order
- **AND** each card's existing availability presentation is restored unchanged from its canonical Store collection data
- **AND** the selected Store Item receives focus and remains identifiable
- **AND** the control becomes `Show Coverflow`
- **AND WHEN** the visitor activates `Show Coverflow` with no active search query
- **THEN** the selected Store Item returns as the active cover and preview availability badges are hidden again.

#### Scenario: All enhancement is unavailable

- **WHEN** no search query is active and any of these conditions holds: All contains six or fewer items, JavaScript is disabled, required 3D CSS support is unavailable, or controller mounting fails
- **THEN** every canonical All Store Item remains visible exactly once as an ordinary Store listing card with its existing availability presentation
- **AND** no nonfunctional Coverflow controls or alternate collection order appears
- **AND** unsupported 3D presentation does not prevent an independently initialized search from filtering the ordinary grid.

#### Scenario: All route enters through the app shell

- **WHEN** the persistent app shell loads or restores `/store/`
- **THEN** the All controller mounts against the swapped canonical card nodes for that shell pathname
- **AND** cached runtime state has been sanitized to the deterministic initial preview where eligible
- **AND** preview-only badge suppression follows the restored `preview` mode rather than stale card state
- **AND** the All-scoped search starts with an empty query without inheriting Distro format grouping, selection, or hidden state.

#### Scenario: Flat category app-shell activation is generic

- **WHEN** the app shell loads or restores an eligible flat Store category
- **THEN** the shared controller mounts as soon as the active route's canonical card nodes have been applied, without waiting for transition-veil closure or listing-price presentation
- **AND** the active category receives one controller mount and no category-specific state engine.

#### Scenario: All Store performance remains catalog-owned

- **WHEN** any flat Store Coverflow enhances, changes its active item, or applies the preview-only availability treatment
- **THEN** it reuses the existing Store listing-price projection, card images, canonical links, availability data, and lazy-loading behavior
- **AND** it adds no backend request, per-item price request, commerce projection, content entry, duplicate card node, or eager load for every offstage image.

#### Scenario: All search reveals matching cards

- **WHEN** a nonempty query activates All Store search
- **THEN** matching canonical cards appear in their original order through the shared search-results behavior
- **AND** preview controls do not hide results or move focus out of the search input
- **AND WHEN** the shopper clears that query
- **THEN** the complete catalog is restored with the existing availability presentation and explicit Show Coverflow behavior where supported.

### Requirement: Store orientation panels serve each collection without repeated information

The Store SHALL present source-derived, purpose-specific orientation panels for All, BlackBox Releases, and Distro while retaining one safe generic presentation for other non-Distro categories. All orientation SHALL prioritize early record visibility and shared search without repeating catalog metrics.

#### Scenario: All presents one concise shelf ledger

- **WHEN** `/store/` renders a populated All collection
- **THEN** a shortened shelf-purpose introduction and Search Store sit next to the shelf, with one compact Browse Distro formats handoff containing ordinary canonical fragment links and source-derived format counts
- **AND** the active Signal rail identifies All without another All heading inside the panel
- **AND** preview shows one current-position/total indicator, complete catalog shows one total, and active search shows one matching-results count
- **AND** the introduction does not repeat that count or add separate On this shelf, Now viewing, More, or Distro-subtotal metrics
- **AND** the descriptive `View all {total}` action may retain its total without adding another status announcement.

#### Scenario: All opens at the reviewed desktop or mobile size

- **WHEN** a populated All route has settled at scrollY=0, default text size, and a 390x844 or 1280x800 CSS-pixel viewport
- **THEN** identifiable artwork from at least the first Store Item is visible in the initial viewport
- **AND** the layout retains category navigation, search, policy links, and any configured UAT review marker
- **AND** it does not achieve this through text clipping, reduced readable type, undersized controls, or eager loading of every offstage image.

#### Scenario: BlackBox Releases presents direct label context compactly

- **WHEN** `/store/blackbox-releases/` renders a populated collection
- **THEN** the panel presents `Store shelf`, the `BlackBox Releases` category label, its existing category description, and one source-derived collection total
- **AND** it uses a compact purpose-specific composition without changing category metadata, membership, or Store Item order.

#### Scenario: Distro presents its browse tools as one compact orientation panel

- **WHEN** `/store/distro/` renders a populated collection
- **THEN** the panel presents `Store shelf`, the existing Distro title and description, and one source-derived collection total
- **AND** the existing search slot belongs to the same square-edged composition without changing search matching, result membership, or query ownership
- **AND** an idle search does not repeat the complete total or visible-item count
- **AND WHEN** a search query is active
- **THEN** the visible-result count and Clear search action remain available
- **AND** the separate Browse formats navigation retains its source-derived links, counts, sticky behavior, and Top action.

#### Scenario: Another non-Distro category renders

- **WHEN** a populated non-Distro category other than All or BlackBox Releases renders
- **THEN** it receives a complete generic orientation panel using its own label, description, and source-derived total
- **AND** it does not inherit BlackBox-specific copy or layout assumptions.

#### Scenario: Orientation panels reflow

- **WHEN** any purpose-specific panel renders at 320 CSS pixels, 200% text size, or the 400% zoom equivalent
- **THEN** its content follows document order with content-driven height and no clipped or truncated text
- **AND** every format destination remains an ordinary link with a target at least 44 CSS pixels high, including inside any native mobile disclosure
- **AND** the page does not require two-dimensional scrolling
- **AND** enlarged-text layouts may scroll vertically without forcing the default-size first-viewport artwork target.

#### Scenario: Orientation remains server-rendered

- **WHEN** All Store loads or is restored through shell navigation
- **THEN** Browse Distro formats starts expanded and remains a native disclosure the shopper can collapse.

- **WHEN** JavaScript is unavailable
- **THEN** the same panel labels, source-derived totals, format links, and category descriptions remain available in the complete static document where applicable
- **AND** the compact All format handoff remains usable, with one static catalog total and no nonfunctional search control
- **AND** orientation adds no separate client state, runtime request, content field, or commerce authority beyond the shared search/Coverflow enhancement already specified by this change.
