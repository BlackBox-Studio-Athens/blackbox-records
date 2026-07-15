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
