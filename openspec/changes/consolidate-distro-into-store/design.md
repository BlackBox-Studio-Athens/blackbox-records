## Context

BlackBox currently exposes three catalog concepts at the same navigation level:

- Releases is an editorial discography with three Release entries, detail overlays, listening actions, and optional Store links.
- Distro is a 79-record physical catalog with search, deterministic format groups, format jump navigation, and bounded Coverflow disclosure. Every record links to a Store Item.
- Store is the transactional projection of Release and Distro content. The canonical projection currently yields 81 unique Store Items: two release-sourced items plus 79 distro-sourced items after the duplicate Caregivers Release candidate is folded into its related Distro Store Item.

The chosen direction follows the strongest pattern from the label/store research: keep the label discography editorial, but give shoppers one commerce destination with clear internal categories. `Distro` remains the public category name.

The site is statically generated. `AppShellRoot` keeps the player alive by fetching and caching top-level page snapshots by normalized pathname. Query-only category state would share one snapshot key and current same-path navigation handling would swallow some category changes. Distro also owns route-specific portal, prepaint, snapshot-sanitization, and performance behavior that cannot be moved by changing navigation JSON alone.

The completed `add-distro-coverflow-catalog-disclosure` change remains unarchived. Its capability must become baseline, or be equivalently reconciled, before this change is applied so the old standalone-route contract and the new Store-category contract do not coexist ambiguously. `improve-site-runtime-performance-round-two` is also active and modifies the same performance/tooling requirements; this change is written against its final detailed contracts and must follow its completion/archive rather than overwriting them from the older baseline.

## Goals / Non-Goals

**Goals:**

- Establish the exact primary navigation `Artists · Releases · Store · Services · About`.
- Establish the exact Store category order `All · BlackBox Releases · Distro · Merch`.
- Make Store the only current catalog-shopping section while preserving Releases as editorial content.
- Give every category a direct, static, canonical, no-JavaScript route.
- Derive deterministic Store Category memberships without changing commerce authority, while keeping All deduplicated.
- Keep the useful Distro browse experience under Store's Distro category.
- Preserve old `/distro/` bookmarks through a canonical compatibility redirect.
- Preserve player continuity, app-shell focus/scroll behavior, checkout, StoreCart, Store Item routes, accessibility, and performance budgets.

**Non-Goals:**

- Adding Merch products, a merch content collection, a `merch` Store Item source kind, backend schema, inventory rows, Store Offers, or Stripe products.
- Merging editorial Release pages into Store or adding commerce controls to Release content.
- Changing Distro content ownership, exact physical groups, inventory reconciliation, stock, checkout, shipping, or provider field ownership.
- Adding client-side category filtering, a remote search service, pagination, list virtualization, or a state-management dependency.
- Reworking Store Item detail pages, checkout routes, the cart model, or the pre-existing omission of Store Item detail URLs from the sitemap.
- Redesigning the established monochrome visual system.

## Decisions

### 1. Releases remains editorial; Store owns shopping discovery

The visible section navigation and footer section links will use one shared order:

1. Artists
2. Releases
3. Store
4. Services
5. About

The Distro navigation entry will be removed. The Distro content collection and its editorial/inventory tooling remain because they still source Store Items; only the standalone shopper-facing section is retired.

This avoids asking visitors to infer the difference between a Distro card and the Store Item it opens. It also preserves the useful distinction between an editorial Release and a sellable physical edition.

**Alternative considered:** Keep Distro in the primary navigation and rename Store to Shop. Rejected because two routes would still perform the same shopping-discovery job.

### 2. Store categories use fixed static routes

One category registry will define label, key, order, pathname, intro/empty copy, and selection semantics:

| Key                 | Public label      | Route                       |
| ------------------- | ----------------- | --------------------------- |
| `all`               | All               | `/store/`                   |
| `blackbox-releases` | BlackBox Releases | `/store/blackbox-releases/` |
| `distro`            | Distro            | `/store/distro/`            |
| `merch`             | Merch             | `/store/merch/`             |

