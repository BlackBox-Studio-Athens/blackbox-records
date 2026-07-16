# Consolidate Distro into Store Handoff

## Delivered

- Store now has the four presentation-only category routes: All, BlackBox Releases, Distro, and Merch.
- Current derived content totals are All 81, BlackBox Releases 3, Distro 79, and Merch 0.
- Distro discovery, grouping, no-JavaScript catalog, search, format navigation, and Coverflow now live at `/store/distro/`.
- `/distro/` is a base-aware compatibility redirect to `/store/distro/`. With JavaScript, it preserves legacy Distro fragments such as `#distro-group-cds`.
- Primary navigation now reads Artists, Releases, Store, Services, About. Distro content, Decap editing, reconciliation, inventory, and canonical Store Item ownership remain intact.
- Store category membership is frontend presentation data only. No backend, D1, Worker API, StoreCart, checkout, stock, Stripe metadata, or provider authority changed.

## Validation

- Strict OpenSpec validation passed: `pnpm openspec -- validate consolidate-distro-into-store --strict`.
- Static output checks passed for both UAT base-path and PRD root-path builds: `pnpm store:categories:check` reported All 81, BlackBox Releases 3, Distro 79, Merch 0.
- WebStorm MCP passed the complete `pnpm test:unit`, `pnpm check`, and `pnpm build` run configurations against the final implementation tree.
- The committed `BlackBox Local Stack` WebStorm configuration completed local D1 preparation, mock seeding, Stripe mock, Worker, and static-site startup.
- `pnpm audit:unused` found only existing repository-wide Knip findings; the rehomed Distro component/search paths were not reported as dead.
- Independent Brooks and Ponytail reviews completed; their actionable cart-bridge, exact portal ownership, stale route, and dead fallback findings were resolved.

## Browser Use

Native Browser Use validated desktop and 390px mobile layouts:

- Exact five-link desktop, footer, and mobile navigation; no Distro primary link.
- All four Store routes: title, heading, self-canonical, active category, derived count, no horizontal overflow, and 44px mobile category controls.
- Caregivers appears once in All, BlackBox Releases, and Distro without another Store Item identity.
- Distro has 79 cards, ordered format navigation, exact and fuzzy search, clear-state restoration, six-card Coverflow interaction, and clean shell re-entry state.
- Category transitions reset scroll and focus `main`; Store remains the active primary item.
- Legacy `/distro/#distro-group-cds` replaced to `/store/distro/#distro-group-cds`, reached the target below the sticky header, and backed out to the preceding route without a loop.
- Browser console contained no warnings or errors.
- On the WebStorm-launched local mock stack, the canonical Anarchotribal Store Item resolved `Available` at `€28.00` and exposed `Add To Cart`. Adding it persisted one cart line through a Store reload and correctly rendered the Cart drawer; the test cart was removed and checkout submission was not invoked.

The standalone `pnpm site:dev:bg` launcher intentionally has no Worker checkout endpoint, so Store Item pages show the safe `Checkout unavailable` boundary. It still confirmed canonical item identity and ordinary Store Item navigation; live checkout belongs to the existing local-stack/UAT smoke flows.

## Static Redirect Limitation

Without JavaScript, a static meta refresh cannot preserve a URL fragment. The fallback link and canonical remain fragment-free and reach `/store/distro/` at the category top. JavaScript redirects preserve fragments.

## Rollback

Revert the implementation commit. That restores the standalone Distro route, primary navigation entry, sitemap path, shell portal target, and prior Store listing. No migration, provider state, backend schema, or catalog authority requires rollback.
