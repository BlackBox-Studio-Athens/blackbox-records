# Design

## Context

See [proposal.md](proposal.md) for the scope. This low-traffic catalog already has ordered Distro galleries, EmDash media controls, accepted publication, and a working item-page gallery. The change needs only a preview selection, card rendering, and editor help.

The relevant paths are `store-collection.ts`, `StoreItemCard.astro`, `DistroCard.astro` for the Distro listing, the Store activation/snapshot hooks, and staff `ContentFields.tsx`. Both listing cards consume the same selection; the Distro home variant remains unchanged. The existing detail template at `apps/web/src/pages/store/[slug]/index.astro` remains unchanged.

## Goals / Non-Goals

**Goals:** Reuse the current media/editor paths and add the confirmed two-photo interaction with a small amount of CSS and native image handling.

**Non-Goals:** New schemas or dependencies, gallery rewrites, a carousel/lightbox, background imports, retries, monitoring, or feature-specific capacity tooling.

## Decisions

### 1. Reuse the existing gallery and editor

Keep the optional `gallery: [{ image, image_alt }]` contract and existing More images controls. BlackBox currently stores this field as JSON in EmDash; its save/publication path already validates and resolves nested media. Converting it to a native repeater would add migration work without improving this feature. Existing validation, draft privacy, and media retention rules remain sufficient.

Add this explanation beside More images and to the existing editor documentation:

> The first extra photo different from the main image appears on hover or keyboard focus. All gallery photos appear on the item page.

### 2. Select once and render with CSS

In the existing collection join, add nullable `previewImage` to the presentation-only `StoreCollectionEntry`, using the gallery row's existing type. Select the first row whose resolved original `image.src` differs from the primary. The join already has the Distro record; no extra lookup or shared normalizer is needed. Release-derived items and galleries without a different image produce no alternate.

Leave the detail gallery and commerce models unchanged. Render one decorative alternate layer above the primary and its gradient, beneath readable labels. Use a solid frame background and `object-fit: contain` so the complete photo is visible and the primary cannot show through letterboxing. Keep existing card/CD geometry.

CSS fades the ready layer over roughly 200–300 ms on fine-pointer image hover or link `:focus-visible`. Reduced motion disables the fade. Keep normal links and Coverflow's existing side-cover selection/active-cover navigation; the photo effect adds no click handler or gesture state.

Integration with main's formatted descriptions keeps the primary `.prose-card-link` around the image and stretches its pseudo-element across the card. The image remains above that layer for image-only hover; description links remain separate and clickable. Keyboard focus on the primary link reveals the alternate and outlines the whole card. Link layout rules stay with the existing unlayered prose styles so cascade layers cannot restore the old absolute positioning.

### 3. Keep loading native and fallback small

Use the existing responsive image widths, size hints, and owned-media paths. Add one lazy, non-high-priority alternate per eligible card; preserve primary-image priority. Native near-viewport loading and responsive candidate changes are acceptable. No custom preload scheduler or bandwidth benchmark is needed for this catalog.

A small root-scoped native `load`/`error` helper reveals only successfully loaded alternates. Register listeners before checking cached images through `complete`/`naturalWidth`, and keep the primary visible on pending/error states. CSS still owns hover/focus, so finishing a load does not revive an old hover.

Reuse the Store activation/cleanup hook for all listing routes, including Merch. Clear the transient ready marker through existing snapshot sanitation and recheck restored images. This is ordinary lifecycle integration, not a new state machine or per-card React island. Without enhancement, primary cards and the static detail gallery still work.

### 4. Use ordinary editorial photo updates

Start with Band in the Pit's `band-in-the-pit-2016-cassette`, then the requested cassette/Distro items with usable retained or official Bandcamp photos. Reuse current CMS records and existing provenance notes. Record selected photos and any actual exclusions; do not create another inventory format or turn this into unrelated catalog research.

