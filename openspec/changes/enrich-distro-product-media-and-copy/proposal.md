## Why

The current catalog snapshot contains 101 Distro items, including 39 CDs represented by generated front mockups, while many summaries remain generic metadata sentences. Store detail pages need source-backed physical-product media and concise release copy that reflects each actual item.

## What Changes

- Keep each Distro entry's existing `image` as its primary card, detail, cart, metadata, and provider-projection image; add an optional repo-owned secondary image list with required alt text.
- Render secondary images as a static responsive gallery on Distro Store Item detail pages, without a client carousel, lightbox, duplicate card model, or new dependency.
- Research every CD through official Bandcamp first and the official band or label Facebook presence when needed, using the Chrome GPT extension and Computer Use only as fallback; accept photos that show the actual stocked CD packaging, including jewel case, digipak, softcase, or other real edition presentation.
- Replace a generated CD mockup as the primary image when a verified official physical-product photo is available, and add further verified views as secondary images when useful.
- Retouch accepted physical-CD photos into consistent 1440x1800, 4:5, sRGB assets while preserving the photographed product, packaging, artwork, text, geometry, edition colors, discs, wear, and overlapping hands unchanged.
- Review every current Distro summary against official Bandcamp and/or official band or label Facebook evidence; retain supported copy and rewrite only generic, unsupported, inaccurate, or stale text using concise original wording.
- Maintain one compact implementation ledger keyed by Distro content entry id, reconciled to the Distro Inventory Source and recording copy evidence plus a per-asset filename-to-source-and-rights mapping, CD-photo status, and blockers.
- Do not substitute fan, review, marketplace, resale, search-snippet, or unrelated-edition material for missing official evidence.
- Update Astro and Sveltia editorial contracts for the optional gallery while keeping the Distro Inventory Source, pricing, stock, checkout, and Stripe Price authority unchanged.

## Capabilities

### New Capabilities

- `distro-editorial-content`: Define source-backed Distro summaries, verified physical-product CD media, and optional detail galleries.

### Modified Capabilities

- `site-images`: Accept verified manually researched official product photos as Distro Content Images and distinguish the primary projected image from detail-only secondary images.
- `sveltia-editorial-operations`: Expose the optional Distro gallery as schema-backed editorial media with required per-image alt text.

## Impact

- `apps/web/src/content/distro/*.json` and collection-owned Distro image assets
- `apps/web/src/content.config.ts` and the generated Sveltia Distro collection fields
- Distro detail-route media lookup and `/store/[slug]/` rendering; shared `StorePageEntry`, Store Item, card, cart, checkout-return, and provider projections remain unchanged
- One change-local research ledger and completeness check, `pnpm assets:check`, focused content/schema/detail tests, catalog artifact drift checks, and mobile/desktop Browser Use verification
- Existing `scripts/data/distro-inventory-source.json` identities and `tools/artwork-fetcher` evidence may be reused; no browser automation is added to the artwork-fetcher
- No new inventory source, remote image runtime, provider scraper, CMS commerce field, Stripe Price change, D1 change, checkout change, or dependency
- No duplicate full-frame photo may represent different products; a shared official group photo requires distinct title-specific source-derived crops.
