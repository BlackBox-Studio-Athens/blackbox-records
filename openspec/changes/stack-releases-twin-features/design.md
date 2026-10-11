# Design

## Context

`selectReleaseMerchandisingEntries` already chooses up to two native editions by editorial priority and keeps those roles stable while offers load. Only the composition changes: the lead/supporting split, its 12-track grid and the phone list row give the second record a much smaller cover. The approved reference is the Releases Stacked Layouts canvas, option A, version 10 (desktop 1440, tablet 768, phone 390).

## Goals / Non-Goals

**Goals:** equal featured covers at every width; one copy order for both featured records; catalog tiles with the same frame; the price beside the action; no visible catalog heading.

**Non-Goals:** editorial selection, ordering and offer rules; Release detail pages; content fixes (the LOTUS summary and cover alt text belong to Content Publication); removing the unused ReleaseCard variants.

## Decisions

- **Twin rows.** Both featured cards share one `releases-feature` block. Phones stack cover then copy; from 40rem each row splits into equal halves with a 1.5rem gap; from 64rem the cover is 29rem beside the copy with a 2.5rem gap. The catalog uses the same 1.5rem column gap, so tablet catalog tiles equal the featured halves. `data-release-role` keeps `lead`, `supporting` and `catalog`, and only the lead image keeps first-viewport priority.
- **Copy order.** Date, title, artist, Listen, summary, formats, status, shipping, price with the edition action, then the pre-order information link. Listen sits with the identity, as on Home, which brings it into the first phone screen.
- **Summary typography.** Featured summaries use the body family at 1rem/1.65 with a 36em measure. This reverses the 10 September 2026 mono-summary requirement: the design system keeps mono for small metadata.
- **Price.** Releases reuses the Store card rule: the matching native listing record's `displayPrice` whenever its `presentationState` is `ready`, including paused or unrecognised availability, where the price stands alone. It reads the existing `/api/store/listing-prices` response; no request is added.
- **Pre-order information.** Featured pre-orders link to the existing pre-order and delivery terms, with Home's wording. The link stays hidden for every other state.
- **Catalog Buy.** An ordinary catalog Buy takes the Store card Buy chrome and the record mark from `StoreBuyIcon`, so the two featured Pre-orders remain the filled primaries. Featured Buy keeps the restrained primary face. Releases does not play the Store card icon flick. Hydration writes the label into its own span, so the mark survives.
- **Accessible names.** The edition action's name is its visible label followed by the release title (from `data-release-name`). Listen gains an optional visually hidden context after its label span, which the shell player never rewrites, so In player keeps the same context.
- **Artwork.** Every Releases cover is contained in a square `#2b2b2b` frame on `#111` without scale; hover keeps the outline and the shared edition engagement.
- **Image slots.** `sizes` follow the new slots with `frameAspectRatio: 1`; the `widths` list is unchanged, so no new image transformations are created.
- **Layout shift.** The price, pre-order badge, shipping line and terms link appear when offers arrive. Desktop keeps the price inside the existing action row. Hydration layout shift is measured at 390 and 1440 against a 0.02 target (route budget 0.1); a line is reserved only if the measurement requires it.

## Risks / Trade-offs

- **Spec archive order.** This change MODIFIES or REMOVES requirements that unarchived changes also edit: `fix-catalog-layout-and-ambient-motion`, `remove-desktop-release-hover`, `share-release-edition-link`, `remove-releases-page-header` and `add-coming-soon-availability`. Archive it after them. Its MODIFIED blocks keep every scenario header from the baseline and those deltas.
- **Stale baseline.** "Releases page presents one compact catalog identity" already contradicts `remove-releases-page-header`; resolve it when those changes are archived.
- **Twin emphasis.** The first editorial priority loses its larger cover; it still leads in order and image priority.
