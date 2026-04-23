# Architecture

**Analysis Date:** 2026-04-06

## Pattern Overview

**Overall:** Static Astro storefront with a React-managed persistent shell layered on top of canonical Astro routes.

**Key Characteristics:**
- Use `src/pages/**` as the canonical static route graph. Every section and detail view has a real Astro page that works on direct load, refresh, and GitHub Pages static hosting.
- Use `src/components/app-shell/AppShellRoot.tsx` to intercept same-origin top-level section links and swap cached `<main>` snapshots in place so the player, mobile nav, and shell UI survive section changes.
- Use duplicate route surfaces for detail content: full pages under `src/pages/{artists,releases,news}/[slug].astro` and fragment-only partial routes under `src/pages/app-shell-overlay/**`, both reusing the same detail components in `src/components/detail/*.astro`.
- Use `/store/` as the canonical native storefront route. `/shop/` remains a compatibility redirect, while unmapped legacy merch links can still exit to Fourthwall or artist-owned external destinations.

## Layers

**Content Schema And Source:**
- Purpose: Define the data contract for every routed page, card, and detail view.
- Location: `src/content.config.ts`, `src/content/**`
- Contains: Astro collection schemas for `artists`, `releases`, `news`, `distro`, `navigation`, `socials`, `settings`, `home`, `about`, and `services`; co-located Markdown/JSON/image source files such as `src/content/home/site.json`, `src/content/services/site.json`, `src/content/releases/barren-point.md`, and `src/content/distro/*.json`.
- Depends on: `astro:content`, `astro/loaders`, and Zod schema definitions.
- Used by: `src/lib/site-data.ts`, `src/lib/catalog-data.ts`, `src/pages/**`, `src/components/Header.astro`, `src/components/Footer.astro`, and `src/layouts/SiteLayout.astro`.

**Content Query And Normalization:**
- Purpose: Convert raw collection entries into sorted lists, singleton settings, route props, and outbound link metadata.
- Location: `src/lib/site-data.ts`, `src/lib/catalog-data.ts`, `src/lib/distro-data.ts`, `src/config/site.ts`, `src/utils/music.ts`, `src/utils/urls.ts`
- Contains: Singleton getters such as `getHomeContent()` and `getServicesContent()`, list helpers such as `listReleaseCatalog()` and `listDistroEntries()`, artist/release reference resolution, distro grouping, base-path-aware URL builders, and store/merch URL normalization.
- Depends on: `astro:content`, `astro:config/client`, collection schemas, and shared URL utilities.
- Used by: `src/layouts/SiteLayout.astro`, `src/layouts/RedirectLayout.astro`, `src/pages/**`, `src/components/detail/*.astro`, `src/components/cards/*.astro`, `src/components/Header.astro`, and `src/components/app-shell/AppShellRoot.tsx`.

**Astro Document And Route Layer:**
- Purpose: Render canonical HTML documents for each route, including metadata, shared chrome, and route-specific content.
- Location: `src/layouts/SiteLayout.astro`, `src/layouts/RedirectLayout.astro`, `src/pages/**`, `src/components/cards/*.astro`, `src/components/detail/*.astro`
- Contains: Full storefront routes, redirect routes, sitemap generation, reusable card/detail presentation, and the shared `<main data-app-shell-main>` region that the shell swaps.
- Depends on: Content query helpers, `src/components/Header.astro`, `src/components/Footer.astro`, and `src/components/app-shell/AppShell.astro`.
- Used by: Browser direct loads, GitHub Pages static output, and the client shell’s snapshot-fetching flow.

**Client Shell Orchestration:**
- Purpose: Preserve player state and shell UI while simulating SPA-like top-level navigation and overlay detail routing.
- Location: `src/components/app-shell/AppShell.astro`, `src/components/app-shell/AppShellRoot.tsx`, `src/lib/app-shell/routing.ts`
- Contains: Route classification, shell-page caching, overlay fetch/caching, history integration, mobile navigation sheet, route loading bar, transition veil, player modal, and mini-player.
- Depends on: `fetch`, `DOMParser`, `window.history`, `react-dom/createPortal`, routing helpers, link helpers, and Astro-rendered `data-*` attributes.
- Used by: `src/layouts/SiteLayout.astro` and all in-document links that point at shell-managed sections or overlay-eligible detail routes.

