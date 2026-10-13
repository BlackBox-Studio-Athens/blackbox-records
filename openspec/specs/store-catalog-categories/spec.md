# store-catalog-categories Specification

## Purpose

Defines Store collection categories, canonical shopping destinations, conditional Merch discovery, and accessible navigation while preserving catalog identity and commerce authority.

## Requirements

### Requirement: Primary navigation separates editorial releases from shopping

The site SHALL expose `Artists`, `Releases`, `Store`, `Services`, and `Who we are` as its visible primary sections in that exact order, with Store as the only current catalog-shopping section.

#### Scenario: Primary navigation renders

- **WHEN** the desktop header or mobile navigation renders
- **THEN** its visible section links are `Artists · Releases · Store · Services · Who we are` in that order
- **AND** Distro is not exposed as a primary section.

#### Scenario: Footer section navigation renders

- **WHEN** footer section links render
- **THEN** they use the same five-section order
- **AND** no Distro footer link recreates the retired standalone section.

#### Scenario: Visitor opens Releases

- **WHEN** the visitor opens Releases
- **THEN** the route remains the editorial BlackBox discography with Release detail and listening behavior
- **AND** Store Item purchase discovery remains under Store.

#### Scenario: Visitor opens Who we are

- **WHEN** the visitor directly loads or navigates to `/about/`
- **THEN** its public section label, browser page-title component and shell transition label are `Who we are`
- **AND** the active navigation link remains associated with `/about/`
- **AND** the existing The Label heading and editorial content remain unchanged.

### Requirement: Store categories have exact labels, order, and routes

The Store SHALL expose `All`, `BlackBox Releases`, and `Distro` as its always-discoverable category navigation in that exact order, and SHALL append `Merch` only when the classified Merch collection is populated.

#### Scenario: Store category navigation renders

- **WHEN** any always-discoverable Store collection route renders
- **THEN** its navigation landmark named `Store categories` contains `All`, `BlackBox Releases`, and `Distro` links in that exact order
- **AND** it appends `Merch` only when one or more canonical Store Items are classified as `Merch`
- **AND** the current route's link exposes `aria-current="page"`.

#### Scenario: Store category navigation renders without merch

- **GIVEN** no canonical Store Item is classified as `Merch`
- **WHEN** an always-discoverable Store collection route renders
- **THEN** its navigation landmark named `Store categories` contains ordinary links to `/store/`, `/store/blackbox-releases/`, and `/store/distro/` in that order
- **AND** it does not render a `Merch` link, zero count, or empty-shelf promise.

#### Scenario: Store category navigation renders with merch

- **GIVEN** one or more canonical Store Items are classified as `Merch`
- **WHEN** a Store collection route renders
- **THEN** its navigation landmark named `Store categories` contains `All`, `BlackBox Releases`, `Distro`, and `Merch` links in that order
- **AND** the current route's link exposes `aria-current="page"`.

#### Scenario: JavaScript is unavailable

- **WHEN** a visitor loads or follows a discoverable Store category link without client JavaScript
- **THEN** the destination is a complete static document for that category
- **AND** category access does not depend on tab state, query filtering, hash filtering, or a client-side list reconstruction.

#### Scenario: Category route metadata renders

- **WHEN** a Store category document is built
- **THEN** it has category-specific title, description, heading, item count, and self-canonical URL
- **AND** `/store/`, `/store/blackbox-releases/`, and `/store/distro/` are eligible for the static sitemap
- **AND** `/store/merch/` is eligible only while its classified collection is populated.

### Requirement: Store category membership is faceted and presentation-only

The system MUST derive deterministic Store Category memberships for each canonical Store Item without changing commerce source identity or authority, while deduplicating every selected view.

#### Scenario: Release-sourced Store Item is classified

- **WHEN** a canonical release-sourced Store Item is classified
- **THEN** it belongs to both BlackBox Releases and Distro, using the same source, slug and commerce identity.

#### Scenario: Clothes Store Item is classified

- **WHEN** a distro-sourced Store Item has exact accepted group Clothes
- **THEN** it belongs to Distro and Merch without changing its exact physical type or source identity.

#### Scenario: Remaining Distro Store Item is classified

- **WHEN** a distro-sourced Store Item is not Clothes
- **THEN** it belongs to Distro.

