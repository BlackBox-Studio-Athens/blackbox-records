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

- **WHEN** artist roster or Home featured cards render artist images
- **THEN** they show the whole photo in the documented 3:4 frame with the card responsive width ladder, over a blurred copy of the same photo
- **AND** the blurred copy uses one small source candidate with no high priority
- **AND** artist detail lead images and release thumbnails use separate large/detail and tiny-thumbnail strategies.

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

- **WHEN** the Artists roster grid enters the first viewport
- **THEN** only the expected visible leading portraits are eager
- **AND** the expected LCP portrait is high priority
- **AND** later portraits remain lazy-loaded
- **AND** the selected 480w Ouranopithecus candidate is no more than 100 KiB after existing-pipeline source remediation or candidate tuning
- **AND** its whole photo, subject placement, detail, and alt text have no material visual regression.

#### Scenario: Secondary route image work is accepted

- **WHEN** About, Services, or Artists image priority or source assets change
- **THEN** five-run desktop and declared mobile-stress profiles meet the route LCP and CLS gates
- **AND** Browser Use verifies mobile and desktop framing, hierarchy, loading stability, and no duplicate high-priority content-image request.

## REMOVED Requirements

### Requirement: Home featured artist prints match News hover feedback

**Reason**: Home featured prints return to artist cards.

**Migration**: "Artist card images match News hover feedback" restores the same 1.03 zoom on every artist card.

## ADDED Requirements

### Requirement: Artist card images match News hover feedback

Artist card photos SHALL use the existing News image hover treatment while preserving their 3:4 framing, whole-photo fitting, blurred fill, links, and responsive delivery. The decorative effect MUST respect reduced-motion preferences and MUST NOT require JavaScript.

#### Scenario: Visitor hovers an Artist card

- **WHEN** a hover-capable pointer enters an Artist card with no reduced-motion preference
- **THEN** its photo scales to 1.03 over 500 ms, matching News, clipped to its frame
- **AND** leaving the card returns the photo smoothly to its original scale
- **AND** the blurred fill, card frame, and surrounding layout remain stationary.

#### Scenario: Shared Artist cards render

- **WHEN** Home featured or Artists roster cards render
- **THEN** they offer the same image hover feedback
- **AND** their photo fitting, frame, name placement, navigation, and image loading behavior remain unchanged.

#### Scenario: Visitor requests reduced motion

- **WHEN** the visitor enables reduced motion and hovers an Artist card
- **THEN** its photo remains at its original scale without a transform transition
- **AND** the card retains visible focus feedback and normal link activation.
