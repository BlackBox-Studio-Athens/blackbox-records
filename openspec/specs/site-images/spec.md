# site-images Specification

## Purpose

Define site image ownership, responsive delivery, loading priority, and stable rendering across static content, runtime snapshots, brand assets, and provider projections.

## Requirements

### Requirement: CMS media preserves static image delivery and privacy

Published editorial media SHALL retain responsive rendering, alt text, stable dimensions, and approved framing without requiring paid runtime transformations. Draft media and backups SHALL remain private.

#### Scenario: A migrated page builds

- **WHEN** the approved content snapshot includes media
- **THEN** the build validates its identity and bytes and produces the existing Astro image treatment
- **AND** known public catalog URLs remain available or receive an explicitly tested compatible mapping.

#### Scenario: Uploaded media is invalid

- **WHEN** an upload has an unsafe type, excessive size, invalid image bytes, or unsafe filename
- **THEN** it is rejected or safely normalized before it can be rendered or projected to Stripe
- **AND** remote fetches cannot target arbitrary private-network or unapproved origins.

#### Scenario: Historical image is still referenced

- **WHEN** a media replacement or cleanup occurs
- **THEN** assets referenced by live snapshots, order history, provider Products, or retained backups are not automatically deleted.

### Requirement: Simple Image Roles

The system SHALL classify site image behavior with a small set of image roles.

#### Scenario: Image behavior is described

- **GIVEN** docs, specs, implementation, validation output, or handoff notes describe image behavior
- **WHEN** the image belongs to the site image policy
- **THEN** it uses one of these roles: Content Image, Public Brand Asset, Runtime Image Snapshot, or Provider Product Image URL.

### Requirement: Repo Content Owns Content Images

The system SHALL treat CMS-owned media references and their immutable stored originals as the source of truth for editorial Content Images; Public Brand Assets remain code-owned.

#### Scenario: Product image is needed downstream

- **GIVEN** a release or distro item has a CMS-owned image
- **WHEN** store, cart, checkout, metadata, or provider projection needs product image data
- **THEN** the downstream image data is derived from the CMS-owned content image
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

The system SHALL derive Provider Product Image URLs from CMS-owned approved content snapshots and the target Product Environment.

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

- **GIVEN** Sveltia, email, metadata, or the PRD holding artifact requires a stable Public Brand Asset URL
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
- **AND** its whole photo, subject placement, detail, and alt text have no material visual regression.

#### Scenario: Secondary route image work is accepted

- **WHEN** About, Services, or Artists image priority or source assets change
- **THEN** five-run desktop and declared mobile-stress profiles meet the route LCP and CLS gates
- **AND** Browser Use verifies mobile and desktop framing, hierarchy, loading stability, and no duplicate high-priority content-image request.

### Requirement: Distro artwork uses approved source evidence

The system SHALL use matched existing artwork, verified artwork-fetcher output, or manually verified official artist/label product photography for current Distro items. Every accepted image SHALL remain an owned Content Image with per-asset source and compatible reuse-rights evidence. Current editorial changes SHALL use CMS media and accepted snapshot publication; repository assets remain valid retained inputs, not routine live editing authority.

#### Scenario: Existing matched artwork is available

- **WHEN** a canonical manifest row matches a current verified repository image
- **THEN** that image may be reused.

#### Scenario: Artwork is missing or uncertain

- **WHEN** no verified repository image exists and automated artwork lookup is appropriate
- **THEN** `tools/artwork-fetcher` produces verified, manual-review, or known-missing evidence before its output is accepted.

#### Scenario: Official physical-product photo is manually researched

- **WHEN** an official Bandcamp page, artist/label website, Instagram, YouTube or permitted Facebook publication exposes a photo of the matched physical edition
- **THEN** a human review verifies artist, title, format, edition, and visible packaging before the photo is accepted
- **AND** reviewable research evidence maps the accepted local filename to that source URL and its reuse-rights status
- **AND** no browser automation or authentication bypass is added to `tools/artwork-fetcher`.

#### Scenario: Accepted product photography receives editorial retouching

- **WHEN** a verified official product photo is cropped, corrected, cleaned, or extended for a consistent presentation
- **THEN** its original source URL and reuse-rights evidence remain attached to every derivative filename
- **AND** generated pixels, when used, are confined to the surrounding scene and do not alter product identity, packaging, artwork, text, geometry, colors, discs, wear, or overlapping hands.

#### Scenario: Primary and secondary image roles are assigned

