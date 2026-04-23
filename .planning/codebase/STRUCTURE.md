# Codebase Structure

**Analysis Date:** 2026-04-06

## Directory Layout

```text
[project-root]/
├── .github/workflows/        # GitHub Pages verification and deployment
├── .planning/codebase/       # Generated codebase mapping docs for GSD workflows
├── public/                   # Static passthrough assets, 404 assets, and admin runtime files
├── scripts/                  # Local CMS/dev helper scripts
├── src/
│   ├── components/           # Astro and React UI modules
│   ├── config/               # Site/base-path/shop URL helpers
│   ├── content/              # Astro content collections and collection-owned media
│   ├── data/                 # Small static data modules
│   ├── layouts/              # Document-level Astro layouts
│   ├── lib/                  # Content query, routing, and admin helper modules
│   ├── pages/                # Canonical Astro routes and overlay fragment routes
│   ├── styles/               # Global stylesheet entry
│   └── utils/                # Low-level URL, music, and formatting helpers
├── astro.config.mjs          # Astro runtime and GitHub Pages config
├── package.json              # Scripts, dependencies, and package manager version
└── tsconfig.json             # Strict TS config and `@/*` path alias
```

## Directory Purposes

**`src/pages`:**
- Purpose: Hold the canonical Astro route graph.
- Contains: Top-level sections like `src/pages/index.astro`, `src/pages/distro/index.astro`, `src/pages/services/index.astro`; detail pages like `src/pages/artists/[slug].astro`; special routes like `src/pages/sitemap.xml.ts`, `src/pages/robots.txt.ts`, `src/pages/shop/index.astro`, and `src/pages/admin/index.astro`.
- Key files: `src/pages/index.astro`, `src/pages/shop/index.astro`, `src/pages/sitemap.xml.ts`, `src/pages/app-shell-overlay/**`

**`src/pages/app-shell-overlay`:**
- Purpose: Mirror the canonical detail routes with fragment-only responses for in-shell overlays.
- Contains: `src/pages/app-shell-overlay/artists/[slug].astro`, `src/pages/app-shell-overlay/releases/[slug].astro`, `src/pages/app-shell-overlay/news/[slug].astro`
- Key files: `src/pages/app-shell-overlay/artists/[slug].astro`, `src/pages/app-shell-overlay/releases/[slug].astro`, `src/pages/app-shell-overlay/news/[slug].astro`

**`src/components/app-shell`:**
- Purpose: Own the persistent client shell and embedded-player behavior.
- Contains: `src/components/app-shell/AppShell.astro`, `src/components/app-shell/AppShellRoot.tsx`, player state helpers, and unit tests.
- Key files: `src/components/app-shell/AppShell.astro`, `src/components/app-shell/AppShellRoot.tsx`, `src/components/app-shell/player-session-machine.ts`, `src/components/app-shell/player-session-ui.ts`

**`src/components/detail`:**
- Purpose: Centralize detail-page presentation so direct-load routes and overlay fragments reuse the same view layer.
- Contains: `src/components/detail/ArtistDetailContent.astro`, `src/components/detail/ReleaseDetailContent.astro`, `src/components/detail/NewsDetailContent.astro`
- Key files: `src/components/detail/ArtistDetailContent.astro`, `src/components/detail/ReleaseDetailContent.astro`, `src/components/detail/NewsDetailContent.astro`

**`src/components/cards`:**
- Purpose: Render collection-backed summary cards that link into canonical detail routes or outbound store URLs.
- Contains: `src/components/cards/ArtistCard.astro`, `src/components/cards/ReleaseCard.astro`, `src/components/cards/NewsCard.astro`, `src/components/cards/DistroCard.astro`
- Key files: `src/components/cards/ReleaseCard.astro`, `src/components/cards/DistroCard.astro`

**`src/components/header`:**
- Purpose: Split the header into brand, desktop nav, and shell container concerns.
- Contains: `src/components/header/HeaderBrand.astro`, `src/components/header/HeaderDesktopNav.astro`, `src/components/header/HeaderShell.astro`
- Key files: `src/components/Header.astro`, `src/components/header/HeaderDesktopNav.astro`

**`src/components/services` and `src/components/artists`:**
- Purpose: Hold interactive islands that the app shell portals into section pages.
- Contains: `src/components/services/ServicesInquiryForm.tsx`, `src/components/services/services-inquiry.ts`, `src/components/artists/ArtistsRosterFilters.tsx`, `src/components/artists/artist-roster-search.ts`
- Key files: `src/components/services/ServicesInquiryForm.tsx`, `src/components/artists/ArtistsRosterFilters.tsx`

**`src/components/ui`:**
- Purpose: Provide shared UI primitives used by Astro and React components.
- Contains: shadcn-style React primitives such as `button.tsx`, `card.tsx`, `input.tsx`, `sheet.tsx`, plus `src/components/ui/grid-pattern.astro`
- Key files: `src/components/ui/button.tsx`, `src/components/ui/card.tsx`, `src/components/ui/sheet.tsx`

**`src/layouts`:**
- Purpose: Own document-level wrappers.
- Contains: `src/layouts/SiteLayout.astro` for the storefront shell and `src/layouts/RedirectLayout.astro` for external redirects.
- Key files: `src/layouts/SiteLayout.astro`, `src/layouts/RedirectLayout.astro`

**`src/lib`:**
- Purpose: Hold content-query, routing, and admin support modules.
- Contains: `src/lib/site-data.ts`, `src/lib/catalog-data.ts`, `src/lib/distro-data.ts`, `src/lib/app-shell/routing.ts`, and `src/lib/admin/**`
- Key files: `src/lib/site-data.ts`, `src/lib/catalog-data.ts`, `src/lib/distro-data.ts`, `src/lib/app-shell/routing.ts`

**`src/content`:**
- Purpose: Store all Astro content collections and collection-owned media.
- Contains: Markdown and JSON entries in `src/content/artists`, `src/content/releases`, `src/content/news`, `src/content/distro`, `src/content/navigation`, `src/content/socials`, `src/content/settings`, `src/content/home`, `src/content/about`, `src/content/services`; mirrored CMS media under `src/content/uploads`
- Key files: `src/content.config.ts`, `src/content/home/site.json`, `src/content/about/site.json`, `src/content/services/site.json`, `src/content/settings/site.json`

**`public`:**
- Purpose: Serve static files without Astro processing.
- Contains: `public/favicon.ico`, brand assets under `public/assets/images/brand`, 404 assets under `public/assets/404`, and CMS runtime assets under `public/admin`
- Key files: `public/assets/images/brand/logo.png`, `public/admin/init.js`, `public/admin/admin.css`

**`scripts`:**
- Purpose: Run local CMS helper workflows outside the Astro app itself.
- Contains: `scripts/start-cms-dev.mjs`, `scripts/start-decap-proxy.mjs`
- Key files: `scripts/start-cms-dev.mjs`, `scripts/start-decap-proxy.mjs`

## Key File Locations

**Entry Points:**
- `src/layouts/SiteLayout.astro`: Main storefront document shell with header, footer, `<main data-app-shell-main>`, and `AppShell`.
- `src/components/app-shell/AppShell.astro`: Server-side wrapper that hydrates `src/components/app-shell/AppShellRoot.tsx`.
- `src/pages/index.astro`: Home page that mixes singleton page content with catalog previews.
- `src/pages/about/index.astro`: About section route backed by `src/content/about/site.json`.
- `src/pages/artists/index.astro`: Artists roster route with a shell-portal placeholder for filters.
- `src/pages/distro/index.astro`: Distro catalog route grouped by `src/lib/distro-data.ts`.
- `src/pages/releases/index.astro`: Releases index route.
- `src/pages/news/index.astro`: News index route.
- `src/pages/services/index.astro`: Services route with a shell-portal placeholder for the inquiry form.
- `src/pages/store/index.astro`: Canonical native store collection route.
- `src/pages/store/[slug]/index.astro`: Native store item detail route.
- `src/pages/store/[slug]/checkout/index.astro`: Static checkout handoff shell.
- `src/pages/shop/index.astro`: Compatibility redirect to `/store/`.
- `src/pages/artists/[slug].astro`, `src/pages/releases/[slug].astro`, `src/pages/news/[slug].astro`: Canonical detail routes.
- `src/pages/app-shell-overlay/**`: Fragment-only detail routes for the app-shell overlay.

**Configuration:**
- `astro.config.mjs`: Static output, GitHub Pages `site`/`base`, React integration, and Tailwind Vite plugin.
- `src/content.config.ts`: Astro content collection schema definitions and references.
- `tsconfig.json`: Strict compiler settings and the `@/* -> src/*` alias.
- `src/config/site.ts`: Base-path-aware URL builders, shop URL rules, and link-attribute resolution.
- `.github/workflows/pages.yml`: Verify-and-deploy pipeline for GitHub Pages.

**Core Logic:**
- `src/components/app-shell/AppShellRoot.tsx`: Same-document shell routing, overlay loading, player persistence, history handling, and portal mounts.
- `src/lib/app-shell/routing.ts`: Pure shell-route and overlay-route parsing.
- `src/lib/site-data.ts`: Singleton content and navigation/settings loaders.
- `src/lib/catalog-data.ts`: Sorted catalog queries, reference resolution, and static path builders.
- `src/lib/distro-data.ts`: Distro grouping order and grouping helper.
- `src/utils/music.ts`: Embedded-player URL creation plus merch/shop link resolution.
- `src/utils/urls.ts`: Base-path stripping and active-nav path comparison.

**Testing:**
- `src/components/app-shell/player-session-machine.test.ts`: Player state machine coverage.
- `src/components/app-shell/player-session-ui.test.ts`: Player presentation-state coverage.
- `src/components/services/services-inquiry.test.ts`: Mailto and services inquiry helper coverage.
- `src/components/artists/artist-roster-search.test.ts`: Artist search helper coverage.
- `src/lib/catalog-data.test.ts`: Catalog grouping/sorting coverage.
- `src/lib/admin/decap-config.test.ts`: Decap config generator coverage.

## Naming Conventions

**Files:**
- Route folders mirror public URLs: `src/pages/artists/index.astro`, `src/pages/artists/[slug].astro`, `src/pages/shop/index.astro`.
- Overlay fragment folders mirror canonical detail namespaces under `src/pages/app-shell-overlay/<kind>/[slug].astro`.
- Shared Astro components use PascalCase names: `src/components/Header.astro`, `src/components/detail/ReleaseDetailContent.astro`.
- React components use PascalCase `.tsx`: `src/components/app-shell/AppShellRoot.tsx`, `src/components/services/ServicesInquiryForm.tsx`.
- Utility and helper modules use lowercase kebab-case: `src/lib/site-data.ts`, `src/lib/distro-data.ts`, `src/utils/music.ts`.
- Singleton collection entries use `site.json`: `src/content/home/site.json`, `src/content/about/site.json`, `src/content/services/site.json`, `src/content/settings/site.json`.
- Collection entry files use slug-like filenames: `src/content/releases/barren-point.md`, `src/content/distro/mass-culture-lp.json`.

**Directories:**
- Route-kind directories follow the URL namespace: `src/pages/artists`, `src/pages/releases`, `src/pages/news`, `src/pages/distro`, `src/pages/services`, `src/pages/about`, `src/pages/shop`.
- Overlay directories mirror canonical detail kinds exactly: `src/pages/app-shell-overlay/artists`, `src/pages/app-shell-overlay/releases`, `src/pages/app-shell-overlay/news`.
- Component directories group by concern rather than by framework: `src/components/app-shell`, `src/components/cards`, `src/components/detail`, `src/components/services`, `src/components/ui`.
- Content directories mirror collection names from `src/content.config.ts`: `src/content/artists`, `src/content/releases`, `src/content/news`, `src/content/distro`, `src/content/navigation`, `src/content/socials`, `src/content/settings`, `src/content/home`, `src/content/about`, `src/content/services`.

## Where to Add New Code

**New Feature:**
- Primary code: Add a new canonical route in `src/pages/<feature>/index.astro` or `src/pages/<feature>/[slug].astro`.
- Supporting data: Add or extend a collection in `src/content/<collection>/...` and wire its schema through `src/content.config.ts`.
- Shared data access: Put singleton loaders in `src/lib/site-data.ts`; put sortable list and static-path logic in `src/lib/catalog-data.ts`.
- Tests: Add path-scoped tests beside the touched helper, for example `src/lib/<module>.test.ts` or `src/components/<area>/<module>.test.ts`.

**New Top-Level Shell Section:**
- Primary code: `src/pages/<section>/index.astro`
- Shell routing: Register the section in `src/lib/app-shell/routing.ts` and keep the label mapping aligned in `src/components/app-shell/AppShellRoot.tsx`.
- Navigation: Add a corresponding content entry in `src/content/navigation/*.json`.
- If the section needs client interactivity that must survive snapshot swaps, render a placeholder in the Astro page and mount the React island from `src/components/app-shell/AppShellRoot.tsx`.

**New Overlay-Enabled Detail Type:**
- Canonical route: `src/pages/<kind>/[slug].astro`
- Overlay fragment: `src/pages/app-shell-overlay/<kind>/[slug].astro`
- Shared presentation: `src/components/detail/<Kind>DetailContent.astro`
- Static paths and lookup helpers: `src/lib/catalog-data.ts`
- Link emitters: Keep cards and inline links pointed at the canonical route. Let `src/components/app-shell/AppShellRoot.tsx` decide when to open an overlay.

**New Component/Module:**
- Implementation: Add Astro presentation under `src/components/<area>/<Name>.astro`.
- Hydrated behavior: Add React `.tsx` under `src/components/<area>/<Name>.tsx`.
- Shared shell logic: Extend `src/components/app-shell/AppShellRoot.tsx` only when the behavior truly belongs to persistent shell state, not to a single route.

**Utilities:**
- Shared helpers with Astro/content awareness: `src/lib/*.ts`
- Base-path, site URL, and shop-link rules: `src/config/site.ts`
- Low-level helpers without Astro-specific data access: `src/utils/*.ts`

## Special Directories

**`src/pages/app-shell-overlay`:**
- Purpose: Fragment-only route surface for detail overlays.
- Generated: No
- Committed: Yes

**`src/content/uploads`:**
- Purpose: Mirrored CMS media browser root used alongside collection-owned assets.
- Generated: No
- Committed: Yes

**`public/admin`:**
- Purpose: Static CMS bootstrap assets referenced by `src/pages/admin/index.astro`.
- Generated: No
- Committed: Yes

**`.planning/codebase`:**
- Purpose: Generated mapping documents consumed by other GSD commands.
- Generated: Yes
- Committed: Yes

---

*Structure analysis: 2026-04-06*