Each route will be a real static Astro document and will render a shared Store collection page with its active category. A native `<nav aria-label="Store categories">` with ordinary links and `aria-current="page"` will appear on every Store collection route. Category routes will have distinct titles, descriptions, headings, canonical URLs, history entries, and shell snapshot keys. Store category labels remain exact; route slugs are implementation identifiers.

The three fixed category paths will be explicitly recognized as `kind: 'store'` shell routes. Store Item details, `/store/checkout/`, checkout returns, and item-scoped compatibility routes remain non-section routes. Static route precedence already supports `/store/checkout/` beside `/store/[slug]/`; nevertheless, `blackbox-releases`, `distro`, and `merch` will be reserved against Store Item slug creation so generated paths cannot collide.

**Alternatives considered:**

- `?category=distro`: rejected because the current shell cache and same-path navigation model key on pathname and would require a separate query-state controller, popstate work, cache invalidation, and no-JavaScript fallback.
- `#distro`: rejected because it has no distinct canonical document or sitemap entry and would make category filtering client-owned.
- `/store/category/distro/`: technically safe but rejected in favor of the shorter public paths; centralized reserved-slug validation handles the collision risk.
- JavaScript tabs over one 81-item document: rejected because fixed pages provide progressive navigation and smaller category documents without a new client island.

### 3. Store Category is a presentation projection, not commerce ownership

`StoreCatalogCategory` will be a frontend collection-view type separate from `StoreItemSourceKind`. Membership will run after canonical Store Item projection, using source identity, explicit Release-to-Distro relations, and exact Distro group data:

1. A release-sourced Store Item belongs to `blackbox-releases`.
2. A canonical distro-sourced Store Item referenced by `releaseToDistroStoreItemRelations` additionally belongs to `blackbox-releases`.
3. Every distro-sourced Store Item belongs to `distro`, including a related BlackBox Release or exact `Clothes` record.
4. A distro-sourced item whose exact accepted group is `Clothes` additionally belongs to `merch`.

`all` is a view over the canonical collection, not a stored membership value. Membership is intentionally faceted: one canonical Store Item may appear in more than one named category, but never more than once within one category or within All. Derivation must be exhaustive and deterministic, and must fail during build/test if a canonical item receives no membership or is duplicated within a selected projection.

With current content, the derived acceptance snapshot is All 81, BlackBox Releases 3, Distro 79, and Merch 0. These totals are migration evidence, not authored runtime constants. Caregivers remains in Distro because its canonical source is a Distro record and additionally appears under BlackBox Releases because the explicit relation represents its label identity. A future exact `Clothes` record remains in Distro and additionally appears under Merch; `Other` remains Distro.

No category value crosses into D1, generated catalog artifacts, Worker APIs, Store Offers, Stripe metadata, checkout payloads, StoreCart, stock, or provider field ownership.

**Alternatives considered:**

- Map every category directly from `sourceKind`: rejected because source kind alone cannot add Caregivers to BlackBox Releases or exact `Clothes` records to Merch.
- Add `merch` to frontend and backend source enums now: rejected because there is no merch source or product to authorize that model.
- Force mutually exclusive category membership: rejected because it would remove Caregivers from the existing 79-item Distro discovery surface and would make a future Distro-sourced `Clothes` item disappear from Distro. Faceted category views may overlap while All and each individual view remain deduplicated.

### 4. Store collection data owns category projection

`store-collection` will become the single shopper-listing seam. Its presentation entries will retain the canonical Store Item and availability, and add only the source metadata needed for:

- category assignment;
- Distro exact group and derived format group;
- Distro search text;
- deterministic category and group ordering.

The implementation will centralize reserved Store route segments and category descriptors rather than duplicating strings across route files, the classifier, the shell, and tests. The shared Store collection page will render:

