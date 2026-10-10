## ADDED Requirements

### Requirement: Store Crate sleeves reuse card image candidates

Store Crate sleeves SHALL use the 360 and 720 pixel candidates their Store card already offers, with a slot size matching the rendered sleeve. Initial Store HTML SHALL describe the Grid slots only.

#### Scenario: A bin is opened

- **WHEN** the shopper opens a bin
- **THEN** each sleeve within the drawn window takes a candidate from its card's existing set, and a cover already on screen reuses the image the card loaded
- **AND** no new image width or transformation is requested and no sleeve receives high fetch priority.

### Requirement: Store collections give initial priority only to the first visible cover

Store image priority SHALL follow the default Grid with a fixed leading set of at most four eager images and at most one expected LCP image receiving high fetch priority. Store Crate availability alone MUST NOT select different loading behavior.

#### Scenario: A Store collection initially renders

- **WHEN** a Store collection with a bin renders directly
- **THEN** the initial presentation is Grid, its leading cards follow the fixed eager set, and remaining cards stay lazy.

## MODIFIED Requirements

### Requirement: Distro cards preview one ordered secondary photo

Distro-derived Store Items, including cassettes, SHALL use the first gallery image whose source differs from the primary as their alternate browse photo. This selection SHALL apply wherever the shared Store card appears, including All, Distro, populated Merch, the Store Crate's item in hand, expanded catalogs, and search results. Primary-image ownership for cart, checkout, metadata, and provider presentation SHALL remain unchanged.

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
- **AND** existing Store Crate focus and Enter behavior remain intact.

#### Scenario: Shopper activates a card or uses touch

- **WHEN** a shopper activates an ordinary card or the Store Crate's item in hand
- **THEN** its item link opens without an image-toggle tap
- **AND** a tap on another sleeve in the Store Crate digs to it through the existing behavior
- **AND** the photo effect adds no sticky touch-hover state or gesture interception
- **AND** all gallery photos remain accessible by scrolling the item page.

#### Scenario: Alternate proportions or motion preferences differ

- **WHEN** the alternate is displayed
- **THEN** it is contained without stretching or clipping, and the primary does not show through letterboxing
- **AND** labels, primary/CD framing, and Store Crate sleeve geometry remain intact
- **AND** reduced-motion preference disables the photo transition.

### Requirement: Store listing cards use a two-width ladder

Store listing card images SHALL offer 360 and 720 pixel candidates only, so phones, Store Crate sleeves and high-density desktops share the 720 pixel transform and fewer unique transformations are requested.

#### Scenario: A Store listing renders

- **WHEN** a Store collection page renders its cards
- **THEN** each card image's `srcset` lists exactly the 360 and 720 pixel transforms.

## REMOVED Requirements

### Requirement: Store Coverflow image slots match bounded cover geometry

**Reason**: Store Coverflow is replaced by the Store Crate.

**Migration**: Use "Store Crate sleeves reuse card image candidates".

### Requirement: Store Coverflow gives initial priority only to the first visible cover

**Reason**: Store Coverflow is replaced by the Store Crate.

**Migration**: Use "Store collections give initial priority only to the first visible cover", which keeps the Grid priority rules.