The [official Band in the Pit page](https://bandinthepit.bandcamp.com/album/2016) exposed five candidates in the 2026-09-22 inspection. The first is already retained as `tools/artwork-fetcher/source-assets/cassettes/band-in-the-pit-2016-bandcamp-product.jpg` (1200×1032):

- [0013073977](https://f4.bcbits.com/img/0013073977_10.jpg)
- [0013056307](https://f4.bcbits.com/img/0013056307_10.jpg), [0013056306](https://f4.bcbits.com/img/0013056306_10.jpg), [0013056277](https://f4.bcbits.com/img/0013056277_10.jpg), [0013056278](https://f4.bcbits.com/img/0013056278_10.jpg)

Choose useful distinct views of the correct edition under the existing [photography standards](../enrich-distro-product-media-and-copy/specs/site-images/spec.md); five candidates need not mean five uploads. Reuse established permission evidence. For new Band in the Pit photos, reconcile the recorded `cc-by-nd-4.0` note with the page's `all rights reserved` display before accepting them. An unresolved photo does not block fixture-based code work.

## Risks / Trade-offs

- One additional photo adds page weight → use existing responsive sizes and native lazy loading.
- Failed images or restored shell markup can show the wrong state → keep the primary underneath and check loading/restoration once in the existing lifecycle.
- Photo edition or source uncertainty → leave that asset pending and use the existing evidence workflow.

## Verification

Keep checks proportional to the changed behavior:

- Extend the existing projection test with no alternate, primary duplicates, ordered selection, and Release exclusion. Add one focused loading/lifecycle regression covering success, failure, and cached restoration.
- Run a representative desktop/mobile browser smoke, not every combination of route, viewport, and input. Cover cassette and CD framing, keyboard/reduced motion, touch navigation, the existing full detail gallery, and a primary-only item. Exercise Coverflow, expanded/search results, direct entry and one cached/back return; spot-check All/Distro/populated Merch wiring. Disable JavaScript once to confirm the existing fallback.
- Reorder and publish one Local gallery through the existing save → preview → review → publish flow. Confirm the published order controls the preview and draft changes remain private. Reuse current CMS/publication checks rather than adding conflict, authentication, recovery, or media-retention suites.
- Run `pnpm validate`, `pnpm validate:editor`, and applicable Local checks from [content publication](../../../docs/content-publication.md) and [content workspace](../../../docs/content-workspace.md). Run `pnpm assets:check` if repository assets change. Existing gates remain required; there is no additional performance study or feature-specific evidence system.

For this planning edit, strict OpenSpec validation and formatting are sufficient. Existing Impeccable gates govern later UI implementation.

## Migration Plan

Local acceptance on September 22 exposed an existing bootstrap failure: the native publication guard received hydrated navigation booleans (`1`/`0`). The user explicitly approved including a focused fix and regression test. Newly imported records have no saved revision, so the guard normalizes only those two known navigation fields from numeric `0`/`1` before existing validation, matching the current publication conversion. Other invalid values remain rejected. This does not change the write schema, authentication, native revision conflict checks or hosted authorization.

1. Implement and verify locally using existing assets or test fixtures.
2. Use the normal UAT code workflow and EmDash publication for the selected photos. Existing accepted galleries also gain the preview when code is released.
3. Promote the reviewed code candidate and publish PRD photos through the existing, separately authorized procedures. Use each environment's own media IDs and preserve existing release/checkout gates.
4. Use the existing [publication](../../../docs/content-publication.md) and [Free-tier](../../../docs/cloudflare-free-tier.md) runbooks for hosted preflight, budgets, and batch limits. Bulk imports or repeated probes still require their bounded pilot. This feature adds no extra worksheet, pilot, or monitoring beyond those rules.
5. Roll back photos by republishing the prior gallery order/selections, retaining media and history. Code rollback uses the normal reviewed release process.

The exact photo set is an editorial outcome. Report any remaining content work separately from code acceptance; no architecture decision depends on it.