#### Scenario: All collection is derived

- **WHEN** All is prepared
- **THEN** each canonical Store Item appears exactly once and has at least one named category membership
- **AND** overlapping named memberships do not duplicate an item within any collection.

#### Scenario: Category authority is inspected

- **WHEN** category membership is derived or serialized
- **THEN** it remains frontend presentation data and does not become a commerce source kind, D1 field, Worker API, offer, Stripe field, checkout payload, cart identity or stock authority.

### Requirement: Store category pages render honest collection states

Each discoverable Store category route SHALL render its canonical Store Items once and preserve ordinary Store Item navigation, existing editorial exclusions and authoritative availability.

#### Scenario: All or BlackBox Releases renders items

- **WHEN** All or BlackBox Releases renders
- **THEN** each selected item appears once and links to its canonical Store Item detail route.

#### Scenario: One Store Item has multiple category memberships

- **WHEN** a Store Item belongs to multiple named categories
- **THEN** it appears once in each selected collection and once in All
- **AND** no additional offer, stock record, checkout identity or Store Item is created.

#### Scenario: Distro category renders items

- **WHEN** Distro renders
- **THEN** canonical distro-sourced and release-sourced Store Items share one mixed-format ordered catalog
- **AND** older BlackBox releases remain alphabetically discoverable
- **AND** Clothes membership does not remove an item from Distro
- **AND** search, optional format filtering, the explicit-choice Store Crate and complete no-JavaScript access remain available.

#### Scenario: Merch category is empty

- **WHEN** no canonical Merch items exist and a visitor opens Merch
- **THEN** the route replaces its location with base-aware Store All and supplies the existing meta-refresh fallback and ordinary Store link without an empty shelf or commerce placeholder.

#### Scenario: Merch becomes populated

- **WHEN** accepted content creates canonical Merch membership
- **THEN** the route, category navigation and sitemap derive it without authored counts and without the empty-route redirect.

### Requirement: Legacy Distro URL resolves to the Store category

The static site MUST retain `/distro/` only as a compatibility redirect to `/store/distro/`.

#### Scenario: Visitor opens a legacy Distro URL

- **WHEN** a direct load reaches `/distro/`
- **THEN** the static redirect document replaces the location with the base-aware `/store/distro/` URL
- **AND** it provides a meta-refresh fallback, canonical target, and visible ordinary link.

#### Scenario: Visitor opens a legacy Distro format fragment

- **GIVEN** the incoming URL is `/distro/#distro-group-{format}` or the legacy Distro intro fragment
- **WHEN** JavaScript performs the compatibility replacement
- **THEN** the destination is `/store/distro/` with the same fragment
- **AND** the Store Distro document retains the matching target ID
- **AND** the canonical URL remains fragment-free.

#### Scenario: JavaScript is unavailable for a legacy fragment

- **WHEN** the static meta-refresh fallback handles a legacy Distro URL with a fragment
- **THEN** the visitor reaches the Store Distro category even if the incoming fragment cannot be appended
- **AND** the visible fallback link remains usable.

#### Scenario: Navigation and discovery surfaces are generated

- **WHEN** primary/footer navigation, shell section matching, or the sitemap is generated
- **THEN** `/distro/` is absent as a current section or indexable catalog route
- **AND** `/store/distro/` is the canonical Distro shopping destination.

### Requirement: Store category path segments cannot become Store Items

The system MUST reserve Store collection and checkout path segments against canonical Store Item slug projection.

#### Scenario: Store Item claims a reserved segment

- **WHEN** a Store Item candidate resolves to `checkout`, `blackbox-releases`, `distro`, or `merch`
- **THEN** validation fails before Store static paths or catalog artifacts are emitted
- **AND** the failure identifies the conflicting reserved segment and Store Item owner.

#### Scenario: Fixed and dynamic Store routes are built

- **WHEN** Astro generates Store category, checkout, and Store Item routes
- **THEN** each fixed collection or checkout document has one unambiguous output path
- **AND** `/store/{storeItemSlug}/` remains available for non-reserved Store Item slugs.

### Requirement: Store category navigation presents a clear signal rail

The Store SHALL present its discoverable category links as one square-edged Signal rail with a centered content-width group and semibold Inter labels equivalent to 16px below 640px and 18px from 640px. The current shelf MUST remain visually clear without changing the existing category, route, or authority contract.

