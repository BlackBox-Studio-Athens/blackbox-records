# Spec Delta

## ADDED Requirements

### Requirement: Store listing cards connect item titles to Veneer credits

Store listing cards SHALL present the source item title in Inter semibold and its existing artist or label credit beneath it in Veneer, preceded by a plain Inter “by ”. This treatment SHALL apply across All, BlackBox Releases, Distro and populated Merch while preserving existing sizes, navigation, purchase facts and Coverflow visibility.

#### Scenario: A Store listing title and credit render

- **WHEN** a Store listing card renders an item such as Disintegration by Afterwise
- **THEN** its title retains source casing, existing underline, tracking and line height, using Inter weight 600 at its existing responsive 20–24px size
- **AND** its credit name uses Veneer weight 900 at the existing 14px size, 1.4 line height and muted color
- **AND** the preceding “by ” uses Inter weight 400 at the same credit size.

#### Scenario: Linked and unlinked credits remain usable

- **WHEN** a card has an artist profile link
- **THEN** the existing artist name remains the independent artist link and “by ” sits outside that link
- **AND WHEN** a card has an unlinked Distro artist or label credit
- **THEN** that unchanged source credit receives the same Veneer presentation without gaining a fabricated artist link.

#### Scenario: Accessible names and catalog matching agree

- **WHEN** assistive technology encounters a Store listing card or its item-detail link
- **THEN** its accessible name uses the source title followed by “ by ” and the unchanged source credit
- **AND** artist filtering and text matching still use the original title and credit values.

#### Scenario: Listing typography remains bounded

- **WHEN** a visitor views cards at 320px, 390px, desktop width or 200% zoom
- **THEN** long titles and credits wrap without truncation or horizontal page overflow
- **AND** artwork, format labels, prices, Buy and Listen actions, and Coverflow visibility retain their existing behavior
- **AND** Store item pages, cart, checkout and order confirmation retain their existing typography.
