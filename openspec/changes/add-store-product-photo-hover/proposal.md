# Proposal

## Why

BlackBox already has EmDash media and item-page galleries, but shoppers see only the primary photo while browsing. Add the confirmed [Dunk Records](https://dunkrecords.com/collections/all) interaction: a second photo on hover, with the full gallery on the item page.

## What Changes

- Show the first gallery image different from the primary on hover or visible keyboard focus; restore the primary afterwards. Use one alternate, without cycling.
- Apply this through the shared Store card for Distro-derived items, including cassettes, across All, Distro, populated Merch, Coverflow, expanded catalogs, and search results. Items without an alternate and Release-derived items retain their current presentation.
- Reuse the existing **More images** editor and **More views** detail gallery. Add a short explanation that gallery order chooses the preview photo.
- Add available, approved Bandcamp photos through normal EmDash editing, starting with Band in the Pit's `2016` cassette, then the other requested cassette/Distro items with usable photos.
- Keep primary-image ownership for cart, checkout, metadata, and provider presentation. Preserve existing navigation, full-photo framing, keyboard/touch access, reduced motion, and primary-image fallback.

This is a small presentation change for a low-traffic catalog. Native responsive/lazy images and ordinary editorial updates are sufficient; the feature needs no new service, dependency, schema, or import automation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-images`: Alternate-photo browsing through the existing cards, with accessible navigation and loading fallback.
- `emdash-editorial-operations`: Explain how existing gallery ordering chooses the browse photo.

## Impact

- Web: the existing collection projection, shared Store card/styles, and a small image-readiness hook in the current Store lifecycle.
- Staff: help text beside **More images**; existing media, draft, preview, and publication controls remain the authoring path.
- Content: current EmDash records and existing source notes. Repository catalog files remain bootstrap/recovery inputs.
- Acceptance: focused selection/loading checks, a representative browser/editor smoke test, and required repository gates.
- Coordination: this supplies the browse-use exception allowed by [enrich-distro-product-media-and-copy](../enrich-distro-product-media-and-copy/proposal.md). Its photography standards and existing gallery/publication contracts continue to apply.