**Hydrated Island Reinjection:**
- Purpose: Reattach interactive React widgets into Astro placeholders after shell snapshot swaps.
- Location: `src/components/artists/ArtistsRosterFilters.tsx`, `src/components/services/ServicesInquiryForm.tsx`, placeholder markup in `src/pages/artists/index.astro` and `src/pages/services/index.astro`
- Contains: DOM-backed roster filtering and services inquiry form behavior mounted with `createPortal()` from `src/components/app-shell/AppShellRoot.tsx`.
- Depends on: Placeholder containers marked with `data-artists-roster-filters` and `data-services-inquiry-form`.
- Used by: The Artists and Services top-level sections after initial load and after same-document shell navigation.

## Data Flow

**Canonical Astro Page Render:**

1. Route files in `src/pages/**` load content through `src/lib/site-data.ts` and `src/lib/catalog-data.ts`.
2. `src/layouts/SiteLayout.astro` wraps the route with metadata, JSON-LD, `Header`, `<main data-app-shell-main>`, `AppShell`, and `Footer`.
3. `src/components/Header.astro` and `src/components/Footer.astro` read navigation, socials, and label settings from `src/content/navigation/*.json`, `src/content/socials/*.json`, and `src/content/settings/site.json`.

**Shell Section Navigation:**

1. Astro renders canonical links from `src/components/header/HeaderDesktopNav.astro`, `src/components/Footer.astro`, `src/pages/index.astro`, and the other section pages using `createProjectRelativeUrl()` from `src/config/site.ts`.
2. `src/components/app-shell/AppShellRoot.tsx` intercepts same-origin clicks whose pathname matches `parseShellSectionRoute()` in `src/lib/app-shell/routing.ts`.
3. The shell fetches the target page HTML, parses it with `DOMParser`, extracts the `<main data-app-shell-main>` subtree through `readDocumentShellPageSnapshot()`, and caches the result by normalized pathname.
4. The shell swaps the cached `mainHtml`, updates `<title>`, `<meta name="description">`, and the canonical link, then resets scroll position, focus, active-nav state, and transition/loading UI.
5. If the request or snapshot parse fails, `AppShellRoot.tsx` falls back to `window.location.assign()` so the browser performs a normal document navigation.

**Overlay Detail Routing:**

1. Cards and inline detail links always point to canonical detail URLs, not directly to overlay URLs. Examples live in `src/components/cards/ArtistCard.astro`, `src/components/cards/ReleaseCard.astro`, `src/components/cards/NewsCard.astro`, and links inside `src/components/detail/*.astro`.
2. `AppShellRoot.tsx` intercepts links whose pathname matches `parseOverlayRoute()` in `src/lib/app-shell/routing.ts`.
3. `buildOverlayFragmentUrl()` rewrites the canonical pathname to `/app-shell-overlay/...`, preserving the configured Astro base path from `src/config/site.ts`.
4. The shell fetches the partial route in `src/pages/app-shell-overlay/{artists,releases,news}/[slug].astro`, stores the fragment HTML in `overlayCacheRef`, writes overlay-specific history state, and renders the fragment into the overlay panel with `dangerouslySetInnerHTML`.
5. Direct loads, refreshes, and new-tab opens still land on `src/pages/{artists,releases,news}/[slug].astro`, so overlay behavior is an enhancement layer over normal static routes.

**Native Store And Merch Flow:**

1. Store-facing links resolve to `/store/` and `/store/[slug]/` through `StoreItem` helpers in `src/lib/catalog-data.ts`.
2. Distro cards and mapped release commerce links point to the canonical native `storePath` for each `StoreItem`.
3. Release detail merch buttons prefer a mapped native store item; only unmapped releases fall back to `resolveMerchHref()` and legacy external merch URLs.
4. `src/pages/shop/index.astro` remains a compatibility redirect to `/store/` for direct loads and older links.

