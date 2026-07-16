## Context

`StoreCategoryNavigation.astro` already owns one static, base-aware category navigation with native links, a named landmark, `aria-current="page"`, conditional Merch discovery, and no client JavaScript. The selected Signal rail strengthens that existing component rather than replacing document navigation with tabs.

`StoreCollectionPage.astro` renders All and BlackBox Releases through one shared panel. All already derives its collection total, Distro subset, format groups, and canonical fragment links from the current entries, but repeats `All`, Distro context, and the Distro subtotal. BlackBox Releases receives the same wide two-column shell with only a count on the right, leaving a generic empty region. Its category description also supplies page metadata, so presentation changes must not silently rewrite SEO copy.

The prerequisite `refine-store-catalog-discovery` change adds an All-to-Distro format-discovery requirement that includes Distro intro copy and a standalone Distro subtotal. This change deliberately modifies that post-prerequisite contract: the server-derived groups, order, counts, links, canonical targets, and no-JavaScript behavior remain, while the approved compact ledger removes only the repeated intro and subtotal.

`StoreDistroCatalog.astro` already renders one complete canonical catalog, enhances groups larger than six into a Coverflow limited to the first six records, and exposes Previous, Next, `View all {total}`, and active-record status. `StoreDistroSearch.tsx` owns the existing `preview`, `catalog`, and `search-results` transitions, focus restoration, pointer intent, and cleanup. The stronger disclosure can enroll every existing canonical card in that controller, limit presentation to six positions, and derive active progress without another request, catalog, or interaction mode.

The Distro intro currently sits outside the purpose-specific panel system and repeats its total before an idle search panel repeats the same count twice. Its Coverflow controller already provides 3D selection, native links, search handoff, disclosure, focus, and reduced-motion fallback; the remaining gaps are composition, scale, and full-group traversal, not another carousel implementation.

Configured registries include `@shadcn`, `@21st`, `@magicui`, `@aceternity`, `@blocks`, and `@hextaui`. The official shadcn and Hexta carousels depend on `embla-carousel-react`; Aceternity's carousel adds Tabler icons, while its Apple Cards variant adds Motion. These generic or theatrical slider systems are useful control references, but none supplies the existing bounded 3D shelf, search handoff, no-JavaScript full catalog, and shell restoration. Installing one would duplicate state, DOM, or motion without improving this task.

The approved visual references are `docs/ui-mockups/store-category-signal-rail-poc.png` and `docs/ui-mockups/store-orientation-approved-poc.png`. Their displayed counts are examples of current content, not constants.

`refine-store-catalog-discovery` still changes the same Store-category capability and must be accepted and archived before implementation begins.

## Goals / Non-Goals

**Goals:**

- Match the approved Signal rail, compact Shelf Ledger panels, Distro orientation panel, and compact Coverflow band using existing BlackBox tokens and typography.
- Give All, BlackBox Releases, Distro, and eligible Coverflow groups distinct information hierarchies suited to their tasks.
- Remove repeated All-panel information before reducing type, then use content-driven responsive sizing rather than fixed-height clipping.
- Keep every displayed total, format count, active position, remainder, link, and progress ratio source-derived.
- Preserve category derivation, routes, metadata, Store Item identity, search ownership, Coverflow modes, focus behavior, no-JavaScript access, reduced motion, and performance budgets.
- Use existing server-rendered components, CSS, and the minimum extension of current controller hooks.

**Non-Goals:**

- No category, membership, canonical route, sitemap, listing-card content, cart, checkout, stock, or commerce-authority change.
- No new content schema, panel copy field, API, runtime request, client state model, catalog copy, carousel dependency, animation library, image, texture, icon, or runtime asset.
- No autoplay, looping ambient motion, drag physics, pagination dots, thumbnails, alternate product order, virtualized duplicate list, or second catalog.
- No Distro search ranking, result membership, query behavior, Store Item detail, checkout, or product-listing card redesign.

## Decisions

### Treat the approved PoCs as visual evidence, not data authority

Implementation SHALL use the two approved PoCs for hierarchy, density, rules, and state emphasis. OpenSpec requirements, repository tokens, accessible reflow, and live source data override any rasterized copy, count, spacing, or type imperfection.

Alternative: reproduce the bitmap literally. Rejected because its current counts can change and fixed pixel heights would fail narrow viewports and text enlargement.

### Keep the Signal rail as static document navigation

Retain `StoreCategoryNavigation.astro`, native anchors, landmark name, `aria-current`, base-aware hrefs, and category derivation. Use two square-edged columns below the small breakpoint and one equal-width row above it. With three categories, the final narrow link spans both columns rather than creating a false placeholder.

The active cell uses stronger foreground/weight, a 3px Store-accent rule, and a low-opacity Store-accent tint. Focus remains independently visible. Only colour, background, and border transition; layout and indicator position do not.

Alternative: a hydrated tab or horizontally scrolling rail. Rejected because these destinations are complete documents and all labels can remain visible without client state or hidden overflow.

