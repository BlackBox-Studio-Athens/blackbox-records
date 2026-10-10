# Proposal

## Why

BlackBox's Store spends much of a laptop's first screen on orientation and Coverflow controls, while the expanded catalogue uses large cards and several competing typefaces. Shoppers need to see more records, browse by artist, and find useful release information such as a tracklist before deciding to buy.

## What Changes

- Make the complete **Grid** the default on every Store collection. Offer **Coverflow** second, by explicit choice, using the existing controller and cards.
- Use the available desktop width for a compact **Artists** pane and four product columns, keeping comfortable outer gutters and the BlackBox monochrome identity. Collapse browse tools into a native disclosure on smaller screens.
- Derive a single-choice artist filter from existing Release artist relationships and Distro `artist_or_label` values. Combine it with the existing local search and Distro format selection without a remote filtering service or new artist taxonomy.
- Reduce repeated headings, card padding, image height, tracking, and duplicate metadata. Retain the shared primary-section H1 typography; compact its surrounding spacing. Keep titles, artist, the actual sellable format, price, and availability easy to scan.
- Use two font roles inside Store content: Veneer for public titles and Inter for controls, prices, metadata, tracklists, and prose. Keep the site's other typography outside this change.
- Present item details as a compact image/purchase composition followed by clearly headed **Info**, **Tracklist**, and existing **More views** content. Reuse existing release listening and editorial links; show only supported information.
- Add optional structured EmDash JSON `tracklist` fields to Releases and Distro, edited through contained Track, Side and Disc controls. Reuse existing summaries, Release body/credits, and known facts for Info; no new Distro rich-text field or media pipeline. Use validated embedded value objects for format-specific tracklists: vinyl/cassette sides and CD discs, with track titles and optional durations. Add no track database or catalogue enrichment job.
- Carry these fields through existing validation, preview, accepted snapshots, runtime rendering, and retained static builds. Old entries remain valid and omit absent sections.

The reference is Dunk's [catalogue](https://dunkrecords.com/collections/all) and [item information](https://dunkrecords.com/products/brutus-unison-life-lp), inspected on 2026-09-22. Borrow its useful hierarchy and artist discovery, keeping BlackBox's visual identity and commerce boundaries.

## Capabilities

### New Capabilities

- `store-item-information`: Compact, source-backed item information and optional tracklists alongside existing purchase, listening, and image features.

### Modified Capabilities

- `store-catalog-categories`: Compact orientation, artist discovery, responsive four-column grids, consistent Store typography, and optional Coverflow.
- `distro-coverflow-catalog-disclosure`: Grid-first Distro groups, deliberate Coverflow entry, and filtered grid behavior.
- `store-coverflow-interactions`: Shared grid-first initialization and cleanup, with existing Coverflow gestures retained after activation.
- `distro-format-jump-navigation`: Put format tools in the responsive browse pane and let format selection compose with artist and text filters.
- `distro-search`: Reuse local matching across Store browse controls and retain active facets when text search clears.
- `site-images`: Size images for compact square grids and apply initial loading priority to the visible grid rather than an automatic Coverflow preview.
- `emdash-editorial-operations`: Author optional tracklists alongside existing item information through the current EmDash workflow.

## Impact

- **Web:** Store collection/Distro templates, shared Store cards, item detail template, Store-scoped CSS, existing search/controller lifecycle, image sizes, and shell snapshot sanitation.
- **Content and staff:** Shared content schemas, generated EmDash field definitions, supported additive schema setup, existing staff form primitives, snapshot/export mapping, and preview mapping. No new CMS, plugin, dependency, public API, or commerce field.
- **Coordination:** Preserve the completed `add-store-wide-search` and `add-store-item-listening-context` behavior. Coordinate the shared card with `add-store-product-photo-hover`; its alternate image must inherit the new geometry. Preserve `enrich-distro-product-media-and-copy` media ownership and `complete-shopper-purchase-information` copy. Coordinate with `add-catalog-wide-listening` so its Listen actions remain separate from product links, and with `make-editorial-preview-one-to-one` for preview parity. These plans own their respective features; this change does not implement them.
- **Cost and scope:** One local filter pass over the existing small catalogue; existing listing-price request only. No pagination, virtualization, new cache, background jobs, analytics experiment, or additional state library. Content entry is a separate editorial activity; this change supplies the fields and representative Local acceptance examples.
- **Verification:** Focused checks in existing filtering/controller and content tests, representative desktop/mobile/keyboard browser checks, `pnpm validate`, `pnpm validate:editor`, and the relevant existing Local content-publication checks. This proposal does not authorize hosted schema changes, publication, deployment, or checkout launch.
