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

#### Scenario: Related canonical Distro Store Item is classified

- **GIVEN** a canonical distro-sourced Store Item is the Distro endpoint of an explicit Release-to-Distro Store Item relation
- **WHEN** Store category membership is derived
- **THEN** it belongs to `BlackBox Releases`
- **AND** it remains in `Distro` because its canonical source is distro-owned.

#### Scenario: Clothes Store Item is classified

- **GIVEN** a distro-sourced Store Item has exact accepted Distro group `Clothes`
- **WHEN** Store category membership is derived
- **THEN** it belongs to `Distro` and `Merch`
- **AND** its Distro source identity and exact physical type remain unchanged.

#### Scenario: Remaining Distro Store Item is classified

- **GIVEN** a distro-sourced Store Item is not grouped as `Clothes` and may or may not be related to a BlackBox Release
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

- **GIVEN** a canonical Store Item belongs to both `BlackBox Releases` and `Distro`
- **WHEN** those category routes render
- **THEN** the same canonical Store Item appears once in each relevant category
- **AND** it still appears only once in All
- **AND** no duplicate Store Item, Store Offer, stock, or checkout identity is created.

#### Scenario: Distro category renders items

- **WHEN** `/store/distro/` renders
- **THEN** every canonical distro-sourced Store Item appears once in its deterministic format groups
- **AND** related BlackBox Release membership or exact `Clothes` Merch membership does not remove it from Distro
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
