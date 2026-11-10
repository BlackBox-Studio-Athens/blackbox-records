# Design

## Context

See proposal.md for motivation. Current state on `d4d98b40`:

- `SiteLayout.astro` and `RedirectLayout.astro` import `apps/web/src/styles/global.css`. It holds Tailwind, shadcn, prose, fonts and about 8,700 lines of hand-written rules: 104.6 KB unlayered, 57.7 KB in `@layer components`, 37.4 KB of utilities (emitted sizes).
- Some components already own their CSS and Astro links it only where used: `StoreCrate.astro` → `crate/crate.css`, `StoreBrowsePane.astro` → `store-chrome.css`, `StoreImageGallery.tsx`, `InternationalOrderNotice.tsx`. The Store collection page emits `StoreCollectionPage.*.css`.
- Shell navigation reads the destination's `<link rel="stylesheet">` list. `adoptShellPageStylesheets` appends the missing links and never removes one, but it does not wait for them. On the throttled phone profile, Store CSS finished loading 170 ms after the swap and the catalog shifted (CLS 0.0313).
- Detail-overlay fragments do not adopt stylesheets. The Menu, cart drawer, player and gallery can open on every route.
- Evidence and profiling scripts: `.codex-artifacts/seo-implementation-20261022/claude/` (`css-profile.cjs`, `css-dead.cjs`, `repro-shifts.mjs`, `screens.mjs`, the mobile-load reports).

## Goals / Non-Goals

**Goals:**

- Route-owned CSS for whole pages (Store collection, Store Item, checkout and its return pages, Home-only sections, and other single-route sections that the inventory confirms).
- Shell swaps wait, within a bound, for newly linked route CSS.
- A per-route render-blocking CSS byte report, so the gate is checked by a build step rather than by hand.

**Non-Goals:**

- Critical-CSS inlining, CSS-in-JS, removing Tailwind layers or rewriting selectors.
- Changing any visual value, breakpoint, animation or font loading. Font preloads stay under their existing spec.
- Splitting the CSS of surfaces that open on any route (detail overlays, Menu, cart drawer, player, gallery, newsletter, footer).

## Decisions

1. **Wait for route CSS in the loader, before the snapshot resolves.** `shell-page-loader.ts` already adopts the stylesheets after parsing. It will await each new link's `load` or `error`, bounded at 1,000 ms, before it returns the snapshot. A speculative prefetch then warms the CSS too, so a link tap usually finds it loaded. Alternative: wait inside `applyDocumentShellPageSnapshot`. Rejected: apply is synchronous, and its callers schedule transitions around it.
2. **Component-owned CSS files imported by the component that renders the markup.** This follows `crate.css` and `store-chrome.css`. Astro then links the file on exactly the pages that render the component, and shell navigation adopts it through the existing link list. Alternative: per-page `<link>` tags in layouts. Rejected: hand-kept lists drift from the markup.
3. **Keep each moved rule in its original cascade context.** Rules from `@layer components` move inside `@layer components { … }` in the new file. Layer order is fixed by its first declaration, which is in global.css, so layer precedence does not change. Unlayered rules now load after all of global.css. A rule may move only if no later global rule with equal or lower specificity matches the same elements and properties. The inventory checks this, and screenshots verify it.
4. **Move in slices and measure each.** Inventory first, then the largest route-only groups (Home pre-orders, checkout, Store Item, Store collection). Each slice runs its own screenshot comparison. Stop once the byte gate is met, or when the remaining groups are shared.
5. **Gate on emitted bytes, not lab LCP.** Lab LCP on Home tracks the hero text (1.7–3.9 s against a stable 1.4–1.8 s FCP), so it cannot show the effect of the split. The byte gate is deterministic. The `mobile-load` runs are recorded as comparison evidence only.
6. **Report bytes with the existing bundle check.** Extend `scripts/check-runtime-bundle-graphs.ts` (the `performance:bundles` step of `build:web`) to report and enforce render-blocking CSS per route. This is tooling, so under the shared ownership rule Codex implements it; Claude owns the CSS moves, the shell wait and the UI tests.

## Risks / Trade-offs

- [A moved unlayered rule loses to, or now beats, a global rule it used to sit beside] → the cascade inventory per moved group, plus 0-pixel screenshot comparisons on every affected route at both viewports.
- [A component used on several routes pulls its CSS into a shared chunk, reducing the gain] → the byte report shows it; leave that group global.
- [Markup that appears on a route through client rendering, not server rendering, loses its styles] → the inventory lists the islands that render each moved class; such rules stay with the island's component import or stay global.
- [The bounded wait delays navigation on slow links] → it applies only to stylesheets not yet linked, it overlaps the existing fetch and image waits, and it is capped at 1,000 ms.
- [The first navigation to each route adds a CSS request] → measured by the e2e reproduction; prefetch on intent starts it early.

## Migration Plan

Ship as one Software Release after the gate passes. Rollback is a revert of the change; no data, content or provider state is involved. Content Publication is unaffected.

## Open Questions

- Whether Home-only sections also render on Releases (pre-order showcase) is settled by the inventory task. It changes only which group stays global, not the approach.
