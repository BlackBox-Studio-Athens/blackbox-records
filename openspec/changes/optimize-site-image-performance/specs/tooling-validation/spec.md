## ADDED Requirements

### Requirement: Image Source QA Stays Read-Only And Evidence-Based

The system SHALL keep source image QA read-only and add role-specific checks only for documented source problems.

#### Scenario: Asset QA runs

- **WHEN** `pnpm assets:check` runs
- **THEN** it inspects repo-owned content images and public image assets without mutating files
- **AND** it reports missing files, unsupported formats, unreadable image dimensions, missing alt coverage, provider URL readiness problems, and existing documented role-specific source warnings.

#### Scenario: Role-specific source warning is evaluated

- **WHEN** a source image check is added for preferred dimensions, ratio, or format expectations
- **THEN** the diagnostic is warning-level unless the image is unreadable, missing, or violates provider URL readiness
- **AND** the diagnostic names the source path, expected role standard, and observed dimensions or format.

#### Scenario: Source asset repair is performed

- **WHEN** ImageMagick or GIMP is used to replace a source image
- **THEN** the replacement is verified by `pnpm assets:check`
- **AND** the source change is reviewed separately from generated Astro output.

### Requirement: Built Image Markup Is Verified

The system SHALL verify generated image markup for representative routes after implementation.

#### Scenario: Static build completes

- **WHEN** `pnpm build` generates the static frontend artifact
- **THEN** representative route HTML is inspected for expected `srcset`, `sizes`, `loading`, `decoding`, and `fetchpriority` behavior on key image surfaces
- **AND** full-size image URLs are not the only candidate for responsive card and detail images.

#### Scenario: Above-fold route media is checked

- **WHEN** representative first-viewport media is inspected on `/`, `/distro/`, `/store/`, `/releases/`, release detail, artist detail, news detail, and `/services/`
- **THEN** each route has no more than the intended primary high-priority image
- **AND** leading visible card-set images avoid lazy loading where their section strategy requires eager loading.

#### Scenario: Tiny thumbnails are checked

- **WHEN** thumbnail-only image slots such as previous release lists, cart line images, checkout summary images, or badge-like images are inspected
- **THEN** they do not request large card/detail derivatives unless Astro metadata is unavailable and the raw runtime URL is the only available source.

### Requirement: Browser Image Validation Uses Browser Use

The system SHALL use Browser Use for rendered image validation when implementation changes image loading, layout, or framing.

#### Scenario: Local rendered validation runs

- **WHEN** image rendering implementation changes are complete
- **THEN** Browser Use validates representative routes at mobile and desktop widths
- **AND** the checks confirm stable frames, no blank media dead zones, no overlapping text, no horizontal scroll, and no console errors caused by the image changes.

#### Scenario: Catalog grid validation runs

- **WHEN** Distro, Store, Releases, Artists, or News grid image behavior changes
- **THEN** Browser Use checks the first viewport and a scrolled viewport
- **AND** the evidence confirms the leading card set is prioritized appropriately while below-fold images continue to load progressively.

#### Scenario: Hosted validation is needed

- **WHEN** the image change relies on hosted static asset behavior, CDN cache headers, GitHub Pages UAT behavior, or Cloudflare Pages PRD behavior
- **THEN** local Browser Use validation is not treated as hosted proof
- **AND** the appropriate hosted smoke or cache-policy check is run against the target Product Environment.

### Requirement: Repository Gates Remain Mandatory

The system SHALL run existing repository gates after image rendering implementation changes.

#### Scenario: Image behavior changes are complete

- **WHEN** implementation changes image behavior, generated markup, validation tooling, or source assets
- **THEN** `pnpm test:unit`, `pnpm check`, and `pnpm build` pass on the final tree
- **AND** any new asset QA or markup check has focused tests that fail when the optimized behavior regresses.
