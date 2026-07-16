## 1. Preconditions and characterization

- [x] 1.1 Run `pnpm openspec:guard`, confirm the canonical main worktree on `main`, inspect `pnpm openspec -- list`, and stop if unrelated local changes overlap the catalog, shell, navigation, sitemap, or module-boundary surfaces.
- [x] 1.2 Complete and archive `improve-site-runtime-performance-round-two`, then compare this change's `frontend-runtime-performance` and `tooling-validation` modified requirements with the newly archived blocks so detailed desktop/mobile load, first/repeat traversal, request, and Browser Use contracts are preserved.
- [x] 1.3 Verify the completed `add-distro-coverflow-catalog-disclosure` tree and archive or equivalently reconcile that change before applying this delta; compare both Coverflow and format-navigation blocks with the new baseline, then rerun strict OpenSpec validation.
- [x] 1.4 Finish, archive, or establish a non-overlapping implementation order for `canonicalize-store-item-ownership`, `full-distro-catalog-source-of-truth`, and other active changes touching Store/Distro inputs; do not rewrite their content, inventory, provider, or ownership decisions in this IA change.

  2026-07-15 order: Round Two, Coverflow disclosure, and canonical Store Item ownership are archived. This change consumes their baselined presentation contracts and canonical Store Item projection only. `full-distro-catalog-source-of-truth` remains active solely for explicit PRD-open catalog promotion (task 7.4); this IA slice does not edit its Distro content, inventory, provider, price, checkout, or ownership inputs.

- [x] 1.5 Add or confirm characterization coverage for the current 81 canonical Store Items, the Caregivers Release-to-Distro relation, Distro group ordering, Store listing output, navigation sorting, shell route matching, and Distro snapshot cleanup.
- [x] 1.6 Capture a pre-change Browser Use reference for desktop/mobile primary navigation, `/store/`, `/distro/`, Distro search/format/Coverflow, Store Item navigation, player continuity, focus/scroll behavior, and console state.

## 2. Store Category model and invariants

- [x] 2.1 Add focused tests for the exact category registry order, labels, and paths: `All` `/store/`, `BlackBox Releases` `/store/blackbox-releases/`, `Distro` `/store/distro/`, and `Merch` `/store/merch/`.
- [x] 2.2 Implement one typed Store category registry and `StoreCatalogCategory` presentation type; keep `all` as a collection selection rather than persisted item membership.
- [x] 2.3 Add membership tests for a release-sourced item, the distro-sourced Caregivers relation, an ordinary Distro item, an exact `Clothes` fixture, and an unsupported/unclassifiable fixture.
- [x] 2.4 Implement faceted membership derivation: release-owned or release-related → BlackBox Releases; every distro-owned item → Distro; exact distro-owned `Clothes` → Merch in addition to Distro.
- [x] 2.5 Extend the Store collection view model to join canonical Store Item, availability, category memberships, exact Distro group/format, authored order, and search text without modifying the Store Item commerce projection.
- [x] 2.6 Add invariant checks proving All contains each canonical Store Item once, every item has a deterministic membership, and no selected category contains the same item twice even when memberships overlap.
- [x] 2.7 Add current-content migration evidence proving derived counts of All 81, BlackBox Releases 3, Distro 79, and Merch 0 without hardcoding those totals into runtime UI.
- [x] 2.8 Confirm generated frontend/backend catalog types, D1 schema/migrations, Worker APIs, Store Offers, Stripe metadata, StoreCart, checkout payloads, and stock code contain no new Store Category authority field or `merch` source kind.

## 3. Shared Store collection routes

- [x] 3.1 Add rendering tests for category navigation semantics, active state, derived heading/count, canonical metadata, populated grids, and empty Merch behavior.
- [x] 3.2 Extract the current Store listing into one shared Store collection page/component that accepts an active category and classified entries while retaining the current hero, card grid, price islands, containment, and responsive behavior.
- [x] 3.3 Add one Store category navigation component using a native `nav`, ordinary links, exact label/order, and `aria-current="page"`; render it on all four Store collection routes.
- [x] 3.4 Keep `/store/` as All and add thin static route files for `/store/blackbox-releases/`, `/store/distro/`, and `/store/merch/`, each with category-specific title, description, heading, count, and self-canonical URL.
- [x] 3.5 Render All and BlackBox Releases with canonical `StoreItemCard` entries and ordinary Store Item detail links; prove Caregivers appears once in All, once in BlackBox Releases, and remains once in Distro without creating another commerce identity.
- [x] 3.6 Render Merch with an accessible `no merch currently available` empty state when count is zero, retain all category links, and cover the populated path with a `Clothes` fixture.
- [x] 3.7 Verify the shared page does not duplicate Store Items, Store Offer price islands, IDs, canonical tags, or collection headings within one document.

