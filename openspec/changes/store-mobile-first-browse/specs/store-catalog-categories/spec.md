## MODIFIED Requirements

### Requirement: Store orientation panels serve each collection without repeated information

Store categories SHALL present category navigation, one responsive toolbar and one source-derived result total before the catalog, with a visually hidden H1 and no visible Store/category introduction or side pane. Search and Filter SHALL share the phone row; desktop SHALL use the unified menus, availability and View row.

#### Scenario: All presents one concise shelf ledger

- **WHEN** a populated All collection renders
- **THEN** category navigation and a visually hidden All H1 orient the shopper without a visible Store / All header
- **AND** Search Store, the responsive shared browse controls and one result total precede the cards
- **AND** Formats relocates the existing Distro links and Distro counts into the sheet or popover without changing their destinations
- **AND** the page omits the duplicate shelf-purpose headline, Distro introduction, and separate Distro subtotal.

#### Scenario: BlackBox Releases presents direct label context compactly

- **WHEN** BlackBox Releases renders
- **THEN** category links, its hidden category H1, shared browse controls and one result total identify the shelf without a visible introduction
- **AND** the compact composition preserves category metadata, membership, and item order.

#### Scenario: Distro presents its browse tools as one compact orientation panel

- **WHEN** Distro renders
- **THEN** category links, its hidden category H1, search, unified filter controls and one result total identify the shelf
- **AND** Distro's format tools use the same responsive browse area
- **AND** active filters update the one accessible result count and clearing action without repeating the complete catalogue total.

#### Scenario: Another non-Distro category renders

- **WHEN** populated Merch or another non-Distro category renders
- **THEN** it uses category navigation, its hidden category H1, category-scoped browse controls and one result total
- **AND** it does not inherit BlackBox-specific description or identity.

#### Scenario: Orientation panels reflow

- **WHEN** a Store collection renders below the desktop toolbar width, at 200% text size, or at the 320px CSS viewport equivalent
- **THEN** the single Filter sheet replaces desktop menus before controls clip, with logical order and no two-dimensional scrolling
- **AND** interactive targets remain at least 44 CSS pixels high.

#### Scenario: Orientation remains server-rendered

- **WHEN** JavaScript is unavailable
- **THEN** the hidden category H1, existing collection total, category links, ordinary Distro format links in a reachable fallback, preserved legacy fragment targets and full catalogue remain available
- **AND** inert search, artist-selection, and Store Crate controls are not presented.

#### Scenario: All opens at the reviewed desktop or mobile size

- **WHEN** a populated All route has settled at scrollY=0, default text size, and a 390x844 or 1280x800 CSS-pixel viewport
- **THEN** identifiable artwork from at least the first Store Item is visible in the initial viewport
- **AND** the layout retains category navigation, search, policy links, and any configured UAT review marker
- **AND** it does not achieve this through text clipping, reduced readable type, undersized controls, or eager loading of every offstage image.

### Requirement: Store listing cards use Veneer titles and quiet credits

Store cards SHALL present complete artwork, actual format, source-cased ink Veneer title, a prominent Inter artist/label credit, plain lifecycle status and a stable price/action row, in that order. This SHALL apply across All, BlackBox Releases, Distro and populated Merch, retaining canonical links, truthful purchase facts and the Crate's item-in-hand visibility.

#### Scenario: A Store listing title and credit render

- **WHEN** a Store listing card renders an item such as Disintegration by Afterwise
- **THEN** its title retains source casing, existing underline, tracking and line height, using Veneer weight 900 at its existing responsive 20–24px size
- **AND** the artist/label name uses Inter medium 16px on phones and 17px on desktop in ink, with muted “by ” and a Violet underline for verified artist links
- **AND** actual format precedes the title as plain Inter semibold 13px/16px capitals in ink, without a leading mark; Buy retains its existing format icon.

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

### Requirement: Store grids use compact responsive product presentation

Store collections SHALL use available desktop width without a side pane and retain complete identity, gutters and naturally sized cards. At the 1440px reference the grid SHALL use five columns with 20px gaps; at 390px it SHALL use two columns with a 16px gap. Smaller widths and enlarged text SHALL reduce columns before content clips.

