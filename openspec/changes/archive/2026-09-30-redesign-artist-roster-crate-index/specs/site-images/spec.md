## MODIFIED Requirements

### Requirement: Section-Specific Image Strategies

The system SHALL apply image optimization by section and image role instead of using one global loading or width policy.

#### Scenario: Homepage images are rendered

- **WHEN** the homepage renders the hero image
- **THEN** the hero image is priority-loaded, responsive across viewport width, and visually stable before media bytes complete
- **AND** below-hero homepage roster, release, or distro images follow their card role strategy.

#### Scenario: Distro images are rendered

- **WHEN** the Store Distro category renders square product cards
- **THEN** each product image uses a square stable frame and responsive card widths
- **AND** the leading card set uses eager loading while below-fold cards remain lazy-loaded
- **AND** no product card uses a full-size source derivative when a smaller responsive candidate is enough for the rendered slot.

#### Scenario: Store listing images are rendered

- **WHEN** Store All, BlackBox Releases, or populated Merch listing cards render
- **THEN** they use product-card responsive widths
- **AND** the leading card set uses eager loading
- **AND** below-fold card images remain lazy-loaded.

#### Scenario: Store detail image is rendered

- **WHEN** a Store item detail route renders the main item media
- **THEN** it uses large/detail responsive widths and first-viewport priority behavior.

#### Scenario: Release images are rendered

- **WHEN** release cards render album cover images
- **THEN** they use card-cover responsive widths and lazy/eager behavior based on viewport position
- **AND** release detail, latest release feature, and artist-discography thumbnails use width ladders that match their larger lead, card, or tiny-thumbnail roles.

#### Scenario: Artist images are rendered

- **WHEN** the Artists roster, artist detail lead media, or Home featured roster renders an artist image
- **THEN** the image keeps its source aspect ratio inside a print slot sized from the source dimensions, with no fixed-ratio frame, fill bars, or text over the image
- **AND** roster preview prints, roster row thumbnails, artist detail lead prints, and release thumbnails use separate width ladders that match their preview, tiny-thumbnail, large/detail, and tiny-thumbnail roles.

#### Scenario: News and services images are rendered

- **WHEN** news cards, news detail lead images, or services feature images render
- **THEN** each uses a width ladder appropriate to its card, article, or large feature layout
- **AND** priority is reserved for direct-load first-viewport lead media only.

#### Scenario: Brand, admin, provider, cart, checkout, and email images render

- **WHEN** a Public Brand Asset, admin preview image, Provider Product Image URL, Runtime Image Snapshot, cart image, checkout summary image, or email image renders
- **THEN** it remains outside Astro optimization unless Astro metadata is available at render time
- **AND** it still uses stable geometry, explicit semantics, and environment-correct URLs where applicable.

### Requirement: Secondary route lead media matches its direct-load role

The system SHALL give About, Services, and Artists route-specific image discovery, candidate, and source treatment that meets their load budget without making later media eager.

#### Scenario: About direct route loads

- **WHEN** About renders its `InternalPageHero` as direct-load first-viewport media
- **THEN** the hero is eager and high priority
- **AND** its responsive width ladder includes a 1200w candidate between the existing 1080w and 1440w candidates
- **AND** overlay or non-first-viewport uses of the shared hero component do not inherit that priority automatically.

#### Scenario: Services direct route loads

- **WHEN** the first Services feature image is the expected LCP candidate
- **THEN** that image is eager and high priority
- **AND** subsequent Services feature images remain lazy-loaded with normal priority
- **AND** all feature images retain stable geometry, alt text, `srcset`, and route-appropriate `sizes`.

#### Scenario: Artists direct route loads

- **WHEN** the Artists roster enters the first viewport
- **THEN** the first preview print has high fetch priority but is not requested on viewports where the preview panel is hidden, and only the leading visible row thumbnails are eager
- **AND** at most one artist image, the expected LCP print for the active viewport, is high priority
- **AND** later thumbnails and every other preview print remain lazy-loaded or undisplayed until needed
- **AND** each rendered print keeps its source aspect ratio, subject, detail, and alt text with no material visual regression.

#### Scenario: Secondary route image work is accepted

- **WHEN** About, Services, or Artists image priority or source assets change
- **THEN** five-run desktop and declared mobile-stress profiles meet the route LCP and CLS gates
- **AND** Browser Use verifies mobile and desktop framing, hierarchy, loading stability, and no duplicate high-priority content-image request.

## REMOVED Requirements

### Requirement: Artist card images match News hover feedback

**Reason**: `ArtistCard` no longer exists; artists render as native-aspect prints.

**Migration**: The News hover zoom moves to Home featured prints under "Home featured artist prints match News hover feedback"; the Artists roster uses the print pile as its hover feedback.

## ADDED Requirements

### Requirement: Home featured artist prints match News hover feedback

Home featured roster print photos SHALL use the existing News image hover treatment inside their paper border while preserving native-aspect print framing, captions, links, and responsive delivery. On the Artists roster, the hover and focus print pile is the image feedback, so roster prints do not zoom. The decorative effect MUST respect reduced-motion preferences and MUST NOT require JavaScript.

#### Scenario: Visitor hovers a Home featured artist

- **WHEN** a hover-capable pointer enters a Home featured artist card with no reduced-motion preference
- **THEN** the photo inside its print scales to 1.03 over 500 ms, matching News, clipped to the print's image window
- **AND** leaving the card returns the photo smoothly to its original scale
- **AND** the paper border, caption, and surrounding layout keep their positions apart from the existing print straighten-and-lift.

#### Scenario: Artists roster prints render

- **WHEN** roster preview prints or row thumbnails render
- **THEN** their photos do not zoom on hover
- **AND** hovering or focusing a row keeps driving the preview pile instead.

#### Scenario: Visitor requests reduced motion

- **WHEN** the visitor enables reduced motion and hovers a Home featured artist card
- **THEN** its photo remains at its original scale without a transform transition
- **AND** the card retains visible focus feedback and normal link activation.
