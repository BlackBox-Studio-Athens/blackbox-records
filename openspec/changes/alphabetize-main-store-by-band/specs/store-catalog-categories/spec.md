## ADDED Requirements

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

- **WHEN** a shopper switches Grid and Coverflow, applies artist or text filters, or clears filters in All
- **THEN** the retained canonical cards preserve the alphabetical sequence
- **AND** clearing filters restores the complete sequence without changing item identity or counts.

#### Scenario: Direct loads and shell restoration agree

- **WHEN** `/store/` loads directly, enters through shell navigation, restores from a shell cache, or renders without JavaScript
- **THEN** the complete server-rendered All sequence uses the same alphabetical rule at desktop and mobile widths.

#### Scenario: Other collections retain their ordering

- **WHEN** a visitor opens BlackBox Releases, Distro, Merch or the Home pre-order showcase
- **THEN** that surface retains its existing ordering rule.