- **WHEN** a Distro item has more than one accepted image
- **THEN** exactly one owned image remains primary for cards, cart, metadata, and provider projection
- **AND** additional images are detail-only Content Images unless a later field-ownership change explicitly promotes them.

#### Scenario: Artwork is known missing

- **WHEN** tooling or an explicit human review records known-missing status
- **THEN** a generic format-appropriate fallback may be used
- **AND** fallback is not used merely because lookup was skipped
- **AND** known-missing fallback does not satisfy this change's physical CD photography requirement.

### Requirement: Cart and checkout thumbnails use a bounded derivative

The system SHALL show StoreCart and checkout line images from a small derivative of the Store Item image, never the original upload.

#### Scenario: Shopper adds a Store Item to the cart

- **WHEN** a Store card, Store Item page, or checkout page seeds a StoreCart line
- **THEN** the line image URL points to one 176 px WebP derivative computed once per Store Item, or the nearest hosted width rung
- **AND** the cart seed keeps its existing field names and types
- **AND** the rendered thumbnail declares its 88 px width and height and decodes asynchronously.

#### Scenario: A stored cart line predates the derivative

- **WHEN** a StoreCart line already in localStorage carries an earlier image URL
- **THEN** it keeps rendering until the line is rewritten
- **AND** no storage migration is required.

### Requirement: Editorial image candidates match their rendered slots

The system SHALL describe each editorial and Store image's rendered slot in `sizes` and SHALL keep width ladders, quality, and fallback sources proportional to what browsers request.

#### Scenario: Built pages are checked for picked candidates

- **WHEN** the built image-markup check evaluates the LCP and lead images of releases, release detail, news, news detail, artist hero, and Store card roles
- **THEN** the candidate a browser picks at 390×844 DPR 2, 390×844 DPR 3, and 1440×900 DPR 1 is the smallest one covering the slot measured from the site CSS, including gutters, padding, frames, and grid columns
- **AND** the first `/news/` card receives high fetch priority.

#### Scenario: A contained photo sits in a fixed frame

- **WHEN** the artist hero shows a photo with `object-fit: contain` inside its frame
- **THEN** `sizes` follows the painted image from its aspect ratio against the frame's, with small rungs available for portrait and square photos
- **AND** the contain-over-blur presentation is unchanged.

#### Scenario: Editorial images are encoded

- **WHEN** an editorial or LCP image is encoded through Astro
- **THEN** it uses one shared editorial WebP quality, 68 unless a recorded visual check sets another value
- **AND** the `src` fallback reuses the largest `srcset` transform instead of encoding an extra full-resolution file.

#### Scenario: Store cards and gallery thumbnails render

- **WHEN** a Store card or a Store Item gallery thumbnail renders
- **THEN** card candidates are 240, 360, 480, 640, and 720 pixels wide
- **AND** 72 px gallery thumbnails offer 144 and 216 pixel candidates.

### Requirement: Link previews, small brand marks, and the header logo are fit for their role

The system SHALL keep link-preview and small brand-mark images within derivative sizes appropriate to their use, and SHALL never lazy-load the header logo.

#### Scenario: A page publishes link-preview metadata

- **WHEN** any public page or the PRD Holding Page emits `og:image` and `twitter:image`
- **THEN** both reference the one 1200 × 630 JPEG brand card resolved against the site origin
- **AND** the brand logo sits inside the card's centre 630 px square, so square crops keep the whole logo
- **AND** no Content Image or original upload is referenced for link previews.

#### Scenario: The PRD Holding Page shows its logo

- **WHEN** the Holding Page renders its logo at 72 to 120 CSS pixels
- **THEN** it uses a derivative no wider than 240 pixels
- **AND** its brand card metadata image and closed asset set remain valid.

#### Scenario: The header renders on any page

- **WHEN** the header brand logo renders
- **THEN** it loads eagerly, because it can be the first-viewport LCP element
- **AND** it keeps its fingerprinted derivative and stable geometry.

### Requirement: Hosted CMS media is addressed by media identity

The hosted renderer SHALL address CMS media by the media's own content SHA, SHALL serve and transform only media that the live or a bounded number of recent accepted snapshots reference, and SHALL keep each transformation request within the widths the image components emit.

#### Scenario: A text-only publication is activated

- **WHEN** an accepted publication changes text but no media
- **THEN** every hosted media and image URL stays the same as before the publication
- **AND** no Images transformation is requested again for unchanged media.