### Keep one collection renderer with three presentation branches

Retain `StoreCollectionPage.astro` as the shared owner. Use its existing All condition, add an explicit BlackBox Releases presentation branch, and preserve a safe generic branch for future populated Merch or another non-Distro category. Do not add a new component hierarchy or content field solely for these small variants.

All uses existing entries and grouped Distro data. BlackBox Releases uses the existing category label, category description, and membership-filtered entries. The category description remains unchanged for metadata; the panel composes existing values rather than introducing panel-only authored copy.

Alternative: separate page components or new CMS fields per category. Rejected because the current data already provides every approved label, description, count, and link.

### Remove repeated All information before shrinking typography

The Signal rail already identifies All, so the panel does not repeat a large `All` heading. The compact panel presents only:

- `Store shelf`;
- the existing shelf-purpose headline;
- one source-derived `{total} items total` value;
- `Browse Distro formats`; and
- one canonical format link and source-derived count per current Distro group.

The panel removes the repeated collection-total label, Distro intro paragraph, and separate Distro subtotal. Format rows already expose the actionable Distro breakdown; the full Distro page retains its own description. Desktop remains a ruled two-column ledger. Narrow layouts stack in reading order, keep content-driven height, and give each format link at least a 44px target.

This is a requirements-level refinement of `distro-format-jump-navigation`, not merely a styling choice. Its delta replaces the prerequisite requirement after `refine-store-catalog-discovery` becomes baseline.

Alternative: retain every field and reduce all type. Rejected because it preserves redundant hierarchy and harms scan speed before it saves meaningful height.

### Make BlackBox Releases compact through hierarchy, not a fixed height

The BlackBox Releases panel presents `Store shelf`, the category label, the existing category description, and one source-derived total. Desktop uses one short horizontal band with a divider and tighter type/spacing; narrow and enlarged-text layouts stack naturally without a fixed height.

Alternative: reuse the All panel unchanged or use an oversized `03` poster treatment. Rejected because the first leaves dead space and the second competes with the three product listings it introduces.

### Make Distro one compact orientation panel without duplicating search state

The Distro panel presents `Store shelf`, the existing Distro title and description, and one source-derived collection total. Desktop uses a two-column square-edged frame: identity and purpose on the left, total and the existing search slot on the right. Narrow and enlarged-text layouts stack in document order with content-driven height.

The idle search surface renders only its labelled input because the orientation panel already exposes the complete total. Once a query is active, the search surface renders the visible-result count and Clear search action. The separate Browse formats navigation remains the canonical sticky jump rail and retains its current links, counts, and Top action.

Alternative: keep the intro, total, and search panel as three stacked surfaces. Rejected because the repeated count and loose hierarchy make Distro feel unrelated to the approved All and BlackBox panels.

### Reuse the current Coverflow core and enroll the complete canonical group

Keep the existing native links, controller reducer, pointer intent, live record status, disclosure sequence, search ownership, and no-JavaScript/reduced-motion fallbacks. Every canonical card in an eligible group becomes a controller member, but preview mode assigns only six relative positions: active, two records ahead, one rear record, and two records behind. All other cards and their wrapper gaps leave presentation, focus order, and the accessibility tree until they receive a position or the visitor opens the catalog.

Previous and Next traverse the complete group and wrap at its actual bounds. The disclosure toggle retains native button semantics and aligns its sizing, focus, outline, and primary/secondary hierarchy with the installed shadcn button primitive. Do not install the registry Carousel or Embla: the existing controller already supports arbitrary counts and replacing it would add dependency and state duplication.

Alternative: install the official shadcn Carousel or duplicate a six-card window. Rejected because either adds a second interaction or DOM engine while losing the current canonical catalog and progressive fallback contracts.

### Derive initial Coverflow position once on the server and update it in the controller

For each eligible group, `StoreDistroCatalog.astro` derives:

- `total = group.entries.length`;
- `visible = DISTRO_COVERFLOW_PREVIEW_SIZE` (currently six);
- `current = 1`;
- `remaining = total - current`; and
- `positionRatio = current / total`.

Preview mode renders aligned `total / in this format`, `current / now viewing`, and `remaining / more` fields, plus the sentence `You're viewing {current} of {total}.` The controller updates current, remaining, summary, and ratio whenever the active index changes. The geometric rail is `aria-hidden`; the sentence carries its meaning in text. Existing active-record status remains the only polite live region so aggregate counts are not repeatedly announced.

Previous and Next stay secondary outline controls. `View all {total}` remains the existing disclosure toggle and the visually primary Store-accent control. Existing toggle labels, focus transfer, item links, modes, and shell snapshot cleanup remain stable; the snapshot sanitizer also restores source-authored position values and the initial ratio. No per-item dots are added for large catalogs.

Alternative: keep `6 / now showing` and `total - 6 / more` while only the sentence changes. Rejected because those fixed preview statistics would conflict with the requested full-group traversal and active progress.

