# Spec Delta

## MODIFIED Requirements

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
