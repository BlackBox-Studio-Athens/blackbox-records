# AGENTS.md (project: blackbox-records)

Global AGENTS instructions in `C:\Users\SVall\.codex\AGENTS.md` are authoritative.
If this file conflicts with the global file, follow the global file.

## Purpose

Build and maintain a static Astro site for BlackBox Records, deployed to GitHub Pages.
Commerce remains external via Fourthwall.

## Current stack

- Astro 5, static output
- React integration for shadcn-ui primitives and the persistent app shell
- Tailwind CSS v4 + shadcn-ui primitives
- Astro content collections for:
  - artists
  - releases
  - news
  - navigation
  - socials
  - settings
  - home
  - about

## New-thread startup checklist

Read these first before editing:

1. `README.md`
2. `astro.config.mjs`
3. `src/content.config.ts`
4. `src/layouts/SiteLayout.astro`
5. `src/components/app-shell/AppShell.astro`
6. `src/components/app-shell/AppShellRoot.tsx`
7. `SESSION-TRANSCRIPT-2026-03-01.md`

Then inspect only task-relevant files with `rg` and scoped reads.

## Commands

- Install deps: `pnpm install`
- Dev server: `pnpm dev`
- Clean dev run: `pnpm dev:clean`
- Unit tests: `pnpm test:unit`
- Type/content checks: `pnpm check`
- Production build: `pnpm build`

## Deployment and URL model

- Static deployment target: GitHub Pages
- CI/CD workflow: `.github/workflows/pages.yml`
- GitHub Pages builds are gated by:
  - `pnpm test:unit`
  - `pnpm check`
  - `pnpm build`
- The workflow uses `withastro/action@v5` with Node 22 and built-in pnpm/Astro caching
- Configured in `astro.config.mjs`
  - `site: https://zantoichi.github.io`
  - `base: /blackbox-records/`
- Do not change `site` or `base` unless the task explicitly requires deployment URL changes.

## Project map

- Layout/document shell:
  - `src/layouts/SiteLayout.astro`
- Persistent shell:
  - `src/components/app-shell/AppShell.astro`
  - `src/components/app-shell/AppShellRoot.tsx`
  - `src/lib/app-shell/routing.ts`
- Content/data queries:
  - `src/lib/site-data.ts`
- Detail fragments:
  - `src/components/detail/*.astro`
- Cards/hero/header/footer:
  - `src/components/**`
- Overlay partial routes:
  - `src/pages/app-shell-overlay/**`
- Routed pages:
  - `src/pages/**`
- Styles:
  - `src/styles/global.css`
- Static brand assets:
  - `public/assets/`

## Content ownership and edit points

- Artists: `src/content/artists/*.md`
- Releases: `src/content/releases/*.md`
- News: `src/content/news/*.md`
- Header/footer navigation: `src/content/navigation/*.json`
- Footer social links: `src/content/socials/*.json`
- Label metadata / JSON-LD: `src/content/settings/site.json`
- Homepage copy: `src/content/home/site.json`
- About page copy: `src/content/about/site.json`

All JSON collection entries include `$schema` links to Astro-generated collection schemas for editor/CMS validation.

## Content model notes

- `releases.artist` is an Astro `reference('artists')`
- Collection-owned images for artists/releases/news use Astro `image()`
- Artists and releases may carry an optional `shop_collection_handle` for future Fourthwall collection linking
- Home/about/settings/navigation/socials use structured JSON collections
- Query helpers live in `src/lib/site-data.ts`

### Artist image standard

- Homepage featured roster is designed for a strict `3:4` portrait crop
- Ideal band-delivered source: `1800 x 2400`
- Acceptable minimum: `1200 x 1600`
- Ask bands to keep the subject centered with headroom and side breathing room
- Default rendering uses `object-fit: cover` and centered cropping
- If an artist image crops badly, replace the source image before introducing focal-point config

## Routing model

- Top-level section routes (`/`, `/news/`, `/artists/`, `/releases/`, `/about/`) are same-document shell routes
- `AppShellRoot` fetches and caches rendered `<main>` content from the real Astro pages, then swaps it in place
- The shell now owns section-transition UX:
  - scroll reset
  - focus reset to `main`
  - section transition veil
  - route loading indicator
