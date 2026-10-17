## MODIFIED Requirements

### Requirement: Store listing cards use Veneer titles and quiet credits

Store listing cards SHALL present the source item title in Veneer, except that titles containing Greek use existing Inter weight 600 for the whole title. The existing artist or label credit beneath SHALL remain entirely in Inter, including the preceding “by ”. This treatment SHALL apply across All, BlackBox Releases, Distro and populated Merch while preserving sizes, navigation, purchase facts and Store Crate visibility.

#### Scenario: A Store listing title and credit render

- **WHEN** a Store listing card renders an item such as Disintegration by Afterwise
- **THEN** its title retains source casing, existing underline, tracking and line height, using Veneer weight 900 at its existing responsive 20–24px size
- **AND** its entire “by ARTIST” credit uses Inter weight 400 at the existing 14px size, 1.4 line height and muted color.

#### Scenario: A Greek listing title renders

- **WHEN** a Store listing title contains Greek, including a mixed title such as Blues & Ντέρτια
- **THEN** its whole title uses Inter weight 600 at the existing responsive 20–24px size
- **AND** source casing, underline, tracking, line height and credit presentation remain unchanged.

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
- **AND** Store item pages, cart, checkout and order confirmation retain their existing typography except for the same approved Greek title exception.
