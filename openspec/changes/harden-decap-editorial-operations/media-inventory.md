# Decap media inventory

Task 1.6 baseline captured from required worktree HEAD `8e7fbc9d9f35b46e4aa381889103d40e0792cd54` on July 22, 2026. This is evidence only: findings below are not fixes.

## Method

- Configured roots were read from the Decap builders under `apps/web/src/lib/admin/`.
- Route behavior was read from `apps/web/src/pages/admin/media/[collection]/[asset].ts`.
- The uploads list contains every tracked file returned for `apps/web/src/content/uploads/`.
- Repository text references were searched by exact upload filename and counterpart filename.
- SHA-256 comparison covered image files under `apps/web/src/` and `apps/web/public/`. A byte-identical counterpart is not itself a reference.

## Configured media roots

| Decap surface | `media_folder` | `public_folder` | Effective repository root | Image field ownership | Source |
| --- | --- | --- | --- | --- | --- |
| Global media library | `apps/web/src/content/uploads` | not emitted | `apps/web/src/content/uploads/` | Top-level Media surface; no collection field owns this root | `apps/web/src/lib/admin/decap-config.ts:63` |
| Home singleton | `.` | `./` | `apps/web/src/content/home/` | `hero.image`; dormant `sections[journey].image` | `apps/web/src/lib/admin/decap-page-collections.ts:32-35` |
| About singleton | `.` | `./` | `apps/web/src/content/about/` | `hero.image` | `apps/web/src/lib/admin/decap-page-collections.ts:50-53` |
| Services singleton | `.` | `./` | `apps/web/src/content/services/` | `sections[services].items[].image` | `apps/web/src/lib/admin/decap-page-collections.ts:82-87` |
| Artists | `.` | `./` | `apps/web/src/content/artists/` | `image` | `apps/web/src/lib/admin/decap-artist-collection.ts:12-20` |
| Releases | `.` | `./` | `apps/web/src/content/releases/` | `cover_image` | `apps/web/src/lib/admin/decap-release-collection.ts:7-14` |
| Distro | `.` | `./` | `apps/web/src/content/distro/` | `image` | `apps/web/src/lib/admin/decap-distro-collection.ts:7-14` |
| News | `.` | `./` | `apps/web/src/content/news/` | `image` | `apps/web/src/lib/admin/decap-news-collection.ts:7-14` |

No field-level or nested-widget `media_folder`, `public_folder`, or `media_library` configuration exists. `BaseFieldConfig` has no media-path properties (`apps/web/src/lib/admin/decap-yaml-builder.ts:6-13`); media-path serialization exists only for file entries and folder collections (`:205-223`, `:242-264`). Distro Page, Newsletter, Settings, Navigation, and Socials have no collection-local media override. Settings `logo` is a string path, not an image widget.

Other committed expectations for the global root are `apps/web/src/lib/admin/decap-config.test.ts:23,54`, `scripts/smoke-cms-local.ts:366`, `scripts/verify-environment-model.ts:201`, `apps/backend/test/scripts/environment-model.test.ts:37`, and `README.md:703,791`.

## `/admin/media` route allowlist

| Route key | Allowed source directory | Matching configured collection root |
| --- | --- | --- |
| `about` | `apps/web/src/content/about/` | About singleton |
| `artists` | `apps/web/src/content/artists/` | Artists |
| `distro` | `apps/web/src/content/distro/` | Distro |
| `home` | `apps/web/src/content/home/` | Home singleton |
| `news` | `apps/web/src/content/news/` | News |
| `releases` | `apps/web/src/content/releases/` | Releases |
| `services` | `apps/web/src/content/services/` | Services singleton |

The seven route roots exactly cover the seven collection-owned configured roots (`apps/web/src/pages/admin/media/[collection]/[asset].ts:9-17`). The global uploads root is not route-allowlisted.

The static-path allowlist accepts direct files only and these extensions/MIME types (`:19-27`, `:44-70`):

| Extension | Response `Content-Type` |
| --- | --- |
| `.avif` | `image/avif` |
| `.gif` | `image/gif` |
| `.jpeg` | `image/jpeg` |
| `.jpg` | `image/jpeg` |
| `.png` | `image/png` |
| `.webp` | `image/webp` |

The generated route is one asset segment deep. Its GET handler checks the collection key, then resolves and reads the supplied asset without a separate extension, containment, or missing-file guard; unknown extensions fall back to `application/octet-stream`, and responses use `public, max-age=31536000, immutable` (`:73-95`).

## Global uploads inventory

Common prefix: `apps/web/src/content/uploads/`.

No upload filename or full upload path has a repository text reference. Every row is therefore explicitly unreferenced at its upload path. The last column records whether a byte-identical copy is currently consumed elsewhere.

