## ADDED Requirements

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

The Store SHALL present source-derived, purpose-specific orientation panels for All and BlackBox Releases while retaining one safe generic presentation for other non-Distro categories.

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

#### Scenario: Another non-Distro category renders

- **WHEN** a populated non-Distro category other than All or BlackBox Releases renders
- **THEN** it receives a complete generic orientation panel using its own label, description, and source-derived total
- **AND** it does not inherit BlackBox-specific copy or layout assumptions.

#### Scenario: Orientation panels reflow

- **WHEN** either purpose-specific panel renders at 320 CSS pixels, 200% text size, or the 400% zoom equivalent
- **THEN** its content follows document order with content-driven height and no clipped or truncated text
- **AND** every format destination remains an ordinary link with a target at least 44 CSS pixels high
- **AND** the page does not require two-dimensional scrolling.

#### Scenario: Orientation remains server-rendered

- **WHEN** JavaScript is unavailable
- **THEN** the same panel labels, source-derived totals, format links, and category descriptions remain available in the complete static document
- **AND** the panels add no client state, runtime request, content field, or commerce authority.