#### Scenario: A media SHA is requested

- **WHEN** a request names a media SHA referenced by the live snapshot or one of the three most recently accepted snapshots
- **THEN** the media or its transformation is served with immutable caching
- **AND** a draft, failed-candidate, retired, or unknown media SHA returns 404 `no-store`
- **AND** checking the SHA costs constant time per request after the recent-snapshot index is built.

#### Scenario: A transformation width is requested

- **WHEN** an `/_image` request names a width
- **THEN** it is accepted only for a width the image components emit, including each image's intrinsic `src` width, and snaps to the declared ladder
- **AND** any other width returns 404 `no-store`.

#### Scenario: A transformation fails or the monthly allowance is spent

- **WHEN** Cloudflare Images cannot return a transformation
- **THEN** the renderer serves the verified original with a short shared cache lifetime and a marker header
- **AND** the original is never cached immutably under a transformation URL.

#### Scenario: A legacy snapshot-prefixed media URL is requested

- **WHEN** a cached page requests media through the earlier snapshot-prefixed URL shape
- **THEN** it is served only for the live or recent accepted snapshots, without re-parsing a full snapshot per request.

### Requirement: Hosted image transformations use a canonical source and direct URLs

Hosted pages SHALL reference CMS image transformations on the images host directly, and every transformation SHALL use one canonical source URL from configuration rather than the request host.

#### Scenario: A hosted page renders a CMS image

- **WHEN** the hosted renderer emits an image element for CMS media
- **THEN** its `src` and `srcset` point to transformation URLs on the configured images host
- **AND** the page preconnects to that host
- **AND** repo-owned ESM images use plain fingerprinted `/_astro` URLs.

#### Scenario: The public hostname changes

- **WHEN** the site is served from a new public hostname such as the apex domain
- **THEN** transformations keep working, because their source is the configured `PUBLIC_IMAGE_SOURCE_ORIGIN`
- **AND** the `image_transform` smoke scenario confirms that a 480 px request returns a small AVIF or WebP with immutable caching on that hostname.

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

### Requirement: Compact Store artwork preserves complete product images

Store Grid and filtered-result cards SHALL use stable square artwork frames that show the full cover or physical product without changing source assets.

#### Scenario: Store artwork renders

- **WHEN** a Release, vinyl, CD, cassette, or merchandise image renders in the compact Grid
- **THEN** the whole image fits within the square frame without stretching or destructive cropping
- **AND** responsive image sizes reflect the real card slot, including the desktop browse pane
- **AND** images have appropriate text alternatives.

#### Scenario: An alternate product photo is available

- **WHEN** the separately specified alternate-photo behavior shows another image
- **THEN** it uses the same compact frame without shifting the card's dimensions
- **AND** missing alternates leave the existing primary image usable.

### Requirement: Store listing cards use a two-width ladder

Store listing card images SHALL offer 360 and 720 pixel candidates only, so phones, Store Crate sleeves and high-density desktops share the 720 pixel transform and fewer unique transformations are requested.

#### Scenario: A Store listing renders

- **WHEN** a Store collection page renders its cards
- **THEN** each card image's `srcset` lists exactly the 360 and 720 pixel transforms.

### Requirement: Image fallback tries the src transform before the original

When a responsive image candidate fails, the browser fallback SHALL clear the responsive candidates and load the image's `src` transform first; only a failed `src` transform SHALL load the canonical public original, once.

#### Scenario: A srcset transform fails

- **GIVEN** a direct Images `srcset` candidate fails to load
- **WHEN** the fallback handles the error
- **THEN** the image loads its `src` transform
- **AND** the original is requested only if that transform also fails.

### Requirement: Home pre-order showcase images are responsive

The Home pre-order showcase SHALL deliver covers with 360 and 720 pixel candidates and slot-matched `sizes`, and band photos with 800, 1200 and 1800 pixel candidates at full viewport width; the showcase JSON SHALL carry these candidate sets and the browser SHALL validate them before use.

#### Scenario: Phone loads the Home showcase

- **WHEN** the showcase renders at 390 px wide on a high-density phone
- **THEN** each cover loads a candidate no wider than 720 pixels
- **AND** the band photo loads from the photo's responsive candidates instead of a single large source.

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

### Requirement: Staff thumbnail inventory and repair preserve originals

The system SHALL provide a bounded inventory and backfill path for native staff media that distinguishes missing originals, unsupported storage keys, and missing or invalid private derivatives. It SHALL write derivatives separately and MUST NOT modify or delete originals.

