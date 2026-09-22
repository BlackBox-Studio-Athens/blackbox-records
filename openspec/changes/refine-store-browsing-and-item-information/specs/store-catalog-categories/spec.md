# Spec Delta

## MODIFIED Requirements

### Requirement: Store orientation panels serve each collection without repeated information

The Store SHALL present compact category orientation and browse controls with one source-derived result total in Grid and filtered views, preserving category metadata and existing format destinations without a second shelf headline or repeated count.

#### Scenario: All presents one concise shelf ledger

- **WHEN** a populated All collection renders
- **THEN** its existing Store / All identity and category navigation orient the shopper
- **AND** Search Store, Artists, one result total, and eligible view controls precede the cards
- **AND** Browse Distro formats retains its source-derived canonical links within the responsive browse area
- **AND** the page omits the duplicate shelf-purpose headline, Distro introduction, and separate Distro subtotal.

#### Scenario: BlackBox Releases presents direct label context compactly

- **WHEN** BlackBox Releases renders
- **THEN** its existing category identity, useful category description, browse controls, and one result total identify the shelf
- **AND** the compact composition preserves category metadata, membership, and item order.

#### Scenario: Distro presents its browse tools as one compact orientation panel

- **WHEN** Distro renders
- **THEN** its existing category identity, useful description, search, artist choices, and one result total identify the shelf
- **AND** Distro's format tools use the same responsive browse area
- **AND** active filters update the one accessible result count and clearing action without repeating the complete catalogue total.

#### Scenario: Another non-Distro category renders

- **WHEN** populated Merch or another non-Distro category renders
- **THEN** it uses its own category identity, useful description, browse controls, and one result total
- **AND** it does not inherit BlackBox-specific description or identity.

#### Scenario: Orientation panels reflow

- **WHEN** a Store collection renders below the desktop browse-pane width, at 200% text size, or at the 320px CSS viewport equivalent
- **THEN** controls reflow in document order, with native disclosure for the browse pane and no clipped text or two-dimensional scrolling
- **AND** interactive targets remain at least 44 CSS pixels high.

#### Scenario: Orientation remains server-rendered

- **WHEN** JavaScript is unavailable
- **THEN** the category identity, complete collection total, category links, format links, and full catalogue remain available
- **AND** inert search, artist-selection, and Coverflow controls are not presented.

### Requirement: All Store provides one complete bounded Coverflow

Every flat Store collection route rendered through `StoreCollectionPage` SHALL optionally enhance its complete canonical collection into one bounded Store Coverflow only after explicit visitor selection when it contains more than six canonical Store Items, without changing collection authority, order, identity, availability authority, or full-catalog access. This includes All, BlackBox Releases, populated Merch, and future non-Distro flat categories; Distro remains grouped under its own grouped-category contract.

#### Scenario: All collection is eligible

- **WHEN** `/store/` contains more than six canonical Store Items, platform support is available, no text or artist filter is active, and the visitor chooses Coverflow
- **THEN** one Coverflow enters `preview` mode with every All Store Item reachable in the existing deterministic All order
- **AND** the previously selected Store Item starts active, or the first canonical item when no prior selection exists
- **AND** at most six existing `StoreItemCard` nodes receive stage positions while every other card leaves presentation, focus order, and the accessibility tree
- **AND** the preview exposes the source-derived total, current position, remaining count, active Store Item identity, continuation ratio, Previous, Next, and `Grid`
- **AND** the Store Item availability badge is absent from every positioned preview cover so artwork and active identity remain the preview focus.

#### Scenario: Flat collection categories share one eligibility rule

- **WHEN** All, BlackBox Releases, populated Merch, or a future non-Distro flat category rendered through `StoreCollectionPage` contains more than six canonical Store Items, platform support is available, no text or artist filter is active, and the visitor chooses Coverflow
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

- **WHEN** the visitor activates `Grid`
- **THEN** the same server-rendered All `StoreItemCard` nodes appear exactly once in their existing catalog order
- **AND** each card's existing availability presentation is restored unchanged from its canonical Store collection data
- **AND** the selected Store Item receives focus and remains identifiable
- **AND** the view controls remain ordered `Grid`, `Coverflow`, with Grid selected
- **AND WHEN** the visitor activates `Coverflow`
- **THEN** the selected Store Item returns as the active cover and preview availability badges are hidden again.

#### Scenario: All enhancement is unavailable

- **WHEN** All contains six or fewer items, JavaScript is disabled, required 3D CSS support is unavailable, or controller mounting fails
- **THEN** every canonical All Store Item remains visible exactly once as an ordinary Store listing card with its existing availability presentation
- **AND** no nonfunctional Coverflow controls or alternate collection order appears.

#### Scenario: All route enters through the app shell

- **WHEN** the persistent app shell loads or restores `/store/`
- **THEN** the All controller mounts against the swapped canonical card nodes for that shell pathname
- **AND** cached runtime state has been sanitized to the deterministic complete initial Grid
- **AND** ordinary card availability is visible until the visitor explicitly chooses Coverflow
- **AND** All retains its existing Store-wide search and gains artist selection without Distro-local format grouping or a second visibility owner.

#### Scenario: Flat category app-shell activation is generic

- **WHEN** the app shell loads or restores an eligible flat Store category
- **THEN** the shared controller mounts once after Store HTML application has supplied the canonical card nodes, without waiting for transition-veil closure or listing prices
- **AND** the active category receives one controller mount and no category-specific state engine.