#### Scenario: Current category is visually and programmatically distinct

- **WHEN** a Store collection route renders
- **THEN** its current category link exposes `aria-current="page"`
- **AND** it uses stronger text, a 3px Store-accent rule, and a restrained Store-accent surface tint
- **AND** colour is not the only cue that distinguishes the current category.

#### Scenario: Category targets remain accessible

- **WHEN** the Signal rail renders in any supported viewport
- **THEN** every discoverable category is a native link with a clickable area at least 44 CSS pixels high
- **AND** the approved presentation provides a minimum target height equivalent to 48px below 640px and 52px from 640px
- **AND** keyboard focus remains independently visible on current and inactive links
- **AND** hover or focus does not make an inactive link indistinguishable from the current link.

#### Scenario: Narrow viewport reflows the complete category set

- **WHEN** the Signal rail renders at a 320 CSS-pixel viewport with either three or four discoverable categories
- **THEN** every complete category label remains visible without truncation or horizontal scrolling
- **AND** the links reflow into no more than two columns and content-driven rows
- **AND** each wrapped row is centered within the Store container
- **AND** an odd final category does not create a visible placeholder destination.

#### Scenario: Desktop viewport keeps one concise rail

- **WHEN** the Signal rail renders at a desktop viewport
- **THEN** the discoverable category links form one centered content-width group inside the existing Store navigation band
- **AND** their typography is more prominent than the adjacent purchase note and quiet catalogue metadata
- **AND** the rail does not add imagery, counts, icons, search, filters, or commerce utilities.

#### Scenario: Navigation labels remain legible at enlarged text sizes

- **WHEN** a visitor enlarges text to 200% or views the 400% zoom equivalent
- **THEN** the complete category labels remain visible in content-driven rows
- **AND** every category retains its native destination and independently visible focus state
- **AND** the navigation requires no horizontal scrolling.

#### Scenario: Navigation remains static and motion stays incidental

- **WHEN** JavaScript is unavailable or the visitor prefers reduced motion
- **THEN** every category destination remains reachable as its complete static document
- **AND** current, hover, and focus states remain perceivable without layout or position animation
- **AND** reduced motion disables navigation transitions
- **AND** the Signal rail adds no client state, runtime request, or new asset.

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
- **AND** inert search, artist-selection, and Store Crate controls are not presented.

#### Scenario: All opens at the reviewed desktop or mobile size

- **WHEN** a populated All route has settled at scrollY=0, default text size, and a 390x844 or 1280x800 CSS-pixel viewport
- **THEN** identifiable artwork from at least the first Store Item is visible in the initial viewport
- **AND** the layout retains category navigation, search, policy links, and any configured UAT review marker
- **AND** it does not achieve this through text clipping, reduced readable type, undersized controls, or eager loading of every offstage image.

### Requirement: Store listing cards use Veneer titles and quiet credits

Store listing cards SHALL present the source item title in Veneer and its existing artist or label credit beneath it entirely in Inter, including the preceding “by ”. This treatment SHALL apply across All, BlackBox Releases, Distro and populated Merch while preserving existing sizes, navigation, purchase facts and Store Crate visibility.

#### Scenario: A Store listing title and credit render

- **WHEN** a Store listing card renders an item such as Disintegration by Afterwise
- **THEN** its title retains source casing, existing underline, tracking and line height, using Veneer weight 900 at its existing responsive 20–24px size
- **AND** its entire “by ARTIST” credit uses Inter weight 400 at the existing 14px size, 1.4 line height and muted color.

#### Scenario: Linked and unlinked credits remain usable

- **WHEN** a card has an artist profile link
- **THEN** the existing artist name remains the independent artist link and “by ” sits outside that link
- **AND WHEN** a card has an unlinked Distro artist or label credit
- **THEN** that unchanged source credit receives the same Inter presentation without gaining a fabricated artist link.

#### Scenario: Accessible names and catalog matching agree

- **WHEN** assistive technology encounters a Store listing card or its item-detail link
- **THEN** its accessible name uses the source title followed by “ by ” and the unchanged source credit
- **AND** artist filtering and text matching still use the original title and credit values.

#### Scenario: Listing typography remains bounded