**Distro Catalog Rendering:**

1. `src/content/distro/*.json` defines each item with `group`, `order`, image metadata, summary text, and `fourthwall_url`.
2. `src/lib/catalog-data.ts` loads and sorts distro entries by `order` and then `title`.
3. `src/lib/distro-data.ts` groups entries into the fixed taxonomy `Vinyls`, `Clothes`, and `Tapes`.
4. `src/pages/distro/index.astro` maps those groups into editorial sections with hard-coded per-group copy and renders `src/components/cards/DistroCard.astro`.
5. `src/pages/index.astro` reuses the same distro source list, slices the first three entries, and renders them as a homepage preview strip.

**Content Collection To Route Flow:**

1. `src/content.config.ts` validates collection data and models `releases.artist` as `reference('artists')`.
2. `src/lib/site-data.ts` serves singleton JSON entries for site-wide configuration and block-based pages: `home`, `about`, `services`, `settings`, `navigation`, and `socials`.
3. `src/lib/catalog-data.ts` serves sortable collections and static path builders for `artists`, `releases`, `news`, and `distro`.
4. Route files in `src/pages/**` combine both helper families to build section pages, detail pages, and the sitemap route in `src/pages/sitemap.xml.ts`.
5. `src/components/detail/NewsDetailContent.astro` is the final Markdown rendering boundary for news posts by calling `render(item)` from `astro:content`.

**State Management:**
- Use server-side data loading in Astro for canonical HTML generation.
- Use React local state and refs in `src/components/app-shell/AppShellRoot.tsx` for client-only shell state: active pathname, overlay state, route caches, mobile navigation, transition state, and player session.
- Use DOM `data-*` attributes as the handoff between Astro-rendered markup and client behavior. The current shell depends on markers such as `data-app-shell-main`, `data-navigation-pathname`, `data-music-streaming-service-embedded-player-*`, `data-artists-roster-filters`, and `data-services-inquiry-form`.

## Key Abstractions

**Shell Route Classifier:**
- Purpose: Decide whether a URL should be treated as a top-level shell section, a detail overlay, or ordinary browser navigation.
- Examples: `src/lib/app-shell/routing.ts`, `src/components/app-shell/AppShellRoot.tsx`
- Pattern: Keep pathname normalization and route matching in small pure helpers such as `normalizeAppPathname()`, `parseShellSectionRoute()`, `parseOverlayRoute()`, and `buildOverlayFragmentUrl()`.

**Shell Page Snapshot:**
- Purpose: Cache only the part of a full Astro document that can be safely swapped while keeping header, footer, player, and mobile nav mounted.
- Examples: `ShellPageSnapshot` and `readDocumentShellPageSnapshot()` in `src/components/app-shell/AppShellRoot.tsx`
- Pattern: Parse full HTML, clone the `<main>` subtree, clear portal placeholders before caching, then store `title`, `description`, `canonicalHref`, `mainClassName`, and `mainHtml`.

**Shared Detail Presentation:**
- Purpose: Keep direct-load detail pages and overlay detail views visually consistent.
- Examples: `src/components/detail/ArtistDetailContent.astro`, `src/components/detail/ReleaseDetailContent.astro`, `src/components/detail/NewsDetailContent.astro`, paired with `src/pages/{kind}/[slug].astro` and `src/pages/app-shell-overlay/{kind}/[slug].astro`
- Pattern: Reuse one presentational component from both route surfaces, with `showRouteNavigation={false}` disabling full-page-only navigation affordances inside overlays.

**Collection Query Split:**
- Purpose: Separate site-wide singleton content from list/catalog content.
- Examples: `src/lib/site-data.ts`, `src/lib/catalog-data.ts`, `src/lib/distro-data.ts`
- Pattern: Keep `site-data` for singleton JSON and navigation/settings, `catalog-data` for sortable collections and static path generation, and `distro-data` for distro taxonomy shaping only.

