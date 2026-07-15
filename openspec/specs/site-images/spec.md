# site-images Specification

## Purpose

TBD - created by archiving change standardize-site-images. Update Purpose after archive.

## Requirements

### Requirement: Simple Image Roles

The system SHALL classify site image behavior with a small set of image roles.

#### Scenario: Image behavior is described

- **GIVEN** docs, specs, implementation, validation output, or handoff notes describe image behavior
- **WHEN** the image belongs to the site image policy
- **THEN** it uses one of these roles: Content Image, Public Brand Asset, Runtime Image Snapshot, or Provider Product Image URL.

### Requirement: Repo Content Owns Content Images

The system SHALL treat repo-owned content collections and CMS-authored content files as the source of truth for Content Images.

#### Scenario: Product image is needed downstream

- **GIVEN** a release or distro item has a repo-owned image
- **WHEN** store, cart, checkout, metadata, or provider projection needs product image data
- **THEN** the downstream image data is derived from the repo-owned content image
- **AND** duplicate editable provider-specific product image fields are not introduced by this change.

### Requirement: Static Local Images Use Astro Image Handling

The system SHALL use Astro image handling for static local content images where Astro image metadata is available.

#### Scenario: Static Astro surface renders a Content Image

- **GIVEN** an Astro page, card, detail, or layout receives a local Content Image as Astro image metadata
- **WHEN** it renders the image
- **THEN** it uses Astro image handling with explicit alt text and stable layout framing.

#### Scenario: Runtime image string is rendered

- **GIVEN** a client-rendered component, cart drawer, checkout summary, public brand asset, provider badge, admin chrome, or external image URL renders an image string
- **WHEN** Astro image metadata is not available
- **THEN** raw image rendering is allowed
- **AND** the rendered image still has explicit alt or decorative semantics and stable dimensions or aspect ratio.

### Requirement: Provider Image URLs Are Projected

The system SHALL derive Provider Product Image URLs from repo-owned content and the target Product Environment.

#### Scenario: Provider product image URL is emitted

- **GIVEN** catalog promotion or provider reconciliation emits product image data
- **WHEN** the target Product Environment is UAT or PRD
- **THEN** the image URL is an absolute public URL for that same Product Environment
- **AND** browser-submitted image URLs are not accepted as product-media authority.

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

The system SHALL prioritize actual first-viewport and LCP images without eager-loading every image on a route or assigning competing high-priority candidates.

#### Scenario: Route has a single visual hero or lead media

- **WHEN** a direct route has one primary first-viewport Content Image such as the homepage hero, About hero, first Services feature, latest release feature, store detail media, release detail media, artist detail media, or news lead image
- **THEN** that image uses explicit Astro priority behavior or equivalent eager loading and high fetch priority appropriate for LCP media
- **AND** its request is discoverable in initial HTML
- **AND** no second content image on the same direct page receives high fetch priority without measured evidence.

#### Scenario: Route starts with a product or catalog grid

- **WHEN** the first visible viewport contains a product, distro, release, artist, news, or store card grid
- **THEN** only the expected leading visible card set uses browser eager loading
- **AND** at most the expected LCP card receives high fetch priority
- **AND** below-fold card images remain lazy-loaded.

#### Scenario: Detail fragment is loaded after user navigation

- **WHEN** a detail or overlay fragment is loaded after an in-site user action
- **THEN** supporting images remain normal or lazy priority unless the same component is direct-loaded as first-viewport route media
- **AND** the component's priority input distinguishes those two contexts without duplicating content markup.

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

### Requirement: Homepage hero treatment avoids runtime raster effects

The system SHALL preserve the approved homepage hero treatment through a reviewed source asset instead of continuous runtime raster effects.

#### Scenario: Hero source treatment is prepared

- **WHEN** the homepage hero requires monochrome, contrast, brightness, or static texture treatment
- **THEN** the treatment is applied through the existing editorial source-remediation workflow
- **AND** the result is visually reviewed at mobile and desktop sizes
- **AND** the asset remains in Astro's responsive Content Image pipeline.

#### Scenario: Hero image renders

- **WHEN** the homepage hero is visible
- **THEN** the image keeps its existing eager loading, high fetch priority, stable geometry, `srcset`, and `sizes` behavior
- **AND** no runtime CSS image filter, animated grain overlay, or blend layer is required to reproduce the approved treatment.

#### Scenario: Desktop hero candidate is selected

- **GIVEN** the declared 1440x900 DPR-1 performance profile
- **WHEN** the browser selects the homepage hero candidate
- **THEN** the transferred candidate is no more than 350 KiB
- **AND** screenshot comparison shows no material crop, banding, contrast, or legibility regression.

### Requirement: Main-site UI brand assets are fit-for-purpose and fingerprinted

The system SHALL serve local main-site header and footer brand imagery at dimensions and cache identities appropriate to their rendered UI slots.

#### Scenario: Main-site brand logo renders

- **WHEN** the header or footer renders a repo-owned brand logo that does not require a stable public path
- **THEN** it uses a fit-for-purpose derivative through Astro or Vite's fingerprinted asset pipeline
- **AND** the transferred asset is no more than 40 KiB
- **AND** its intrinsic dimensions are no more than twice the largest required rendered dimension
- **AND** stable geometry and accessible semantics remain present.

#### Scenario: Stable public brand path is still required

- **GIVEN** Decap, email, metadata, or the PRD holding artifact requires a stable Public Brand Asset URL
- **WHEN** the main-site derivative is introduced
- **THEN** the required public original or dedicated public copy remains available
- **AND** the main site does not fetch that oversized public source when a fingerprinted derivative is available.

#### Scenario: PRD holding artifact shares an asset

- **WHEN** a font or logo source used by the PRD holding artifact changes
- **THEN** the holding artifact is rebuilt and its closed asset set is verified
- **AND** its no-API, no-analytics, no-third-party-request contract remains unchanged.

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
- **AND** its documented 3:4 crop, subject placement, detail, and alt text have no material visual regression.

#### Scenario: Secondary route image work is accepted

- **WHEN** About, Services, or Artists image priority or source assets change
- **THEN** five-run desktop and declared mobile-stress profiles meet the route LCP and CLS gates
- **AND** Browser Use verifies mobile and desktop crop, hierarchy, loading stability, and no duplicate high-priority content-image request.