| Upload file | Type | Bytes | Byte-identical counterpart(s) | Current consumer of identical copy |
| --- | --- | ---: | --- | --- |
| `about-dark-recording-studio-vintage-equipment.jpg` | JPEG | 105,790 | `apps/web/src/content/about/dark-recording-studio-vintage-equipment.jpg`; `apps/web/src/content/home/dark-recording-studio-vintage-equipment.jpg`; upload `home-dark-recording-studio-vintage-equipment.jpg` | None; current About and Home image fields use other files |
| `artists-chronoboros-band-logo.jpg` | JPEG | 189,825 | `apps/web/src/content/artists/Chronoboros-band-logo.jpg` | `apps/web/src/content/artists/chronoboros.md:6` → `image` |
| `artists-mass-culture-photo.jpg` | JPEG | 74,595 | `apps/web/src/content/artists/mass-culture-photo.jpg` | None; current Mass Culture `image` uses `481665433_641184112172905_3870068485311478607_n.jpg` |
| `artists-ouranopithecus-band-photo.jpg` | JPEG | 292,663 | `apps/web/src/content/artists/Ouranopithecus-band-photo.jpg` | `apps/web/src/content/artists/ouranopithecus.md:6` → `image` |
| `brand-bandcamp-button-black.png` | PNG | 1,209 | `apps/web/src/content/brand-assets/bandcamp-button-black.png`; `apps/web/public/assets/images/brand/bandcamp-button-black.png` | No collection field; public copy is the app-shell provider icon (`apps/web/src/components/app-shell/AppShellRoot.tsx:178`) |
| `brand-logo.png` | PNG | 131,353 | `apps/web/src/content/brand-assets/logo.png` | None; Settings `logo` points to a different-byte public file at `/assets/images/brand/logo.png` |
| `brand-tidal-button-black.png` | PNG | 1,166 | `apps/web/src/content/brand-assets/tidal-button-black.png`; `apps/web/public/assets/images/brand/tidal-button-black.png` | No collection field; public copy is the app-shell provider icon (`apps/web/src/components/app-shell/AppShellRoot.tsx:179`) |
| `distro-cassette-tape.jpg` | JPEG | 98,991 | `apps/web/src/content/distro/cassette-tape.jpg` | `apps/web/src/content/distro/the-vagina-lips-random-tapes-cassette.json:6` → `image` |
| `distro-t-shirt.jpg` | JPEG | 71,994 | `apps/web/src/content/distro/t-shirt.jpg` | None |
| `distro-vinyl-records.jpg` | JPEG | 160,178 | `apps/web/src/content/distro/vinyl-records.jpg` | None |
| `home-dark-recording-studio-vintage-equipment.jpg` | JPEG | 105,790 | `apps/web/src/content/about/dark-recording-studio-vintage-equipment.jpg`; `apps/web/src/content/home/dark-recording-studio-vintage-equipment.jpg`; upload `about-dark-recording-studio-vintage-equipment.jpg` | None; same payload as the first row |
| `home-hero-live-band.jpg` | JPEG | 420,742 | `apps/web/src/content/home/hero-live-band.jpg` | `apps/web/src/content/home/site.json:5` → `hero.image` |
| `news-dark-concert-venue.jpg` | JPEG | 113,765 | `apps/web/src/content/news/dark-concert-venue-.jpg` | None; current News entries use `img_0697.jpg` or Release-owned images |
| `releases-mass-culture-barren-point-cover.jpg` | JPEG | 137,915 | `apps/web/src/content/releases/mass-culture-barren-point-cover.jpg` | None; current Release cover fields use other files |
| `services-merch-printing.jpg` | JPEG | 61,535 | `apps/web/src/content/services/merch-printing.jpg` | None; current Services item uses `merch-printing-soft-matte.jpg` |
| `services-tour-booking.jpg` | JPEG | 101,872 | `apps/web/src/content/services/tour-booking.jpg` | None; current Services item uses `tour-booking-soft-matte.jpg` |
| `services-vinyl-press-machine.jpg` | JPEG | 408,022 | `apps/web/src/content/services/vinyl-press-machine.jpg` | None; current Services item uses `image-asset.webp` |

## Baseline findings

1. The uploads directory contains 17 tracked files: 14 JPEGs and 3 PNGs, totaling 2,477,405 bytes.
2. All 17 are byte-identical mirrors of files elsewhere. There are 16 unique payloads because the two recording-studio uploads duplicate each other.
3. Zero upload paths are referenced by committed content or runtime text. Four mirror active collection field assets: two Artist images, one Distro image, and the Home hero image.
4. Two upload files mirror public player-button assets but have no collection owner. The remaining 11 rows have no active consumer among their identical copies.
5. Route coverage is complete for the seven configured collection-owned roots but absent for the configured global uploads root. The top-level Media surface is documented and tested as present, while its files have no current collection-field references.
6. Upload filename prefixes imply owners (`home-`, `artists-`, and similar), but no config or schema enforces that ownership or maps a selected global asset back to a collection-relative path.
7. Two News entries reference `../releases/...` images outside the configured News root. Astro accepts those paths, but the one-segment `/admin/media/news/<asset>` contract and preview fallback for `./` paths do not express that cross-collection ownership directly.
8. Route hardening, mirror deletion, and top-level Media behavior remain intentionally deferred to tasks 14.1-14.14.
