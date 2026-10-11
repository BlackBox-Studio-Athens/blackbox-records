## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: All Store provides one complete bounded Coverflow

**Reason**: Store Coverflow is replaced by the Store Crate.

**Migration**: Use `store-crate-browsing`: every Store collection offers the Grid | Crate switch when it holds a format with a bin, keeps its canonical order and card nodes, and starts in the Grid.
