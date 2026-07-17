## Context

The current `/releases/` route already separates the catalog into an exclusive latest feature, one selected upcoming release, and the remaining releases. The completed but unarchived `clarify-releases-page-hierarchy` change owns those tier and empty-state contracts. This change composes those roles into the user-selected **Evolved Split Showcase** without changing selection logic, content authority, routes, or interactions.

The route is statically rendered by Astro and can also be swapped into the persistent app shell. Its latest release owns the only first-viewport priority image, player trigger, detail link, and optional commerce link. Upcoming content is informational and the remainder uses the shared `ReleaseCard` component. The redesign must preserve that ownership and remain usable with long content, absent optional fields, enlarged text, reduced motion, and a 320 CSS-pixel viewport.

Visual evidence lives in `docs/releases-page-design-research.md` and `docs/ui-mockups/releases-evolved-split-showcase-poc.png`. The PoC establishes hierarchy and composition, not literal copy, dimensions, fonts, or interaction behavior. OpenSpec requirements, repository tokens, real content, and accessible reflow are authoritative.

## Goals / Non-Goals

**Goals:**

- Give `/releases/` one compact catalog identity.
- Join the existing editorial tiers into one asymmetric, rule-bounded composition.
- Keep the latest feature dominant, Upcoming complete, and remaining cards at normal proportions.
- Preserve semantic and keyboard source order across direct and app-shell navigation.
- Reflow without clipping or horizontal scrolling at narrow widths and enlarged text.
- Add focused route-contract and browser acceptance coverage.

**Non-Goals:**

- Changing role selection, release data, copy, schema, dates, artwork, or commerce ownership.
- Changing player, overlay, app-shell, routing, Store, cart, checkout, CMS, API, or deployment behavior.
- Changing shared `InternalPageHero` or `ReleaseCard` behavior.
- Adding JavaScript layout state, dependencies, fonts, assets, animation systems, or tokens.
- Archiving `clarify-releases-page-hierarchy` as a side effect of this proposal.

## Decisions

### 1. Archive the hierarchy predecessor before applying this change

Implementation starts after `clarify-releases-page-hierarchy` is archived and its completed requirements are present in the baseline `release-catalog-presentation` spec. This delta adds distinct composition requirements rather than restating tier ownership.

**Why:** one baseline must own the existing three-tier behavior before this design builds on it.

**Alternative:** duplicate the hierarchy requirements here. Rejected because later archival could create competing contracts.

### 2. Replace the shared hero only at this call site

`apps/web/src/pages/releases/index.astro` will render a route-local intro with one `Catalog` eyebrow and one `Releases` `h1`. The heading retains `transition:name="internal-page-hero-title"`; page metadata remains with `SiteLayout`.

**Why:** the selected direction needs compact spacing and no duplicate outlined label, while the shared hero has twelve unrelated consumers.

**Alternative:** add a shared compact variant. Rejected because it encodes a one-route composition in a global API.

### 3. Preserve DOM order with a twelve-track CSS Grid

Source order remains latest feature, Upcoming, then Our Releases. At `64rem` and above, `.releases-page-layout` uses `repeat(12, minmax(0, 1fr))`: latest occupies tracks 1–8, Upcoming 9–12, and Our Releases all twelve tracks on the next row. Below `64rem`, roles stack in source order.

The showcase owns a continuous rule system. Outer and internal separators define the split and lower row without doubled borders. Grid children use `min-width: 0`; CSS `order` is forbidden.

**Why:** native grid expresses the asymmetry without duplicating markup or adding runtime measurement.

**Alternative:** separate desktop/mobile trees or JavaScript placement. Rejected because they risk inconsistent links, focus, and player ownership.

### 4. Size from content, not the raster PoC

No showcase region gets a fixed block size. Titles, metadata, summaries, formats, and actions wrap; rows grow intrinsically. At narrow widths, the vertical split disappears and roles use the full width. Existing reduced-motion rules remain authoritative.

**Why:** real content and text enlargement cannot safely match fixed raster proportions.

**Alternative:** fixed heights and cropped copy. Rejected because they hide content and fail reflow.

### 5. Preserve the remaining-catalog card contract

The lower row keeps `ReleaseCard variant="framed-artwork"` and the current responsive two/three-column grid. One remaining release stays in the first normal grid column; it is not stretched, centered, or paired with filler.

**Why:** the redesign changes page composition, not the reusable card or catalog density.

**Alternative:** a bespoke sparse-catalog card. Rejected as an unnecessary variant.

### 6. Preserve interactions and image loading

The latest feature keeps artwork/detail links, `MusicStreamingServiceListenTrigger`, optional commerce action, and the only priority image. Upcoming remains lazy-loaded. Remaining-card loading and prefetch behavior stay unchanged. Actions may wrap, but their labels, targets, focus treatment, and minimum sizes remain intact.

**Why:** player, overlay, commerce, and image-performance boundaries are outside this redesign.

**Alternative:** rebuild actions to literally match the PoC. Rejected because the PoC is hierarchy evidence, not runtime authority.

### 7. Use focused tests plus Browser Use acceptance

Add `apps/web/src/styles/releases-page-layout.test.ts` to assert route identity, source order, wide placement, full-width lower row, sparse-card alignment, and narrow reflow. Existing release-selection tests continue to own role assignment.

Browser acceptance covers direct and shell-managed navigation at desktop, 390px, and 320px; enlarged text or zoom; reduced motion; focus order; player launch/minimize/stop; detail overlay; optional commerce navigation; each current release appearing once; overflow; and console errors.

**Why:** the focused test catches contract drift while browser checks prove rendered and cross-boundary behavior.

**Alternative:** a full-page snapshot. Rejected as brittle and weak at explaining failures.

## Risks / Trade-offs

- **[Risk]** Long copy makes the wide split uneven. **Mitigation:** intrinsic sizing, wrapping, `min-width: 0`, and enlarged-text checks.
- **[Risk]** Optional tiers create doubled or orphaned rules. **Mitigation:** the showcase owns separators and omission-path checks cover each role.
- **[Risk]** Removing `InternalPageHero` regresses shell title transitions. **Mitigation:** retain the transition name and test direct plus shell navigation.
- **[Trade-off]** One remaining card leaves deliberate empty space. **Mitigation:** preserve normal width and left alignment as catalog pacing.
- **[Trade-off]** The PoC is not pixel-matched. **Mitigation:** prioritize project tokens, live copy, and accessibility.

## Migration Plan

1. Run the main-worktree guard, archive `clarify-releases-page-hierarchy`, and confirm its requirements reached baseline.
2. Add the focused layout test and confirm it fails for the intended current-page differences.
3. Replace only the Releases hero call site and compose the existing role blocks inside the showcase.
4. Add release-scoped CSS for wide grid, separators, intrinsic sizing, sparse catalog, and narrow reflow.
5. Run unit, check, build, strict OpenSpec validation, diff checks, and Browser Use acceptance.

Rollback is a normal revert of the route, CSS, and focused test. No data, schema, API, or migration rollback is required.

## Open Questions

None. Direction, hierarchy, breakpoint, sparse-catalog behavior, and preserved contracts are decision-complete.