- All: every canonical Store Item once in the established Store grid;
- BlackBox Releases: the three current label-release Store Items in the Store grid;
- Distro: every distro-sourced canonical Store Item in existing deterministic format groups;
- Merch: Store grid when populated, otherwise a visible empty state that states no merch is currently available and keeps category navigation usable.

Page item counts will be derived from the selected projection. Category navigation labels will not be renamed or hidden when empty; Merch remains visible so the approved information architecture is stable.

### 5. Distro discovery behavior moves intact under `/store/distro/`

The current grouped Distro route will be extracted into a Store-owned category surface rather than copied. It will consume the faceted Store collection projection, preserving all 79 current canonical Distro-sourced Store Items, including Caregivers. Future exact `Clothes` items remain in Distro groups while additionally appearing under Merch. The underlying Distro records remain unchanged and continue participating in content/inventory validation.

The category surface will preserve:

- exact physical-type authority and the derived `7-inch & 10-inch Vinyl` browse label;
- Distro group order `Vinyl 12-inch`, `7-inch & 10-inch Vinyl`, `CDs`, `Tapes`, `Clothes`, `Other`;
- authored item order and title tie-breaker within each group;
- native format links and counts from the same populated group model;
- exact-first local search and Fuse.js fallback over title, artist/label, exact group, and format;
- the existing one-controller ownership of search, group visibility, and Coverflow modes;
- the six-record bounded Coverflow, progressive no-JavaScript/no-3D fallback, reduced motion, focus behavior, snapshot sanitation, and current interaction/performance budgets;
- ordinary Store Item links from every card.

The Distro card presentation will be adapted to the Store collection entry so category cards resolve the canonical Store Item and can expose Store availability/price without creating another commerce projection. Coverflow and catalog mode will continue to transform the same server-rendered card nodes; price islands remain visibility-deferred. Home Distro cards may keep their current compact content variant because the homepage is not a Store category.

Route-specific app-shell hooks, portal targets, capability markers, style selectors, and tests will move from `/distro/` to `/store/distro/`. Names that describe a route rather than the domain will be renamed to `StoreDistro*`; the public category label remains `Distro`.

**Alternative considered:** Delete search, format navigation, and Coverflow and replace Distro with a generic Store grid. Rejected because the IA change does not authorize a regression in recently completed catalog discovery, keyboard access, or progressive behavior.

### 6. `/distro/` becomes a compatibility redirect

The existing static redirect layout will replace the Distro page at `/distro/` and target the base-aware `/store/distro/` URL with `window.location.replace`, meta refresh fallback, a canonical link, and a visible ordinary link. Its script will opt into preserving `window.location.hash`, and the Store Distro surface will retain the existing format/intro fragment IDs, so `/distro/#distro-group-cds` resolves to `/store/distro/#distro-group-cds`. The no-JavaScript meta-refresh fallback may land at the category top because static markup cannot append the incoming fragment; the canonical remains fragment-free. The legacy path will be removed from app-shell section matching, navigation, and sitemap. The three new Store category paths will be added to the sitemap and self-canonicalize.

This keeps inbound links functional without maintaining two indexable catalog documents. The redirect is not a module compatibility facade; it is a public URL migration document.

### 7. Module ownership follows the Store category

The existing `storefront-catalog` module remains the owner of Store listing routes, Store/Distro cards, grouping, category classification, search, and Coverflow. The module-boundary manifest and spec will move the route-lazy search entrypoint from `components/distro/DistroSearch.tsx` to a Store-owned provided entrypoint and will add the three Store category route files. The redirect route remains owned by the static storefront boundary. No new module is warranted.

### 8. Validation covers IA, behavior, and static output

Unit and source-contract coverage will prove:

- exact navigation and category order;
- faceted category membership, including Caregivers and a `Clothes` fixture;
- canonical All deduplication plus no duplicates within any selected category;
- current migration totals and Merch empty state;
- reserved Store route segments;
- exact shell acceptance of the four collection routes and rejection of Store Item/checkout routes;
- Distro search, grouping, Coverflow, cleanup, and snapshot behavior at the new path;
- redirect target/canonical behavior and sitemap membership;
- no backend/provider contract changes.

