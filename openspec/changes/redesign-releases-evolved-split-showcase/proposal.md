## Why

The Releases page now assigns content to the correct editorial tiers, but its repeated page label, generous empty intro, disconnected tier rules, and underfilled remainder grid weaken orientation and make the three-entry catalog feel less intentional than the selected design direction. Adopt the user-selected **Evolved Split Showcase** so the route reads as one authored BlackBox catalog while preserving every existing release, player, overlay, commerce, and image contract.

## What Changes

- Replace the route's repeated `Releases` eyebrow and heading with one compact `Catalog` eyebrow and one `Releases` `h1`; keep the shared `InternalPageHero` unchanged for its other consumers.
- Present Latest, Upcoming, and Our Releases inside one rule-bounded asymmetric showcase: the latest release remains dominant, Upcoming remains complete inside a narrower right rail, and the remaining catalog starts in a full-width lower row.
- Keep Feature Wall, Upcoming, then Our Releases in semantic and keyboard source order even when CSS places them in the wide composition.
- Keep a sparse remaining catalog left aligned at normal release-card proportions; do not stretch one entry, center it, or add filler. Multiple entries retain the existing responsive card grid.
- Recompose the showcase at narrow widths without horizontal scrolling, fixed-height clipping, hidden metadata, or reordered content.
- Preserve role selection, release order, current actions, player triggers, detail overlays, commerce-link ownership, image priority/loading, focus, target sizes, optional content, empty-section behavior, artwork motion, and reduced-motion behavior.
- Retain the selected PoC and research memo as visual evidence; OpenSpec, repository tokens, real content, and accessible reflow remain authoritative over raster imperfections.
- Add one focused layout contract test for the route-local identity, source order, wide showcase, and narrow reflow.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `release-catalog-presentation`: Adds the compact catalog identity and unified Evolved Split Showcase contract around the existing featured, selected-upcoming, and remaining-catalog roles.

## Impact

- Primary implementation surfaces: `apps/web/src/pages/releases/index.astro` and release-scoped rules in `apps/web/src/styles/global.css`.
- Focused presentation coverage: `apps/web/src/styles/releases-page-layout.test.ts`; existing `release-feature` selection tests remain unchanged.
- Planning evidence: `docs/releases-page-design-research.md` and `docs/ui-mockups/releases-evolved-split-showcase-poc.png`.
- The completed but unarchived `clarify-releases-page-hierarchy` change is an apply prerequisite because it owns the current three-tier contracts. Archive it before implementation so those requirements become baseline; this proposal does not archive it implicitly.
- No API, route, dependency, font, asset-source, content-schema, CMS field, Store, cart, checkout, deployment, or migration change.