#### Scenario: A current media key is supported

- **WHEN** a flat JPEG, PNG, or WebP key satisfies the native upload contract
- **THEN** the client URL helper, authenticated thumbnail route, upload validator, and backfill accept the same key
- **AND** the complete key is encoded as one path segment.

#### Scenario: A derivative is missing or invalid

- **WHEN** a listed native original has no valid derivative
- **THEN** the bounded report identifies the derivative as missing or invalid and may prepare a separate PNG derivative at most 96 × 96 pixels and 40 KiB
- **AND** the original object bytes and metadata are not written or deleted.

#### Scenario: An explicitly selected original is absent

- **WHEN** a requested source key is not present in R2
- **THEN** the report identifies a missing original separately from an unsupported key or missing derivative.

#### Scenario: A current EmDash media record has no stored original

- **WHEN** the read-only media audit checks an image record against R2
- **THEN** it reports a missing original separately from unsupported keys and missing or invalid thumbnails
- **AND** the audit does not write or delete any R2 object or D1 row.

#### Scenario: A new image is uploaded

- **WHEN** the staff site uploads JPEG, PNG, or WebP media
- **THEN** it submits a valid PNG thumbnail no larger than 96 × 96 pixels and 40 KiB
- **AND** the CMS stores that derivative only after the native original upload succeeds
- **AND** a derivative error does not undo, replace, or delete the original.

#### Scenario: A staff thumbnail is requested without authorization

- **WHEN** an unauthenticated request targets a staff thumbnail
- **THEN** the CMS rejects it before reading the private derivative
- **AND** successful and failed staff thumbnail responses remain `private, no-store`.

### Requirement: Public CMS images use bounded transformations with original fallback

The public renderer SHALL deliver Published Content Images in accepted runtime snapshots through Cloudflare Images URL transformations from the dedicated image hostname when a transformation applies, with the verified original as fallback. Originals remain in environment-owned R2 storage and remain the source of truth.

#### Scenario: A public CMS image requests a responsive size

- **GIVEN** a public request references an exact content-addressed media path in the current environment
- **WHEN** its source origin is the current UAT or PRD Pages origin and its requested width is a positive number
- **THEN** the renderer snaps that width up to the smallest ladder width (96 to 1800 pixels) not below it, or to 1800, and requests it with `format=auto` from `images.blackboxrecordsathens.com`
- **AND** transformed responses have immutable caching and vary correctly by `Accept`.

#### Scenario: A transformation fails or is unavailable

- **WHEN** the transformation request errors, is rejected, or returns a non-image response
- **THEN** the renderer returns the verified original image bytes from the environment's R2 snapshot.

#### Scenario: A request targets private or non-CMS media

- **WHEN** a request targets a staff draft, preview, arbitrary origin, or unapproved path, or has a missing or non-positive width
- **THEN** it is not sent to the Images transformation host.

#### Scenario: The Pages gateway forwards format negotiation only

- **WHEN** the Pages gateway forwards a public GET or HEAD request to the renderer
- **THEN** the forwarded request carries the shopper's `Accept` header and no other request header
- **AND** cookies and authorization never reach the renderer or the Images transformation host.

#### Scenario: A repository-owned image is rendered

- **WHEN** an image is a static repository asset
- **THEN** it keeps the existing Astro build and Pages delivery path.

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

### Requirement: Release media smoke verifies published originals

The release `public_assets` smoke SHALL verify that representative published media returns successful image responses from the target site's original-media paths. It SHALL resolve trusted direct Images URLs to their same-environment source without requesting a transformation. The separately selected `image_transform` scenario SHALL continue to require a genuine bounded, immutable transformation and reject original fallback responses.

#### Scenario: Images Free transformation allowance is exhausted

- **GIVEN** hosted markup uses the configured direct Images host and a same-environment published media SHA
- **WHEN** the software release runs its public-assets smoke
- **THEN** the media check requests that published original under the target site
- **AND** successful original availability remains verifiable without another transformation request.

#### Scenario: An image URL names an untrusted source

- **WHEN** the discovered media points outside the target site's origin or configured base path
- **THEN** the media discovery fails rather than fetching a foreign original.

#### Scenario: An operator explicitly tests transformation delivery

- **WHEN** the `image_transform` scenario is selected
- **THEN** it still requires a successful small AVIF or WebP transformation with immutable caching
- **AND** an original fallback or quota error fails that scenario.