- Internal clicks to release/artist/news detail routes are intercepted and opened as overlays
- Direct loads to `/releases/[slug]/`, `/artists/[slug]/`, `/news/[slug]/` still render full Astro pages
- Overlay HTML is fetched from `partial = true` routes under `src/pages/app-shell-overlay/`
- Non-shell routes still use normal document navigation

## Player model

- The music player is owned by the persistent shell, not page-local components
- Supports Bandcamp and Tidal embeds
- Single active session only
- Session states:
  - modal open
  - minimized
- Minimized player survives shell-managed top-level navigation
- Explicit `Stop` destroys the active iframe/session

### Important limitation

Third-party iframe playback cannot survive full reloads, new tabs, or non-shell navigations.
This is an iframe boundary, not an app bug.

## Current UI/navigation behavior

- Header and footer section links are intercepted by the shell
- Section switches should always land at `scrollY = 0`
- Section switches should leave focus on `main[data-app-shell-main]`
- A dark section-transition veil is the primary fake-navigation cue
- The top loading bar is secondary
- Mobile nav also routes through the same shell path as desktop

## Mobile-first status

- The architecture is still aligned with persistent playback on mobile:
  - same-document top-level navigation
  - shell-owned player
  - shell-owned mobile nav
- The minimized player is intentionally floating over content on mobile
- It is tuned to prefer a compact single-line pill when the title fits
- If touched again, validate the floating pill carefully on narrow viewports

## Current Astro features in use

- content collections with schemas
- `reference()`
- `image()`
- `getCollection()`, `getEntry()`, `render()`
- partial routes for overlay content
- targeted `data-astro-prefetch`

## Styling model

- Primary styles are in `src/styles/global.css`
- shadcn-ui primitives live in `src/components/ui/`
- Keep the monochrome visual language and the current header/hero/releases direction unless the task explicitly changes it

## SEO and metadata model

- Metadata and Organization JSON-LD are assembled in `src/layouts/SiteLayout.astro`
- Organization/social data comes from collection-backed settings and socials
- `src/pages/sitemap.xml.ts` builds sitemap entries from static routes + collections

## Verification checklist (minimum)

1. `pnpm test:unit` succeeds
2. `pnpm check` succeeds
3. `pnpm build` succeeds
4. If UI/layout changed, validate with DevTools MCP
5. If routing/player behavior changed, validate:
   - header section switch
   - footer section switch
   - mobile nav section switch
   - open/minimize/reopen/stop player
   - overlay continuity
   - console cleanliness
6. If content schemas or collections changed, verify affected routes still render and no collection errors appear
7. Update `README.md`, this file, and the session handoff file if setup or architecture assumptions changed

## Known limitations / handoff notes

- Do not casually move player logic back into page-local scripts
- Do not reintroduce Astro `ClientRouter` or other body-swapping route navigation for top-level sections without re-evaluating embedded-player persistence
- Prefetch exists both through link attributes and shell-managed fragment fetches; keep changes deliberate
- Decorative `home` / `about` image fields are still string paths, not Astro `image()` fields
- The minimized player was recently hardened for cross-browser visibility and compact mobile layout; validate it if touched
- The shell section-transition veil and focus-reset path are now part of the routing model, not cosmetic extras

## Reasonable next TODOs

1. Tighten content-query hygiene by centralizing repeated collection sorting/filtering helpers
2. Consider migrating `home` / `about` decorative image fields to an Astro-assets-friendly model if editor-managed validation becomes important
3. If a CMS is added, build it on top of the existing `src/content/**` collections rather than introducing a parallel content system
4. If player behavior changes, validate:
   - top-level section continuity
   - mobile nav continuity
   - overlay continuity
   - console cleanliness
5. If the minimized player is redesigned again, decide explicitly between:
   - floating over content
   - reserving bottom space

## Avoid

- Reintroducing Jekyll/Decap-era files or assumptions
- Moving shell state into scattered document-global scripts
- Reintroducing real route swaps on top-level section links without revisiting player persistence
- Introducing SSR/live content features unless the deployment model intentionally changes away from static GitHub Pages
