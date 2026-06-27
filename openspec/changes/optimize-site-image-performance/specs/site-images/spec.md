## ADDED Requirements

### Requirement: Responsive Content Image Delivery

The system SHALL render static local Content Images through Astro image handling with responsive delivery whenever Astro image metadata is available.

#### Scenario: Local Content Image renders in Astro

- **WHEN** an Astro page, card, detail component, or hero renders a local Content Image from a content collection
- **THEN** the rendered image uses Astro `<Image>` or `<Picture>` with explicit alt text
- **AND** the rendered image emits either a route-appropriate `srcset` and `sizes` pair, an Astro responsive layout, or a documented exception for a fixed tiny image.

#### Scenario: Responsive widths are selected

- **WHEN** a responsive width ladder is defined for a Content Image
- **THEN** the ladder is based on the rendered slot size and high-DPR needs for that image role
- **AND** it does not include oversized derivatives that materially exceed the largest useful rendered size for that role.

#### Scenario: Public or runtime string image renders

- **WHEN** Astro image metadata is not available because the image is a Public Brand Asset, Runtime Image Snapshot, Provider Product Image URL, admin preview, email image, or external string URL
- **THEN** raw image rendering is allowed
- **AND** the rendered element or its frame supplies explicit alt/decorative semantics and stable dimensions or aspect ratio.

### Requirement: Above-The-Fold Image Priority

The system SHALL prioritize first-viewport images without eager-loading every image on a route.

#### Scenario: Route has a single visual hero or lead media

- **WHEN** a route has one primary first-viewport Content Image such as the homepage hero, latest release feature, store detail media, release detail media, artist detail media, or news lead image
- **THEN** that image uses Astro priority behavior or equivalent `loading`, `decoding`, and `fetchpriority` attributes appropriate for first-viewport media
- **AND** non-primary images on the same route do not also receive high fetch priority without evidence.

#### Scenario: Route starts with a product or catalog grid

- **WHEN** the first visible viewport contains a product, distro, release, artist, news, or store card grid
- **THEN** the leading visible card set uses browser eager loading with normal fetch priority
- **AND** below-fold card images remain lazy-loaded.

#### Scenario: Detail fragment is loaded after user navigation

- **WHEN** a detail or overlay fragment is loaded after an in-site user action
- **THEN** supporting images may remain lazy-loaded unless the same component is direct-loaded as the first-viewport route media.

### Requirement: Section-Specific Image Strategies

The system SHALL apply image optimization by section and image role instead of using one global loading or width policy.

#### Scenario: Homepage images are rendered

- **WHEN** the homepage renders the hero image
- **THEN** the hero image is priority-loaded, responsive across viewport width, and visually stable before media bytes complete
- **AND** below-hero homepage roster, release, or distro images follow their card role strategy.

#### Scenario: Distro images are rendered

- **WHEN** the Distro page renders square product cards
- **THEN** each product image uses a square stable frame and responsive card widths
- **AND** the leading card set uses eager loading while below-fold cards remain lazy-loaded
- **AND** no product card uses a full-size source derivative when a smaller responsive candidate is enough for the rendered slot.

#### Scenario: Store listing images are rendered

- **WHEN** the Store listing renders card images
- **THEN** it uses product-card responsive widths
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

- **WHEN** artist roster cards render portrait images
- **THEN** they preserve the documented 3:4 portrait framing and responsive width ladder
- **AND** artist detail lead images and release thumbnails use separate large/detail and tiny-thumbnail strategies.

#### Scenario: News and services images are rendered

- **WHEN** news cards, news detail lead images, or services feature images render
- **THEN** each uses a width ladder appropriate to its card, article, or large feature layout
- **AND** priority is reserved for direct-load first-viewport lead media only.

#### Scenario: Brand, admin, provider, cart, checkout, and email images render

- **WHEN** a Public Brand Asset, admin preview image, Provider Product Image URL, Runtime Image Snapshot, cart image, checkout summary image, or email image renders
- **THEN** it remains outside Astro optimization unless Astro metadata is available at render time
- **AND** it still uses stable geometry, explicit semantics, and environment-correct URLs where applicable.

### Requirement: Source Asset Remediation

The system SHALL treat source asset optimization as an editorial repair workflow, not as an automatic derivative-generation pipeline.

#### Scenario: Source asset exceeds role needs

- **WHEN** asset QA or performance inspection shows a source image is unreadable, much larger than useful for its role, carries unnecessary metadata, or has avoidable format/weight problems
- **THEN** remediation may use ImageMagick for repeatable local resizing, metadata stripping, or safe compression
- **AND** the replacement is reviewed as a content change before commit.

#### Scenario: Source crop or focal point is wrong

- **WHEN** an image fails because the crop, subject placement, portrait ratio, or artwork legibility is editorially wrong
- **THEN** remediation uses GIMP, a replacement source, or a documented content exception
- **AND** automated cropping is not used as a hidden build step.

#### Scenario: Existing asset QA reports warnings

- **WHEN** `pnpm assets:check` reports warning-level source image issues
- **THEN** implementation may proceed if rendered output remains correct
- **AND** warnings are either fixed, explicitly deferred, or documented as intentional content exceptions.

### Requirement: No New Media Platform By Default

The system SHALL keep image optimization inside the existing static Astro, Sharp, ImageMagick, GIMP, and hosted static asset model unless a later approved change proves a stronger need.

#### Scenario: New media infrastructure is proposed

- **WHEN** an implementation proposes a CDN image service, DAM, R2 media bucket, SSR image endpoint, Pages Function, service worker image cache, or new runtime image dependency
- **THEN** the proposal is rejected for this change
- **AND** a separate OpenSpec change is required with measured evidence that the current Astro/Sharp/static approach cannot meet the target.
