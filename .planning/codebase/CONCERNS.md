# Codebase Concerns

**Analysis Date:** 2026-04-06

## Tech Debt

**Manual app-shell router and page-snapshot orchestration:**

- Files: `src/components/app-shell/AppShellRoot.tsx`, `src/lib/app-shell/routing.ts`, `src/components/app-shell/AppShell.astro`
- Issue: The shell-managed router, overlay system, DOM snapshotting, metadata updates, focus resets, scroll resets, prefetching, and player coordination all live in a single imperative React entry point. `src/components/app-shell/AppShellRoot.tsx` is 1489 lines and directly uses `fetch`, `DOMParser`, `history.pushState`, `history.replaceState`, `querySelector`, `innerHTML`, and `dangerouslySetInnerHTML`.
- Why: The site preserves the embedded player across top-level section switches, so it cannot rely on normal full-document navigation for the main sections.
- Impact: Small routing changes can regress multiple behaviors at once: section swaps, overlay continuity, metadata updates, mobile navigation, focus handling, and player persistence.
- Fix approach: Split shell concerns into smaller modules with explicit boundaries for page snapshot fetching, overlay state, history management, and player/session coordination. Add path-level tests before refactoring.

**Large string-built Decap config generator:**

- Files: `src/lib/admin/decap-config.ts`, `src/pages/admin/config.yml.ts`, `src/lib/admin/decap-config.test.ts`
- Issue: The CMS configuration is assembled by a 963-line TypeScript string builder with collection-specific field definitions, YAML formatting helpers, and environment branching in one file.
- Why: The repo keeps Decap aligned with Astro content collections without maintaining a separate hand-written `config.yml`.
- Impact: Schema edits are easy to ship with subtle YAML regressions, broken field wiring, or environment-specific auth mistakes. Reviews are also harder because content-model changes and YAML rendering logic are coupled.
- Fix approach: Extract per-collection builders or shared field-definition modules, then add broader snapshot-style coverage for generated YAML sections and environment branches.

**Triplicated distro taxonomy:**

- Files: `src/content.config.ts`, `src/lib/distro-data.ts`, `src/pages/distro/index.astro`
- Issue: Distro group names are hard-coded in three places: the collection schema enum, the display order helper, and the per-group intro copy record.
- Why: The current catalog is small and fixed to `Vinyls`, `Clothes`, and `Tapes`.
- Impact: Adding or renaming a category requires synchronized edits across schema, grouping logic, and page copy. Missing one location can break builds or silently misrender sections.
- Fix approach: Centralize distro group metadata in one source that exports the enum-compatible values, order, and editorial copy.

## Known Bugs

**Stale deployment guidance in repo instructions:**

- Symptoms: Contributors reading the repo-local instructions can pick the wrong `site` value for GitHub Pages.
- Trigger: Onboarding, deployment changes, or any task that trusts `AGENTS.md` over the actual config.
- Workaround: Treat `astro.config.mjs` and `README.md` as the source of truth for deployment URL values.
- Root cause: `AGENTS.md` still references `https://zantoichi.github.io`, while `astro.config.mjs` and `README.md` use `https://blackbox-studio-athens.github.io`.

**No confirmed runtime bugs were reproducible from repository inspection alone:**

- Symptoms: N/A
- Trigger: N/A
- Workaround: Use manual browser validation for shell routing, overlay behavior, and `/admin/` after changes.
- Root cause: The repo does not carry an explicit in-tree bug list beyond code and docs.

## Security Considerations

**HTML injection path for shell and overlay content:**

- Files: `src/components/app-shell/AppShellRoot.tsx`, `src/pages/app-shell-overlay/artists/[slug].astro`, `src/pages/app-shell-overlay/releases/[slug].astro`, `src/pages/app-shell-overlay/news/[slug].astro`
- Risk: The shell fetches same-origin HTML, parses it, stores `mainHtml`, and reinjects markup with `innerHTML` and `dangerouslySetInnerHTML`. If untrusted HTML ever enters rendered page content, it will be inserted into the live DOM.
- Current mitigation: Fetched content is same-origin and generated from repo-controlled Astro pages and overlay fragments. Current content sources are collection-backed, not arbitrary user input from a live backend.
- Recommendations: Keep raw HTML out of collection content, avoid expanding this path to user-generated content, and add content linting or sanitization if CMS workflows ever permit arbitrary HTML blocks.

**Production CMS auth depends on external secret and variable correctness:**

- Files: `.github/workflows/pages.yml`, `src/pages/admin/config.yml.ts`, `src/lib/admin/decap-config.ts`
- Risk: Incorrect Pages environment variables or placeholder PKCE endpoints can publish a broken `/admin/` auth flow.
- Current mitigation: `shouldUseLocalDecapBackend()` keeps the config on the local proxy backend when PKCE endpoints are placeholders, and the Pages workflow injects the DecapBridge values during build.
- Recommendations: Add a CI assertion that production builds do not emit placeholder DecapBridge endpoints when production auth is expected, and re-verify `/admin/config.yml` whenever auth settings change.

## Performance Bottlenecks

**Section navigation parses full HTML documents on first visit:**

- Files: `src/components/app-shell/AppShellRoot.tsx`, `src/layouts/SiteLayout.astro`, `src/pages/index.astro`, `src/pages/distro/index.astro`, `src/pages/artists/index.astro`, `src/pages/releases/index.astro`, `src/pages/services/index.astro`, `src/pages/about/index.astro`
- Problem: Shell navigation fetches full page HTML, parses it with `DOMParser`, clones the `<main>`, updates metadata, then swaps the DOM snapshot into place.
- Measurement: Not measured in-repo. The implementation indicates work proportional to full-page HTML size on the first navigation to each cached section.
- Cause: The shell emulates SPA-like section routing to preserve the embedded player without adopting a document-swapping router.
- Improvement path: Add timing instrumentation for first section transitions, consider lighter fragment endpoints for top-level sections, and keep page HTML lean to reduce parsing cost.