#### Scenario: All Store performance remains catalog-owned

- **WHEN** any flat Store Coverflow enhances, changes its active item, or applies the preview-only availability treatment
- **THEN** it reuses the existing Store listing-price projection, card images, canonical links, availability data, and lazy-loading behavior
- **AND** it adds no backend request, per-item price request, commerce projection, content entry, duplicate card node, or eager load for every offstage image.

#### Scenario: A Store collection first renders

- **WHEN** a flat Store collection loads directly, becomes active through the shell, or is restored
- **THEN** its complete canonical Grid is visible before and after enhancement
- **AND** functional view controls appear in Grid then Coverflow order only when eligible and ready
- **AND** applying a text or artist filter uses Grid; clearing it does not automatically restore Coverflow.

### Requirement: Distro browse-group introductions use restrained editorial typography

The Store Distro category SHALL render each populated browse-group introduction with the Store body font family, readable sentence casing, and compact spacing. Store orientation descriptions and item-detail summaries MUST remain on the body font; compact listing cards omit description paragraphs.

#### Scenario: Distro group introduction renders

- **WHEN** `/store/distro/` renders an authored introduction beneath a populated browse-group heading
- **THEN** the introduction uses the same body font as Store prose
- **AND** it gains no uppercase transformation or label-style letter spacing.

#### Scenario: Distro orientation and item summaries render

- **WHEN** the Distro orientation description or the source summary on a Distro item detail renders
- **THEN** that copy retains the body font
- **AND** no separate monospace accent competes with catalogue identities or controls.

#### Scenario: Distro introduction reflows

- **WHEN** a visitor views a Distro browse-group introduction at 320 or 390 CSS pixels
- **THEN** the introduction wraps within the viewport without clipping or horizontal page scrolling
- **AND** the surrounding group title and controls retain their existing hierarchy.

## ADDED Requirements

### Requirement: Store grids use compact responsive product presentation

Store collections SHALL use available desktop width for browse tools and a four-column catalogue while preserving outer gutters, complete product identity, and the existing BlackBox visual language.

#### Scenario: Desktop shopper opens the Store

- **WHEN** the viewport is at least 1280 CSS pixels wide at default text size
- **THEN** a compact left browse pane and four product columns fit inside the Store content area
- **AND** the unfiltered All view at 1366 by 768 pixels begins its first artwork row within the initial viewport when no overlay is open
- **AND** row height remains content-driven; long titles and larger text are not truncated to keep every price above the fold
- **AND** populated Distro grids flow continuously rather than restarting after every six cards.

#### Scenario: A card renders

- **WHEN** a Store card is shown in Grid or filtered results
- **THEN** it presents complete square-framed artwork, title, artist or label, the actual selected physical option or known format, price, and availability
- **AND** it omits description paragraphs and redundant Price or category labels
- **AND** a release's other editorial formats are not advertised as selectable selling options
- **AND** its ordinary canonical item link and existing accessible identity remain intact.

#### Scenario: Narrow or enlarged presentation

- **WHEN** the viewport narrows or text is enlarged
- **THEN** the pane becomes a labelled native disclosure and the grid reduces to three, two, or one column as space requires
- **AND** at 320 CSS pixels all content fits without horizontal page scrolling, clipped identity, or reduced functional touch targets
- **AND** long names wrap without forced equal-height truncation.

### Requirement: Store typography uses clear title and reading roles

Store collection and item-detail content SHALL use the existing brand title face for public titles and the existing body sans face for controls, prices, artist credits, metadata, prose, and tracklists.

#### Scenario: Shopper scans the Store

- **WHEN** a collection or item-detail page renders
- **THEN** titles retain the BlackBox brand face and repeated information shares the body face
- **AND** metadata and prices introduce no additional display or monospace family
- **AND** the shared primary-section H1 typography and non-Store surfaces retain their existing contracts.

### Requirement: Store artist selection uses existing catalogue credits

Each populated Store category SHALL offer a single artist selection derived from that category's existing Release artist names and Distro artist-or-label credits, with All artists as the default.

#### Scenario: Artist choices render

- **WHEN** enhanced Store browse controls become ready
- **THEN** choices are alphabetical, have source-derived category item counts, and merge equivalent case, whitespace, and Unicode spellings
- **AND** complete collaboration or label credits remain intact without inferred roster membership, aliases, or split identities
- **AND** catalogue credit meaning is explained beside the Artists control when needed.

#### Scenario: Shopper combines filters

- **WHEN** an artist, search query, or Distro format is selected
- **THEN** visible items satisfy all active selections while retaining canonical order
- **AND** controls remain available with one accessible result count and a clear zero-result state
- **AND** Clear search clears only the query, All artists clears only the artist, All formats clears only the format, and Clear filters clears all three.

#### Scenario: Shopper changes category or revisits

- **WHEN** a category is newly loaded or reactivated through the shell
- **THEN** it starts in Grid with empty text and All artists
- **AND** Distro retains its existing valid initial-format-fragment behavior
- **AND** no persisted artist preference or additional catalogue/filter request is required.

#### Scenario: Artist controls are unavailable

- **WHEN** JavaScript or browse enhancement is unavailable
- **THEN** every canonical card remains visible and reachable
- **AND** there is no nonfunctional artist control.