The final tree must pass `pnpm test:unit`, `pnpm check`, and `pnpm build`. Native Browser Use will validate direct loads and shell navigation at mobile and desktop widths, exact header/mobile/footer IA, active category state, Merch empty state, Caregivers placement, Distro search/format/Coverflow behavior, Store Item and cart transitions, player continuity, focus/scroll reset, redirect behavior, responsive layout, and console cleanliness.

## Risks / Trade-offs

- **[Active Coverflow change is not baseline]** → Verify and archive `add-distro-coverflow-catalog-disclosure` before applying this change, then validate this delta against the archived requirement names. Do not implement against two contradictory route contracts.
- **[Round-two performance requirements are still active]** → Complete and archive `improve-site-runtime-performance-round-two` first, then revalidate these Store All/Store Distro deltas against its final load, traversal, request, and Browser Use requirements.
- **[Fixed category slugs can collide with Store Items]** → Centralize `checkout`, `blackbox-releases`, `distro`, and `merch` in one exported reserved-segment set used by projection and static-path validation.
- **[Caregivers category membership can drift from canonical ownership]** → Derive Distro membership from canonical source kind and additional label membership from the explicit Release-to-Distro relation; prove it appears once in each relevant view and once in All without inferring from title text.
- **[Future Clothes content changes current zero-count Merch state]** → Derive counts and empty state from exact content on every build; do not hardcode the current totals into runtime UI.
- **[Distro behavior may leak after shell snapshot restoration]** → Retarget and retain portal cleanup, pre-cache sanitation, capability marker, and route re-entry tests before removing the old page.
- **[Store price islands can increase work on the long Distro category]** → Keep visibility-deferred price reads, native containment, and existing load/scroll/INP gates; profile before adding any batching or virtualization.
- **[Four Store pages duplicate templates]** → Keep routes thin and render one shared Store collection page/component from the category registry.
- **[Legacy redirect cannot issue an HTTP 301 on both static hosts or preserve fragments without JavaScript]** → Use an opt-in hash-preserving established redirect layout, keep old fragment IDs on Store Distro, retain the fragment-free meta-refresh/fallback link, and verify both UAT base-path and PRD root builds.

## Migration Plan

1. Complete and archive `improve-site-runtime-performance-round-two`, then verify/archive or equivalently reconcile the completed Coverflow predecessor so both final capability sets are available for this delta.
2. Re-run strict validation and compare this change's modified requirement blocks with those newly archived baselines before editing product code.
3. Add characterization tests for current Store projection, Caregivers relation, Distro grouping, route matching, and navigation before moving behavior.
4. Add the Store category registry, reserved route segments, faceted membership derivation, and classified collection projections; prove the current 81/3/79/0 migration snapshot.
5. Extract the shared Store collection page and add the three fixed category routes with category navigation, metadata, counts, and empty state.
6. Rehome Distro grouping, search, format navigation, cards, Coverflow, styles, portal lifecycle, snapshot sanitation, and tests to `/store/distro/`.
7. Update primary/footer navigation, exact shell route matching, active Store state, and sitemap.
8. Replace `/distro/` with the base-aware compatibility redirect and remove obsolete standalone-route wiring only after the new Distro category passes equivalent behavior checks.
9. Synchronize the module-boundary manifest/spec, project language, performance/image/tooling requirements, README, AGENTS, and any UAT smoke route lists.
10. Run automated gates and Browser Use acceptance. Deploy through the existing static workflow; no data migration or backend rollout is required.

Rollback is a normal source revert: restore the Distro page/navigation and previous shell matcher, remove category routes, and rebuild. No D1, Stripe, order, stock, or content migration needs reversal.

## Open Questions

None. The route model, category names/order, faceted membership, empty Merch behavior, Distro feature preservation, and fragment-preserving legacy redirect are fixed by this design.