**Overlay/detail fetches and DOM coordination are cache-backed but still imperative:**

- Files: `src/components/app-shell/AppShellRoot.tsx`, `src/lib/app-shell/routing.ts`
- Problem: Overlay prefetching, route caches, placeholder rehydration, and focus restoration all rely on client-side DOM work and repeated selector lookups.
- Measurement: Not measured in-repo.
- Cause: Overlay continuity is implemented on top of static Astro pages rather than a dedicated client-side data model.
- Improvement path: Instrument overlay open times, reduce cross-cutting DOM queries, and keep overlay-specific behavior isolated from shell-section routing where possible.

## Fragile Areas

**`AppShellRoot` navigation, overlay, and player integration:**

- Files: `src/components/app-shell/AppShellRoot.tsx`, `src/lib/app-shell/routing.ts`, `src/components/app-shell/player-session-machine.ts`, `src/components/app-shell/player-session-ui.ts`
- Why fragile: One component owns route interception, history state, section caching, overlay caching, portal mounting, prefetching, iframe player lifecycle, and accessibility resets.
- Common failures: Back/forward regressions, stale snapshots, focus loss, broken overlay close behavior, or player state drifting from the visible UI.
- Safe modification: Validate header/footer/mobile section switches, direct detail loads, overlay continuity, and the open/minimize/reopen/stop player flow after any change in this area.
- Test coverage: Only the player state helpers are directly unit-tested (`src/components/app-shell/player-session-machine.test.ts`, `src/components/app-shell/player-session-ui.test.ts`). The shell router itself has no direct automated coverage in the repo.

**Generated Decap admin surface:**

- Files: `src/pages/admin/index.astro`, `src/pages/admin/config.yml.ts`, `src/pages/admin/media/[collection]/[asset].ts`, `src/lib/admin/decap-config.ts`
- Why fragile: Build-time environment values, generated YAML, media routing, and runtime boot scripts must all stay aligned with GitHub Pages base-path behavior.
- Common failures: Broken `/admin/config.yml`, wrong asset URLs, PKCE placeholder leakage, or media links resolving under the wrong base path.
- Safe modification: After changes, inspect the generated `/admin/config.yml`, verify `/admin/` loads, and test one media URL plus one representative collection entry.
- Test coverage: `src/lib/admin/decap-config.test.ts` covers core config branches, but the route-level output and hosted Pages wiring are not end-to-end tested in-repo.

**Distro catalog category model:**

- Files: `src/content.config.ts`, `src/lib/catalog-data.ts`, `src/lib/distro-data.ts`, `src/pages/distro/index.astro`, `src/components/cards/DistroCard.astro`
- Why fragile: Category semantics, editorial copy, rendering order, and outbound shop links are spread across content schema, helpers, and page components.
- Common failures: New categories not rendering, wrong section copy, or dead outbound Fourthwall links after content edits.
- Safe modification: Update schema, group metadata, and page copy together; then verify homepage featured distro cards and the full `/distro/` page.
- Test coverage: `src/lib/catalog-data.test.ts` only checks group ordering and omission of empty groups. No tests cover rendered cards or outbound shop-link behavior.

## Dependencies at Risk

**DecapBridge hosted auth flow:**

- Files: `.github/workflows/pages.yml`, `src/pages/admin/config.yml.ts`, `README.md`
- Risk: Production CMS access depends on DecapBridge endpoints, GitHub Actions variables, and provider-side settings staying in sync.
- Impact: `/admin/` can become unusable even when the main static site still builds and deploys.
- Migration plan: Keep the local proxy workflow healthy, document the hosted auth settings rigorously, and consider an alternative CMS/auth path if DecapBridge changes product behavior.

**Fourthwall store URLs:**

- Files: `src/config/site.ts`, `src/pages/shop/index.astro`, `src/content/distro/*.json`, `src/components/cards/DistroCard.astro`
- Risk: Commerce depends on external Fourthwall URLs for both the global store redirect and individual distro items.
- Impact: Broken or moved Fourthwall URLs produce dead-end redirects or product links without any in-repo fallback.
- Migration plan: Keep the shop base URL centralized, audit outbound product URLs periodically, and consider link validation in CI if the catalog grows.

## Test Coverage Gaps

**Shell-routed navigation and overlays:**

- What's not tested: `AppShellRoot` section interception, history behavior, overlay fetching, scroll/focus reset, and DOM snapshot application.
- Risk: The highest-complexity frontend behavior can regress without any unit or integration failure.
- Priority: High
- Difficulty to test: Requires browser-level or DOM-heavy integration coverage rather than simple pure-function tests.

**Shop redirect and redirect layout behavior:**

- What's not tested: `/shop/` redirect semantics, meta-refresh fallback, and `window.location.replace()` behavior in `src/layouts/RedirectLayout.astro`.
- Risk: External shop entry can silently fail or regress under GitHub Pages/base-path changes.
- Priority: Medium
- Difficulty to test: Needs route-level rendering plus browser navigation assertions.

**Hosted admin route output:**

- What's not tested: The fully rendered `/admin/config.yml` response under production-like environment values and GitHub Pages base-path assumptions.
- Risk: CMS access can break in deployment while unit tests still pass.
- Priority: High
- Difficulty to test: Needs integration coverage over Astro route output with environment permutations.

---

_Concerns audit: 2026-04-06_
_Update as issues are fixed or new ones discovered_
