# store-catalog-categories Specification

## Purpose

TBD - created by archiving change consolidate-distro-into-store. Update Purpose after archive.

## Requirements

### Requirement: Primary navigation separates editorial releases from shopping

The site SHALL expose `Artists`, `Releases`, `Store`, `Services`, and `About` as its visible primary sections in that exact order, with Store as the only current catalog-shopping section.

#### Scenario: Primary navigation renders

- **WHEN** the desktop header or mobile navigation renders
- **THEN** its visible section links are `Artists · Releases · Store · Services · About` in that order
- **AND** Distro is not exposed as a primary section.

#### Scenario: Footer section navigation renders

- **WHEN** footer section links render
- **THEN** they use the same five-section order
- **AND** no Distro footer link recreates the retired standalone section.

#### Scenario: Visitor opens Releases

- **WHEN** the visitor opens Releases
- **THEN** the route remains the editorial BlackBox discography with Release detail and listening behavior
- **AND** Store Item purchase discovery remains under Store.

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

The system MUST derive deterministic `Store Category` memberships for each canonical Store Item without changing commerce source identity or authority, while deduplicating every selected view.

#### Scenario: Release-sourced Store Item is classified

- **GIVEN** a canonical Store Item has source kind `release`
- **WHEN** Store category membership is derived
- **THEN** it belongs to `BlackBox Releases`.

#### Scenario: Clothes Store Item is classified

- **GIVEN** a distro-sourced Store Item has exact accepted Distro group `Clothes`
- **WHEN** Store category membership is derived
- **THEN** it belongs to `Distro` and `Merch`
- **AND** its Distro source identity and exact physical type remain unchanged.

#### Scenario: Remaining Distro Store Item is classified

- **GIVEN** a distro-sourced Store Item is not grouped as `Clothes`
- **WHEN** Store category membership is derived
- **THEN** it belongs to `Distro`.

#### Scenario: All collection is derived

- **WHEN** the `All` Store collection is prepared
- **THEN** every canonical Store Item appears exactly once
- **AND** every canonical Store Item has at least one named category membership
- **AND** a Store Item may appear in more than one named category but never more than once within one category projection.

#### Scenario: Category authority is inspected

- **WHEN** Store categories are implemented or serialized
- **THEN** category membership remains frontend presentation data
- **AND** it is not added to `StoreItemSourceKind`, D1, Worker APIs, Store Offers, Stripe metadata, checkout payloads, StoreCart, stock, or provider field ownership.

### Requirement: Store category pages render honest collection states

Each discoverable Store category route SHALL render only its classified canonical Store Items and SHALL preserve ordinary Store Item navigation.

#### Scenario: All or BlackBox Releases renders items

- **WHEN** `/store/` or `/store/blackbox-releases/` renders a populated collection
- **THEN** each canonical item appears once as a Store listing card
- **AND** its ordinary link opens the canonical Store Item detail route.

#### Scenario: One Store Item has multiple category memberships

- **GIVEN** a canonical Store Item belongs to both `Distro` and `Merch`
- **WHEN** those category routes render
- **THEN** the same canonical Store Item appears once in each relevant category
- **AND** it still appears only once in All
- **AND** no duplicate Store Item, Store Offer, stock, or checkout identity is created.

#### Scenario: Distro category renders items

- **WHEN** `/store/distro/` renders
- **THEN** every canonical distro-sourced Store Item appears once in its deterministic format groups
- **AND** exact `Clothes` Merch membership does not remove it from Distro
- **AND** existing Distro search, format navigation, Coverflow disclosure, and no-JavaScript catalog access remain available under the Store category.

#### Scenario: Merch category is empty

- **GIVEN** no canonical Store Item is currently classified as `Merch`
- **WHEN** a visitor directly opens `/store/merch/`
- **THEN** the static response replaces the location with the base-aware `/store/` URL and provides a meta-refresh fallback and ordinary Store link
- **AND** it does not render an empty Merch shelf or create a placeholder commerce record.

#### Scenario: Merch becomes populated

- **WHEN** accepted source content later causes one or more canonical Store Items to classify as `Merch`
- **THEN** the route, Store category navigation, and sitemap derive and render those items without an authored navigation or count change
- **AND** the empty-route redirect is absent.

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

The Store SHALL present its discoverable category links as one square-edged Signal rail that makes the current shelf visually clear without changing the existing category, route, or authority contract.

#### Scenario: Current category is visually and programmatically distinct

- **WHEN** a Store collection route renders
- **THEN** its current category link exposes `aria-current="page"`
- **AND** it uses stronger text, a 3px Store-accent rule, and a restrained Store-accent surface tint
- **AND** colour is not the only cue that distinguishes the current category.

#### Scenario: Category targets remain accessible

- **WHEN** the Signal rail renders in any supported viewport
- **THEN** every discoverable category is a native link with a clickable area at least 44 CSS pixels high
- **AND** keyboard focus remains independently visible on current and inactive links
- **AND** hover or focus does not make an inactive link indistinguishable from the current link.

#### Scenario: Narrow viewport reflows the complete category set

- **WHEN** the Signal rail renders at a 320 CSS-pixel viewport with either three or four discoverable categories
- **THEN** every complete category label remains visible without truncation or horizontal scrolling
- **AND** the links reflow into no more than two columns and content-driven rows
- **AND** an odd final category does not create a visible placeholder destination.

#### Scenario: Desktop viewport keeps one concise rail

- **WHEN** the Signal rail renders at a desktop viewport
- **THEN** the discoverable category links occupy one equal-width row inside the existing Store navigation band
- **AND** the rail does not add imagery, counts, icons, search, filters, or commerce utilities.

#### Scenario: Navigation remains static and motion stays incidental

- **WHEN** JavaScript is unavailable or the visitor prefers reduced motion
- **THEN** every category destination remains reachable as its complete static document
- **AND** current, hover, and focus states remain perceivable without layout or position animation
- **AND** the Signal rail adds no client state, runtime request, or new asset.

### Requirement: Store orientation panels serve each collection without repeated information

The Store SHALL present source-derived, purpose-specific orientation panels for All, BlackBox Releases, and Distro while retaining one safe generic presentation for other non-Distro categories.

#### Scenario: All presents one concise shelf ledger

- **WHEN** `/store/` renders a populated All collection
- **THEN** the panel presents `Store shelf`, the shelf-purpose headline, and the source-derived complete Store Item total exactly once
- **AND** the active Signal rail identifies `All` without a second All heading inside the panel
- **AND** the panel exposes `Browse Distro formats` with one ordinary canonical fragment link and source-derived count for each current Distro format
- **AND** it does not repeat the collection total, Distro intro paragraph, or separate Distro subtotal.

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
- **AND** every format destination remains an ordinary link with a target at least 44 CSS pixels high
- **AND** the page does not require two-dimensional scrolling.

#### Scenario: Orientation remains server-rendered

- **WHEN** JavaScript is unavailable
- **THEN** the same panel labels, source-derived totals, format links, and category descriptions remain available in the complete static document where applicable
- **AND** the panels add no client state, runtime request, content field, or commerce authority.
