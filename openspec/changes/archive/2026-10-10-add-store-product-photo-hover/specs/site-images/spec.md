# Spec Delta

## ADDED Requirements

### Requirement: Distro cards preview one ordered secondary photo

Distro-derived Store Items, including cassettes, SHALL use the first gallery image whose source differs from the primary as their alternate browse photo. This selection SHALL apply wherever the shared Store card appears, including All, Distro, populated Merch, Coverflow, expanded catalogs, and search results. Primary-image ownership for cart, checkout, metadata, and provider presentation SHALL remain unchanged.

#### Scenario: Shopper hovers an eligible image

- **WHEN** a hover-capable fine pointer enters the card's image area and the alternate is ready
- **THEN** the alternate appears in the existing frame
- **AND** leaving restores the primary unless the link still has visible keyboard focus
- **AND** re-entering shows the same alternate without automatic cycling.

#### Scenario: No alternate is available

- **WHEN** the gallery is absent, empty, or contains only the primary source
- **THEN** the card keeps its primary-only presentation
- **AND** Release-derived items retain their existing behavior.

### Requirement: Photo previews preserve accessible navigation and physical-product framing

The preview SHALL preserve existing navigation, labels, and card geometry while displaying the complete alternate photo within an opaque frame. The full saved gallery SHALL remain available through the existing item page.

#### Scenario: Shopper uses a keyboard

- **WHEN** the item link receives visible keyboard focus and its alternate is ready
- **THEN** the same alternate appears with a stable link name and visible focus
- **AND** no extra tab stop or duplicate image announcement is introduced
- **AND** existing Coverflow focus activation and Enter behavior remain intact.

#### Scenario: Shopper activates a card or uses touch

- **WHEN** a shopper activates an ordinary card or the active Coverflow cover
- **THEN** its item link opens without an image-toggle tap
- **AND** an inactive side-cover tap still selects that cover through the existing behavior
- **AND** the photo effect adds no sticky touch-hover state or gesture interception
- **AND** all gallery photos remain accessible by scrolling the item page.

#### Scenario: Alternate proportions or motion preferences differ

- **WHEN** the alternate is displayed
- **THEN** it is contained without stretching or clipping, and the primary does not show through letterboxing
- **AND** labels, primary/CD framing, and outer Coverflow geometry remain intact
- **AND** reduced-motion preference disables the photo transition.

### Requirement: Alternate delivery uses existing media and keeps the primary fallback

Listings SHALL add at most one lazy, non-high-priority secondary image per eligible card, through existing owned-media delivery. Other gallery photos SHALL remain on the item page rather than being preloaded for the listing.

#### Scenario: Alternate loading is pending or fails

- **WHEN** the alternate has not loaded successfully
- **THEN** the primary remains visible and navigable without a broken-image overlay
- **AND** a later successful load reveals the alternate only while hover or visible keyboard focus applies.

#### Scenario: Store is entered or revisited

- **WHEN** Store is loaded directly, entered through section navigation, or restored from history/cache
- **THEN** ready alternates work and unavailable alternates retain the primary fallback
- **AND** navigation, existing listing-price behavior, and same-document player continuity remain intact.

#### Scenario: Enhancement is unavailable

- **WHEN** JavaScript is disabled or alternate-image enhancement is unavailable
- **THEN** primary cards and normal navigation remain usable
- **AND** the server-rendered detail gallery exposes all saved photos with their authored descriptions and natural proportions.