#### Scenario: Desktop shopper opens the Store

- **WHEN** the viewport is at least 1280 CSS pixels wide at default text size
- **THEN** the unified toolbar and responsive grid fit without a side pane; at 1440px five columns fit inside the Store's 90rem maximum with 32px gutters
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
- **THEN** the toolbar uses the single Filter sheet and the grid reduces to three, two or one column as space requires, including one below 360px when needed
- **AND** at 320 CSS pixels all content fits without horizontal page scrolling, clipped identity, or reduced functional touch targets
- **AND** long names wrap without forced equal-height truncation.

### Requirement: Store typography uses clear title and reading roles

Store titles SHALL use ink Veneer, artist credits and readable metadata SHALL use Inter, and prices and action labels SHALL use the existing UI display face. Listing format and artist prominence SHALL follow the approved card hierarchy while item-detail, cart and checkout retain their composition.

#### Scenario: Shopper scans the Store

- **WHEN** a collection or item-detail page renders
- **THEN** titles retain the BlackBox brand face and credits and readable metadata use Inter while prices and actions use Bebas Neue
- **AND** the hierarchy introduces no new font family
- **AND** the shared primary-section H1 typography and non-Store surfaces retain their existing contracts.

### Requirement: Store artist selection uses existing catalogue credits

Each populated Store category SHALL offer one multi-artist selection derived from its existing Release artist names and Distro artist-or-label credits. No selected artists SHALL mean all artists. The shared phone Filter sheet and desktop Artists popover SHALL retain the existing choices, counts and matching rules without new data derivation.

#### Scenario: Artist choices render

- **WHEN** enhanced Store browse controls become ready
- **THEN** choices are alphabetical, have source-derived category item counts, and merge equivalent case, whitespace, and Unicode spellings
- **AND** complete collaboration or label credits remain intact without inferred roster membership, aliases, or split identities
- **AND** catalogue credit meaning is explained beside the Artists control when needed.

#### Scenario: Shopper combines filters

- **WHEN** artists, search or Pre-orders are selected, or a format is selected through the existing Distro behavior
- **THEN** visible items satisfy all active selections while retaining existing catalogue order
- **AND** controls remain available with one accessible result count and a clear zero-result state
- **AND** Clear search clears only query, artists-only Clear clears artists, All formats clears format and Clear filters retains its existing clearing scope; none of these actions changes the catalogue order.

#### Scenario: Shopper changes category or revisits

- **WHEN** a category is newly loaded or reactivated through the shell
- **THEN** it starts in Grid with empty text, no selected artists and its current catalogue order
- **AND** Distro retains its existing valid initial-format-fragment behavior
- **AND** no persisted artist preference or additional catalogue/filter request is required.

#### Scenario: Artist controls are unavailable

- **WHEN** JavaScript or browse enhancement is unavailable
- **THEN** every canonical card remains visible and reachable
- **AND** there is no nonfunctional artist control.

### Requirement: Store collections show the first row on a phone first viewport

Store collection entry SHALL put records in the first phone viewport by removing the visible introduction, side pane, outside format-chip rows and separate view bar. At 390×844 with the reference content, the first row's artwork and identity SHALL remain visible in the initial viewport with two cards and the compact purchase note above the grid. Required copy, targets and long-content reflow SHALL NOT be clipped to reach an obsolete position target.

#### Scenario: Shopper opens the Store on a phone

- **WHEN** `/store/` loads at 390 × 844
- **THEN** the first row's artwork and identity are visible within the first viewport
- **AND** category navigation, Search, Filter and one result count remain available above it with the purchase note above the grid as one compact line, allowing natural wrapping for narrow or enlarged text.

#### Scenario: Collection purchase note remains before buying choices

- **WHEN** a collection renders on a phone or desktop, including a zero-result state
- **THEN** the existing Shipping calculated in your cart note and links remain above the grid or empty state in one compact line at the reference width
- **AND** copy, targets and natural reflow are preserved; no below-grid duplicate is introduced.