- **WHEN** a visitor views cards at 320px, 390px, desktop width or 200% zoom
- **THEN** long titles and credits wrap without truncation or horizontal page overflow
- **AND** artwork, format labels, prices, Buy and Listen actions, and Store Crate visibility retain their existing behavior
- **AND** Store item pages, cart, checkout and order confirmation retain their existing typography.

### Requirement: Store cards expose whole-item navigation and unobstructed availability

All Store categories SHALL use one native link covering each card except its independent Listen button. Cards SHALL retain price and show resolved unavailability beside it, wrapping on narrow layouts without covering artwork. Every Store browsing view SHALL expose the same purchase information.

#### Scenario: Shopper opens a card

- **WHEN** artwork, title, artist, format, price, status, or empty card space is activated
- **THEN** the existing Store Item destination opens using native link semantics, including modified clicks
- **AND** Listen remains independently operable without navigation, with one destination-link focus stop and visible focus.

#### Scenario: A depleted item appears

- **WHEN** fresh listing data reports coming_soon, repressing or sold_out
- **THEN** Coming Soon, Repressing or Sold Out appears beside the retained price with readable text, followed by any shown expected month, with the subtle Store Blood outline for Sold Out and the neutral outline otherwise
- **AND** artwork, listening, image previews and card navigation remain usable on mobile, desktop, zoomed layouts and every Store browsing view.

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

### Requirement: All Store orders its complete catalog by artist

The All Store collection at `/store/` SHALL order every canonical item by its displayed artist, band or label credit A–Z using case-insensitive, numeric-aware English comparison. Equal credits SHALL sort by item title, then canonical slug. Release origin, release date and pre-order state MUST NOT take priority over alphabetical order.

#### Scenario: Mixed sources render alphabetically

- **WHEN** `/store/` renders Release-sourced and Distro-sourced Store Items
- **THEN** all items appear exactly once in one artist/band A–Z sequence
- **AND** BlackBox releases and pre-orders receive no separate priority.

#### Scenario: Credits and ties compare consistently

- **GIVEN** credits differ in case, equivalent Unicode spelling or incidental whitespace
- **WHEN** All determines its item sequence
- **THEN** those credits compare after Unicode normalization, trimming and whitespace collapsing
- **AND** numeric names sort naturally and equal credits use title followed by slug to resolve ties.

#### Scenario: Browsing preserves the alphabetical sequence

- **WHEN** a shopper switches Grid and Crate, applies artist or text filters, or clears filters in All
- **THEN** the retained canonical cards preserve the alphabetical sequence
- **AND** clearing filters restores the complete sequence without changing item identity or counts.

#### Scenario: Direct loads and shell restoration agree

- **WHEN** `/store/` loads directly, enters through shell navigation, restores from a shell cache, or renders without JavaScript
- **THEN** the complete server-rendered All sequence uses the same alphabetical rule at desktop and mobile widths.

#### Scenario: Other collections retain their ordering

- **WHEN** a visitor opens BlackBox Releases, Distro, Merch or the Home pre-order showcase
- **THEN** that surface retains its existing ordering rule.

### Requirement: Store collections show the first row on a phone first viewport

Below 64rem a Store collection page SHALL omit its Top link and the empty artist host and use tightened spacing, while keeping the format chips, category navigation, search and result count; wider viewports are unchanged.

#### Scenario: Shopper opens the Store on a phone

- **WHEN** `/store/` loads at 390 × 844
- **THEN** the first Store card's artwork starts inside the first viewport.

### Requirement: BlackBox release membership excludes Distro

Release-sourced canonical Store Items MUST belong to BlackBox Releases and All and MUST NOT belong to Distro. This presentation rule MUST preserve source, slug, price, stock and checkout identity.

#### Scenario: Disintegration is classified

- **WHEN** the release-sourced Disintegration Store Item is projected
- **THEN** All and BlackBox Releases include the same canonical item once
- **AND** Distro excludes it.

#### Scenario: Another BlackBox release is classified

- **WHEN** any release-sourced canonical Store Item is projected
- **THEN** the same separation applies without a title-specific exclusion.

#### Scenario: Distro merchandise is classified

- **WHEN** a distro-sourced Clothes item is projected
- **THEN** it remains in Distro, Merch and All through its existing identity.