## 4. Rehome Distro discovery under Store

- [x] 4.1 Refactor Distro grouping to consume faceted Store collection entries; add tests that retain all 79 current distro-sourced items, exact physical types, combined small-vinyl presentation, group order including `Clothes`, authored order/title tie-breaker, and one appearance per Distro item despite additional memberships.
- [x] 4.2 Extract the existing grouped Distro catalog markup into a Store-owned Distro category surface and render it only from `/store/distro/`; retain the complete server-rendered no-JavaScript catalog.
- [x] 4.3 Adapt the Distro page card variant to resolve the canonical Store Item and its availability/price while preserving square image geometry, one ordinary detail link, search data, six-item wrappers, and the unaffected homepage Distro card variant.
- [x] 4.4 Move the `Browse formats` landmark after Store category navigation and Distro intro/search; keep native fragment targets, source-derived counts, populated-group order, and keyboard behavior.
- [x] 4.5 Rename and move the route-lazy search entrypoint to `apps/web/src/components/store/StoreDistroSearch.tsx`, update selectors/copy as needed, and retain exact-first plus Fuse.js fallback over title, artist/label, exact group, and format.
- [x] 4.6 Retarget the app-shell search portal, lazy import, route guard, cleanup, code-splitting tests, and lifecycle tests from `/distro/` to exact path `/store/distro/`; confirm other Store categories never mount it.
- [x] 4.7 Retarget Coverflow capability detection, controller state, fixed six-card preview, disclosure, search handoff, focus behavior, transition cleanup, and reduced-motion/no-3D fallbacks to the classified Store Distro surface.
- [x] 4.8 Retarget pre-cache snapshot sanitation and route re-entry restoration to `/store/distro/`; prove cached state removes query, hidden, selected, transition, and stale portal state before reuse.
- [x] 4.9 Update Distro-specific styles and source-contract tests for the new Store-owned component/route while preserving 320px, 390px, desktop, 200% text, 400% zoom, 44px targets, and no-horizontal-overflow contracts.
- [x] 4.10 Remove obsolete standalone Distro page wiring, component paths, portal targets, prepaint markers, selectors, and tests only after the new category passes equivalent grouping/search/Coverflow behavior; keep Distro item content, schema, Decap editing, source reconciliation, inventory tooling, and necessary category copy.

## 5. Primary navigation and app-shell routing

- [x] 5.1 Update navigation content to the exact shared order Artists 1, Releases 2, Store 3, Services 4, About 5; remove the Distro navigation entry and verify header, mobile, and footer consumers render no duplicate or stale section.
- [x] 5.2 Update shell section parsing to recognize only `/store/`, `/store/blackbox-releases/`, `/store/distro/`, and `/store/merch/` as Store collection routes and remove `/distro/` from section matching.
- [x] 5.3 Add route tests proving all four Store collection paths return `kind: 'store'` while Store Item details, `/store/checkout/`, checkout returns, item-scoped compatibility routes, unknown Store children, and `/distro/` remain non-section routes.
- [x] 5.4 Add shell history/cache tests proving each category pathname has a distinct snapshot and back/forward restoration, while Store remains the active primary item on every category descendant.
- [x] 5.5 Verify category shell transitions retain scroll reset, focus reset, transition feedback, StoreCart bridge state, overlay behavior, and a minimized or active player session.

## 6. Route safety, compatibility, and SEO

- [x] 6.1 Consolidate `checkout`, `blackbox-releases`, `distro`, and `merch` into one exported reserved Store route-segment set consumed by Store Item projection, collision diagnostics, and static-path validation.
- [x] 6.2 Add tests that each reserved segment fails with its conflicting Store Item owner before catalog artifacts or Astro Store Item paths are emitted, while ordinary Store Item slugs remain valid.
- [x] 6.3 Add an opt-in fragment-preservation flag to the established `RedirectLayout` without changing existing redirect callers, replace `apps/web/src/pages/distro/index.astro` with that base-aware redirect targeting `/store/distro/`, and retain replacement script, meta refresh, fragment-free canonical, and visible fallback link.
- [x] 6.4 Add redirect tests proving `/distro/#distro-group-cds` becomes `/store/distro/#distro-group-cds` with JavaScript, the Store Distro surface retains legacy intro/group target IDs, and the no-JavaScript fallback still reaches the category top.
- [x] 6.5 Update sitemap generation to remove `/distro/` and add `/store/blackbox-releases/`, `/store/distro/`, and `/store/merch/`; retain `/store/` once and leave Store Item sitemap policy out of scope.
- [x] 6.6 Add static-output checks for UAT base-path and PRD root-path builds proving category output files, self-canonicals, fragment-preserving redirect script, redirect target/canonical, and absence of duplicate fixed/dynamic Store paths.

