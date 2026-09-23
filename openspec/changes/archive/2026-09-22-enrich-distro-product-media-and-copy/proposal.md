## Why

The current catalog snapshot contains 101 Distro items, including 39 CDs represented by generated front mockups, while many summaries remain generic metadata sentences. Store detail pages need source-backed physical-product media and concise release copy that reflects each actual item.

## What Changes

- Keep each Distro entry's existing `image` primary and its implemented optional ordered gallery with required alt text; remaining content work uses CMS-owned media and accepted snapshots.
- Render secondary images as a static responsive gallery on Distro Store Item detail pages, without a client carousel, lightbox, duplicate card model, or new dependency.
- Research unresolved/current CDs through official Bandcamp first, then official artist/label websites, Instagram or YouTube using the native Codex browser; Facebook is optional when available and permitted. Accept only the actual stocked CD edition and packaging.
- Replace a generated CD mockup as the primary image when a verified official physical-product photo is available, and add further verified views as secondary images when useful.
- Retouch accepted physical-CD photos into 1440x1440 sRGB primaries and natural-proportion galleries, preserving source-derived products and overlapping hands. Remove blurred duplicate padding; retain strong real scenes or use matte charcoal behind safely isolated products.
- Retain completed summary review and reconcile changed/new CMS records against official artist/label evidence; rewrite only unsupported or stale copy.
- Maintain the existing content-ID ledger against current CMS records, preserving legacy inventory mappings and per-asset source/rights evidence, CD-photo status and blockers.
- Do not substitute fan, review, marketplace, resale, search-snippet, or unrelated-edition material for missing official evidence.
- Reuse the shared Astro/EmDash gallery contract and Items publication path while preserving pricing, stock, checkout and Stripe Price authority.

## Capabilities

### New Capabilities

- `distro-editorial-content`: Define source-backed Distro summaries, verified physical-product CD media, and optional detail galleries.

### Modified Capabilities

- `site-images`: Accept verified manually researched official product photos as Distro Content Images and distinguish the primary projected image from detail-only secondary images.
- `sveltia-editorial-operations`: Historical delta directory retained for this existing change; its gallery requirement now applies to EmDash and must not restore Sveltia. Reconcile the capability destination with the EmDash migration before eventual spec sync.

## Impact

- EmDash Distro drafts and CMS media; repository content remains bootstrap/recovery history
- Shared content-model schema, content-reader lookup and Items publication
- Distro detail-route media lookup and `/store/[slug]/` rendering; shared `StorePageEntry`, Store Item, card, cart, checkout-return, and provider projections remain unchanged
- Existing research ledger/completeness checks, applicable asset/schema checks, scoped runtime catalog verification and mobile/desktop acceptance of the published snapshot
- Existing `scripts/data/distro-inventory-source.json` identities and `tools/artwork-fetcher` evidence may be reused; no browser automation is added to the artwork-fetcher
- No new inventory source, remote image runtime, provider scraper, CMS commerce field, Stripe Price change, D1 change, checkout change, or dependency
- No duplicate full-frame photo may represent different products; a shared official group photo requires distinct title-specific source-derived crops.
