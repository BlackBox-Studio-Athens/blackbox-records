## MODIFIED Requirements

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