## 7. Architecture, tooling, and documentation synchronization

- [x] 7.1 Update `openspec/specs/module-boundaries/module-boundaries.manifest.json` with Store category route ownership, Store-owned Distro components, and the provided `StoreDistroSearch` entrypoint; remove stale standalone-route roots/entrypoints without a compatibility facade.
- [x] 7.2 Run the module-boundary audit included by `pnpm check` and keep the manifest plus `module-boundaries` specification synchronized with the final file layout.
- [x] 7.3 Update UAT/static smoke route lists and any performance/image validation scripts from standalone `/distro/` to `/store/distro/`, retaining explicit redirect coverage for the legacy path.
- [x] 7.4 Update README and project AGENTS navigation/routing/content notes to describe Releases as editorial, the four Store categories, exact public label `Distro`, presentation-only classification, and `/distro/` compatibility behavior.
- [x] 7.5 Search source, tests, styles, scripts, docs, and active OpenSpec artifacts for stale standalone-Distro assumptions; classify every remaining `/distro/` reference as intentional redirect/backward-compatibility evidence or remove/update it.
- [x] 7.6 Confirm no new dependency, content collection, backend module, commerce source kind, D1 migration, or provider synchronization step was introduced.

## 8. Automated verification

- [x] 8.1 Run focused unit tests after the category model, shared Store page, Distro migration, shell routing, and redirect/sitemap slices; fix failures before advancing to the next slice.
- [x] 8.2 Run `pnpm test:unit` against the complete implementation and retain concise evidence for category counts/classification, shell routing, Distro behavior, redirects, sitemap, and boundaries.
- [x] 8.3 Run `pnpm check` and resolve Prettier, ESLint, Astro/TypeScript content, schema, and module-boundary failures without weakening the contracts.
- [x] 8.4 Run `pnpm build`, inspect generated Store category and legacy redirect documents, and confirm no collection, route-collision, canonical, image, or static-cache-policy errors.
- [x] 8.5 Run `pnpm audit:unused` when route/component removal leaves potentially dead Distro code, and remove only code proven unused after the rehomed experience passes.

## 9. Browser Use acceptance

- [x] 9.1 Start the committed static-site launcher and use native Browser Use at desktop width to verify the exact header/footer order, absent Distro primary link, active Store state, and ordinary navigation across all four Store collection routes.
- [x] 9.2 Repeat primary and category navigation at narrow mobile width; verify the mobile menu order, category-link reachability, focus visibility, no horizontal overflow, and StoreCart/player overlays do not obscure required controls.
- [x] 9.3 Direct-load each category and verify title, heading, canonical route, item count, category `aria-current`, All deduplication, Caregivers appearing once in both BlackBox Releases and Distro, and the Merch empty state.
- [x] 9.4 On `/store/distro/`, verify exact and fuzzy search, accessible count/empty/clear behavior, format fragment links, group order/counts, six-card Coverflow navigation/disclosure, Store Item links, search-mode handoff, route exit/re-entry cleanup, and reduced-motion behavior.
- [x] 9.5 Navigate Store category → Store Item → cart/checkout boundary and back; verify canonical item identity, price/availability behavior, StoreCart continuity, player continuity where supported, and unchanged non-section navigation semantics.
- [x] 9.6 Direct-load `/distro/` and `/distro/#distro-group-cds` under the configured base path; verify replacement to the matching Store Distro URL/fragment, fallback link/canonical markup, target visibility below sticky navigation, correct back-button behavior, and no redirect loop.
- [x] 9.7 Verify shell focus resets to `main`, category transitions reset scroll, back/forward restores the correct category snapshot, direct loads work without shell history state, images remain stable, and the browser console stays clean.

## 10. Final review and handoff

- [x] 10.1 Review the final RTK-filtered and exact bounded git diff for accidental backend/provider changes, duplicated category strings, stale Distro routes, unrelated formatting, or user-owned edits.
- [x] 10.2 Rerun `pnpm test:unit`, `pnpm check`, and `pnpm build` against the exact final tree immediately before any push or completion claim.
- [x] 10.3 Record automated and Browser Use evidence, known static-redirect limitations, current derived category totals, and rollback instructions in the change handoff.
- [x] 10.4 Mark tasks complete only from evidence; archive `consolidate-distro-into-store` only after implementation, final validation, documentation synchronization, and user acceptance are complete.