**Store Commerce Resolution:**
- Purpose: Keep store navigation canonical while preserving external merch fallback only for unmapped releases.
- Examples: `src/lib/catalog-data.ts`, `src/lib/release-commerce.ts`, `src/utils/music.ts`, `src/components/cards/DistroCard.astro`
- Pattern: Resolve native `StoreItem.storePath` first, then fall back to direct merch URLs or Fourthwall collection handles only when no native store item exists.

## Entry Points

**Document Shell:**
- Location: `src/layouts/SiteLayout.astro`
- Triggers: Every storefront route except dedicated redirect-style pages that use `src/layouts/RedirectLayout.astro`
- Responsibilities: Load global styles, compute SEO/JSON-LD metadata, render header/footer, own the `<main>` region the shell swaps, and mount the persistent app shell.

**Persistent App Shell Mount:**
- Location: `src/components/app-shell/AppShell.astro`
- Triggers: Inclusion inside `src/layouts/SiteLayout.astro`
- Responsibilities: Load navigation/settings/services data on the server and hydrate `src/components/app-shell/AppShellRoot.tsx` with `client:load`.

**Top-Level Section Routes:**
- Location: `src/pages/index.astro`, `src/pages/about/index.astro`, `src/pages/artists/index.astro`, `src/pages/distro/index.astro`, `src/pages/news/index.astro`, `src/pages/releases/index.astro`, `src/pages/services/index.astro`
- Triggers: Direct loads, static generation, and same-document shell navigation
- Responsibilities: Build canonical section markup that both browsers and the shell can consume.

**Detail Routes:**
- Location: `src/pages/artists/[slug].astro`, `src/pages/releases/[slug].astro`, `src/pages/news/[slug].astro`
- Triggers: Direct loads, refreshes, new tabs, and shell fallback when overlay fetching fails
- Responsibilities: Use static paths from `src/lib/catalog-data.ts`, wrap shared detail content in `SiteLayout.astro`, and emit route-specific metadata.

**Overlay Fragment Routes:**
- Location: `src/pages/app-shell-overlay/artists/[slug].astro`, `src/pages/app-shell-overlay/releases/[slug].astro`, `src/pages/app-shell-overlay/news/[slug].astro`
- Triggers: In-shell clicks to overlay-eligible detail links
- Responsibilities: Export `partial = true`, reuse the same static paths as canonical detail routes, and return only the fragment content needed for the overlay panel.

**Store Redirect Route:**
- Location: `src/pages/shop/index.astro`
- Triggers: Direct `/shop/` loads, sitemap consumers, or any internal link that intentionally keeps `/shop/` as the href
- Responsibilities: Redirect users to Fourthwall through `src/layouts/RedirectLayout.astro` with multiple fallbacks.

## Error Handling

**Strategy:** Fail fast for missing content, but degrade to normal browser navigation for shell-routing failures.

**Patterns:**
- `src/lib/site-data.ts` throws explicit errors when required singleton files such as `src/content/settings/site.json`, `src/content/home/site.json`, `src/content/about/site.json`, or `src/content/services/site.json` are missing.
- `src/components/app-shell/AppShellRoot.tsx` wraps shell-page and overlay fetches in `try/catch`; if caching, parsing, or fetching fails, it abandons the enhanced path and calls `window.location.assign()` so the canonical Astro route still works.
- `src/layouts/RedirectLayout.astro` layers redirect fallbacks: canonical link, meta refresh, client-side `window.location.replace()`, and the visible manual continue link rendered by `src/pages/shop/index.astro`.
- `src/config/site.ts` prevents the shell from trying to own store and external navigation by resolving those links as outbound before the click-interception layer runs.

## Cross-Cutting Concerns

**Logging:** Not implemented as a shared layer. The storefront shell relies on DOM state and browser fallbacks rather than structured runtime logging.

**Validation:** Use `src/content.config.ts` as the primary validation boundary. Load collection-backed content through `src/lib/site-data.ts` or `src/lib/catalog-data.ts` rather than bypassing Astro collection types from route files.

**Authentication:** Not applicable to the public storefront shell. The only authenticated surface is the CMS under `src/pages/admin/**`, which is isolated from storefront routing and player persistence.

---

*Architecture analysis: 2026-04-06*