### Use transform-only position motion driven by existing state

Server markup exposes the initial position ratio as a scoped CSS custom property. When enhancement activates preview mode, the Store-accent segment draws once from zero to `1 / total`. Each Previous, Next, or side-cover selection then glides the segment to `current / total` with the same restrained ease-out curve as the covers. The sequence is event-driven and never loops.

When `View all {total}` activates, disclosure keeps its existing two phases within the 480ms budget. During the first 180ms, the preview band and rail remain visible, the catalog remains concealed, and the rail extends from the active ratio to 100%. Only after that fill completes does the hard-edged catalog reveal begin; the preview-only band then leaves presentation and the catalog reaches its final state by 480ms. Existing mode/transition attributes drive CSS; no animation frame, autoplay timer, document View Transition, or new controller mode is added. Catalog and search-results modes otherwise remove preview-only statistics and rail presentation as before.

Under `prefers-reduced-motion: reduce`, position information and the six visible cards update immediately at their static source-derived state, and all mode changes reach the same final state without transform or opacity animation.

Alternative: animate every number or add perpetual pulsing. Rejected because the moving covers and one progress rail provide sufficient feedback without distracting repeated motion.

### Preserve responsive, accessibility, and performance contracts

At desktop widths the All ledger, compact BlackBox band, Distro panel, and Coverflow title/stats/actions align to the established page rules. At the existing narrow boundary, content reflows rather than scales below readable sizes: Distro tools stack, Coverflow statistics remain labelled, controls wrap with 44px targets, and the primary full-catalog action stays distinct. At 320px, 200% text size, and 400% zoom equivalents, no label truncates or causes two-dimensional page scrolling.

The change reuses current server nodes and CSS, adds no request or dependency, and preserves existing LCP, CLS, INP, and long-task budgets.

### Keep research reusable but non-executable

The implementation decision uses dataset patterns `LAY-01`, `HIER-02`, `HIER-04`, `SPACE-04`, `COMP-04`, `STATE-02`, `MOBILE-02`, `STYLE-02`, `BRAND-03`, and `CONV-03`. `docs/ui-design-patterns.csv` remains a curated evidence library; no runtime or build step consumes it. The product design system, approved PoCs, accessibility, performance, and this OpenSpec contract remain authoritative.

## Risks / Trade-offs

- [All total and Distro format totals differ] → Label the right ledger `Browse Distro formats`; do not imply that its rows partition the complete All total.
- [Removing the Distro intro reduces context] → Keep the shelf-purpose headline here and the full description on the canonical Distro page.
- [BlackBox compactness clips at zoom] → Use compact desktop spacing with content-driven height and a stacked narrow layout, never a fixed block height.
- [Distro search repeats or loses result context] → Keep one server-derived total in the panel; show the live visible count and Clear search only while a query is active.
- [Coverflow statistics crowd narrow screens] → Reflow title, three aligned labelled values, rail, and controls in document order; do not shrink utility text below the existing readable floor.
- [Full-group traversal creates invisible focus targets] → Assign positions to at most six canonical cards and use `display: none` for every offstage card only after enhancement is ready; never hide focusable cards with opacity, translation, or `aria-hidden`.
- [Smaller Coverflow hides side records] → Tune lateral shifts with the smaller cover token and verify all six positioned cards remain perceivable and reachable at desktop and narrow widths.
- [Motion distracts or delays disclosure] → Run it once, use transform/opacity only, keep disclosure within the existing budget, and remove it entirely for reduced motion.
- [New markup breaks search or shell restoration] → Preserve existing mode, toggle, status, and snapshot data hooks; extend focused server/controller/snapshot tests before visual work.
- [Raster counts become implementation constants] → Derive every value and ratio from current entries; treat displayed PoC values as illustrative only.
- [Delta conflicts with active Store work] → Do not implement until `refine-store-catalog-discovery` is accepted and archived.

## Migration Plan

1. Accept and archive `refine-store-catalog-discovery`; confirm its conditional Merch and Distro format contracts are baseline.
2. Implement and test the Signal rail without changing category derivation or routing.
3. Refine `StoreCollectionPage.astro` into All, BlackBox Releases, and generic non-Distro presentation branches; update static output checks.
4. Enroll every eligible group card in the existing controller, assign at most six visible positions, and add source-derived active/remaining position state plus the gliding rail while preserving catalog and shell hooks.
5. Recompose the Distro intro, total, and search slot as one purpose-specific panel; remove only idle count duplication.
6. Restyle the existing Coverflow overview, status, and stage as one smaller hard-edged rack without replacing its controller.
7. Run focused unit coverage, then Browser Use comparisons at narrow and desktop viewports for direct and shell-managed navigation, reduced motion, focus, zoom, and console cleanliness.
8. Run `pnpm test:unit`, `pnpm check`, and `pnpm build`, then strict OpenSpec validation. Rollback is limited to the Store components, scoped CSS/controller presentation hooks, and focused tests.

## Open Questions

None.
