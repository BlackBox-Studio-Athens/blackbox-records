# AGENTS.md (project: blackbox-records)

Global AGENTS instructions in `C:\Users\SVall\.codex\AGENTS.md` are authoritative.
If this file conflicts with the global file, follow the global file.

## Purpose

Build and maintain the BlackBox Records Astro site.

Current production storefront behavior still uses static GitHub Pages deployment and an external Fourthwall commerce handoff, but the repo now also carries planning and future implementation work for a native commerce migration. Do not assume commerce must remain external forever; follow the active planning docs when working in that area.

## Current stack

- pnpm workspace monorepo
- Astro 6, static output
- React integration for shadcn-ui primitives and the persistent app shell
- Tailwind CSS v4 + shadcn-ui primitives
- Worker backend uses TypeScript + Hono + code-first OpenAPI
- Astro content collections for:
  - artists
  - releases
  - distro
  - news
  - navigation
  - socials
  - settings
  - home
  - about
  - services

## New-thread startup checklist

Read these first before editing:

1. `README.md`
2. `apps/web/astro.config.mjs`
3. `apps/web/src/content.config.ts`
4. `apps/web/src/layouts/SiteLayout.astro`
5. `apps/web/src/components/app-shell/AppShell.astro`
6. `apps/web/src/components/app-shell/AppShellRoot.tsx`
   Then inspect only task-relevant files with `rg` and scoped reads.

## Commands

- Install deps: `pnpm install`
- Frontend dev server: `pnpm dev` or `pnpm dev:web`
- Frontend-only static-site launcher: `pnpm site:dev`
- Backend dev server: `pnpm dev:backend`
- Backend dev server with local stripe-mock API override: `pnpm dev:backend:mock`
- Backend dev server with official local stripe-mock API override: `pnpm dev:backend:mock-api`
- Backend sandbox dev server: `pnpm dev:backend:sandbox`
- Backend sandbox deploy: `pnpm deploy:backend:sandbox`
- Cloudflare Pages frontend deploy workflow: `.github/workflows/cloudflare-pages.yml`
- Full local stack with real Stripe test mode: `pnpm dev:stack:stripe-test`
- Local official stripe-mock launcher: `pnpm stripe-mock:local`
- Full local stack with mock Stripe mode: `pnpm dev:stack:stripe-mock`
- Alias for the same official stripe-mock API mode: `pnpm dev:stack:stripe-mock-api`
- Real Stripe test checkout preflight: `pnpm checkout:preflight:stripe-test`
- Local signed Stripe webhook fixture simulator: `pnpm stripe:webhook:simulate:local`
- Backend local D1 smoke check: `pnpm --filter @blackbox/backend d1:smoke:local`
- Backend local D1 seed apply: `pnpm --filter @blackbox/backend d1:seed:local`
- Backend local D1 prepare flow: `pnpm --filter @blackbox/backend d1:prepare:local`
- Backend local Stripe mock seed: `pnpm --filter @blackbox/backend d1:seed:stripe-mock:local`
- Backend local Stripe mock readiness check: `pnpm --filter @blackbox/backend d1:check:stripe-mock:local`
- Backend local Stripe test seed from ignored SQL: `pnpm --filter @blackbox/backend d1:seed:stripe-test:local`
- Backend local D1 migration list/apply:
  - `pnpm --filter @blackbox/backend d1:migrations:list:local`
  - `pnpm --filter @blackbox/backend d1:migrations:apply:local`
- Backend sandbox D1 migration list/apply:
  - `pnpm --filter @blackbox/backend d1:migrations:list:sandbox`
  - `pnpm --filter @blackbox/backend d1:migrations:apply:sandbox`
- Backend Prisma client generation: `pnpm --filter @blackbox/backend prisma:generate`
- Backend local secrets: copy `apps/backend/.dev.vars.example` to `apps/backend/.dev.vars`
- Generate backend OpenAPI docs and client package: `pnpm generate:api`
- Clean dev run: `pnpm dev:clean`
- Unit tests: `pnpm test:unit`
- Format/lint/type/content checks: `pnpm check`
- Apply formatter: `pnpm format`
- Lint only: `pnpm lint`
- Production build: `pnpm build`

### WebStorm launcher contract

- The canonical committed IDE launcher is `.run/BlackBox Local Stack.run.xml`.
- It must keep running the root script `pnpm dev:stack:stripe-mock` so the default local stack works without real Stripe keys.
- Do not add more committed WebStorm run configurations unless the user explicitly asks; keep the IDE surface to one working local-stack entry.
- The root script `pnpm dev:backend:mock` must keep running the backend package script `pnpm --filter @blackbox/backend dev:mock`.
- `pnpm site:dev` must keep the site on `http://127.0.0.1:4321/blackbox-records/`.
- If that port is unavailable, the launcher should fail clearly rather than silently drifting to another port.
- Only the static-site launcher should keep a browser/debug target attached.
- Backend local D1 comes from Wrangler automatically during Worker dev; do not add a second D1 process to the run-config flow.
- The stack launcher scripts must run D1 migrations and seed SQL before starting the Worker/static site.
- Keep `BlackBox Local Stack` working whenever frontend env, backend env, ports, checkout setup, D1 migrations, seed files, or WebStorm run configs change. If a change breaks the canonical launcher, fix the launcher or docs in the same commit.
- The deterministic local mock checkout smoke path is `http://127.0.0.1:4321/blackbox-records/store/disintegration-black-vinyl-lp/checkout/`; stripe-mock mode now seeds every current visible store item with fake local checkout state.
- `pnpm dev:stack:stripe-test` is the real local checkout path and requires `PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, and ignored local Stripe test Price mappings.
- Run `pnpm checkout:preflight:stripe-test` before `pnpm dev:stack:stripe-test`; it verifies the real Stripe test publishable key, backend local secret file, ignored local Price mapping seed, and gitignore protection without printing secrets.
- `pnpm dev:stack:stripe-mock` starts official `stripe-mock` locally through Go, points the real Stripe SDK at the local proxy on `http://127.0.0.1:12110`, generates local-only fake `Stock`, `ItemAvailability`, and `price_mock_*` mappings for every current store item, and renders a frontend mock checkout panel. It must not require Docker or `apps/backend/.dev.vars`. It is not a real embedded Checkout browser substitute, and the generated 99/99 stock values are not real inventory counts.
- `pnpm dev:stack:stripe-mock-api` is kept as a terminal alias for the same official stripe-mock API path. Do not reintroduce the old in-process mock gateway as the default local stack.
- `pnpm stripe-mock:local` owns the local dev-only compatibility proxy. Mock-specific patches for official `stripe-mock` limitations belong there or in tests/scripts, not in production checkout/order use cases.
- `pnpm stripe:webhook:simulate:local` posts a signed local checkout-session fixture to `/api/stripe/webhooks` using the fake local `whsec_local_mock` secret. Use it only for local webhook contract checks.
- `pnpm --filter @blackbox/backend d1:check:stripe-mock:local` verifies the generated local mock checkout rows for all current store items and should be run when store content, mock seeds, D1 migrations, or checkout readiness assumptions change.
- Runtime backend secrets belong in Worker secrets or `apps/backend/.dev.vars`, not in Astro public env vars or GitHub deploy credentials.
- The backend runtime binding contract now includes `COMMERCE_DB`.
- The backend persistence runtime now uses Prisma + `@prisma/adapter-d1` behind repository seams in:
  - `apps/backend/src/domain/commerce/repositories/`
  - `apps/backend/src/infrastructure/persistence/prisma/`
- The committed Prisma client lives under `apps/backend/src/generated/prisma/`.
- `apps/backend/prisma/schema.prisma` uses a placeholder local SQLite URL for the current Prisma 6 CLI generation only; Worker runtime queries still go through `env.COMMERCE_DB`.
- Prisma 7 moves datasource URLs to `prisma.config.ts`; do not remove the schema URL until the repo upgrades from Prisma 6 because Prisma 6 still requires it during generation.
- D1 migrations live under `apps/backend/prisma/migrations/`, and Wrangler applies them through the `COMMERCE_DB` binding.
- The current pre-production D1 schema history is consolidated into one baseline migration; do not rewrite migration history after real sandbox or production commerce data exists.
- Backend-local seed SQL lives under `apps/backend/prisma/seeds/`.
- The first backend application read seam now lives under `apps/backend/src/application/commerce/readers/` and resolves offer availability by `storeItemSlug` without mirroring the frontend `ItemAvailability` type.
- The backend stock application seam now lives under `apps/backend/src/application/commerce/stock/`.
- Internal stock operations are now contractually separated onto a protected operator hostname, referred to in repo docs as `ops.<managed-zone>` until the real custom domain is provisioned.
- Protected operator routes belong under:
  - static Astro UI: `/stock/`
  - static Astro detail state: `/stock/?variantId=<variantId>`
  - Worker API: `/api/internal/*`
- The internal Worker API now exposes operator-only stock routes under `/api/internal/variants/*`.
- The protected stock operations UI is served by the static Astro app from `apps/web/src/pages/stock/index.astro` and calls same-origin `/api/internal/*` on the protected operator hostname.
- For local split-port development, set `PUBLIC_BACKEND_BASE_URL=http://127.0.0.1:8787` so the static UI can call `pnpm dev:backend`; the Worker must allow that browser origin through `CHECKOUT_RETURN_ORIGINS`.
- Cloudflare Access + Google protects that hostname through an explicit email allowlist; do not add shopper login or reuse Decap auth for runtime stock operations.
- Worker-side operator attribution comes from the Access-authenticated request header `cf-access-authenticated-user-email`, which the stock-write routes persist as `actor_email`.
- The D1 stock ledger now uses `Stock`, `StockChange`, and `StockCount`, with `onlineQuantity` tracked on `Stock`.
- D1 is the stock source of truth. Spreadsheets are temporary capture/reporting only; operators reconcile offline movement through `/stock/` using `StockChange` for known deltas and `StockCount` for recounts.
- `OnlineStock` is the conservative checkout-facing quantity and may be lower than physical `Stock`.
- Do not introduce `prisma migrate dev`, `prisma db push`, or `prisma migrate deploy` into this repo workflow.
- The current backend-local secret contract is `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
- `STRIPE_API_BASE_URL` is an optional backend runtime variable for local Stripe API overrides; the committed Wrangler `mock` and `mock-api` envs bind it to `http://127.0.0.1:12110` for the local official stripe-mock proxy.
- `PUBLIC_CHECKOUT_CLIENT_MODE` is the browser checkout mode switch. Use `stripe` for real Stripe.js and `mock` only for the local stripe-mock flow.
- Checkout return origins and split-port browser API CORS origins are allowlisted through the Worker runtime variable `CHECKOUT_RETURN_ORIGINS`; never trust browser-submitted or arbitrary `Referer` origins.
- Cloudflare Pages production origin is `https://blackbox-records-web.pages.dev`; add preview origins only as exact emitted origins during validation, never as `*.pages.dev`.
- The static checkout shell uses browser-safe `PUBLIC_STRIPE_PUBLISHABLE_KEY` to initialize Stripe.js; never expose `STRIPE_SECRET_KEY` through Astro public env.
- Public shopper checkout APIs now live under `/api/store/*` and `/api/checkout/*`.
- Checkout creation is Worker-owned through a backend Stripe gateway seam; route files must not instantiate Stripe directly.
- Stripe Checkout Sessions are the approved v1 payment creation path, using embedded Checkout (`ui_mode: embedded_page` on the current Stripe API version).
- The web checkout shell mounts Stripe embedded Checkout from the Worker-returned `clientSecret`; browser payloads must stay limited to app identities such as `storeItemSlug` and `variantId`.
- Phase 7 requires shopper-facing store URLs to describe the sellable item option, not legacy release shorthand. The old `barren-point` local smoke route is a compatibility alias for the canonical `Disintegration` / `Black Vinyl LP` route.
- Phase 7 cart UX should be Shopify-familiar but BlackBox-owned: cart icon, single-item cart drawer, order summary, and checkout CTA using Astro/React/shadcn. Do not implement true multi-item cart, quantity controls, discount codes, or browser-owned commerce authority in this milestone.

### Required command policy

- After finishing any implementation that changes behavior, run:
  - `pnpm test:unit`
  - `pnpm check`
  - `pnpm build`
- `pnpm check` includes Prettier format verification, ESLint, and Astro/TypeScript content checks.
- Before pushing, run the same three commands again unless they were just run against the exact final tree you are pushing
- Do not claim completion or push with unverified behavioral changes

## Deployment and URL model

- Current static deployment target: GitHub Pages
- Future canonical static deployment target after Phase 7.1 acceptance: Cloudflare Pages
- Current CI/CD workflow: `.github/workflows/pages.yml`
- Future Cloudflare Pages CI/CD workflow during Phase 7.1: `.github/workflows/cloudflare-pages.yml`
- GitHub Pages builds are gated by:
  - `pnpm test:unit`
  - `pnpm check`
  - `pnpm build`
- `pnpm check` is intentionally editor-independent; do not rely on WebStorm formatting or inspections as the only style gate.
- The workflow uses `withastro/action@v6.1.1` with Node 24, pnpm 10.33.2, and built-in pnpm/Astro caching
- Configured in `apps/web/astro.config.mjs`
  - `site: https://blackbox-studio-athens.github.io`
  - `base: /blackbox-records/`
- Do not change `site` or `base` unless the task explicitly requires deployment URL changes.
- Cloudflare Pages migration work must keep the frontend static and deploy only the prebuilt `apps/web/dist` artifact.
- The Cloudflare Pages workflow must run `pnpm test:unit`, `pnpm check`, and `pnpm build` before Direct Upload to the `blackbox-records-web` Pages project.
- The Cloudflare Pages workflow may pass only browser-safe public Astro env into the build: `PUBLIC_BACKEND_BASE_URL` and `PUBLIC_STRIPE_PUBLISHABLE_KEY`; keep production `PUBLIC_CHECKOUT_CLIENT_MODE` unset.
- Cloudflare Pages must not own backend routes, Pages Functions, D1 access, Stripe secrets, webhooks, operator auth, stock mutations, order state, or future BOX NOW runtime secrets.
- GitHub Pages remains rollback until Phase `07.1-05` retires it as canonical after acceptance.
- Native commerce migration work must treat the current GitHub Pages + external-shop setup as the existing baseline, not the final architecture.

## Project map

- Layout/document shell:
  - `apps/web/src/layouts/SiteLayout.astro`
- Persistent shell:
  - `apps/web/src/components/app-shell/AppShell.astro`
  - `apps/web/src/components/app-shell/AppShellRoot.tsx`
  - `apps/web/src/lib/app-shell/routing.ts`
- Content/data queries:
  - `apps/web/src/lib/site-data.ts`
- Detail fragments:
  - `apps/web/src/components/detail/*.astro`
- Cards/hero/header/footer:
  - `apps/web/src/components/**`
- Overlay partial routes:
  - `apps/web/src/pages/app-shell-overlay/**`
- Routed pages:
  - `apps/web/src/pages/**`
- Styles:
  - `apps/web/src/styles/global.css`
- Static brand assets:
  - `apps/web/public/assets/`
- Worker backend:
  - `apps/backend/src/index.ts`
  - `apps/backend/wrangler.jsonc`
- Generated API client package:
  - `packages/api-client/src/index.ts`
  - `packages/api-client/src/generated/**`

## Content ownership and edit points

- Artists: `apps/web/src/content/artists/*.md`
- Releases: `apps/web/src/content/releases/*.md`
- Distro items: `apps/web/src/content/distro/*.json`
- News: `apps/web/src/content/news/*.md`
- Header/footer navigation: `apps/web/src/content/navigation/*.json`
- Footer social links: `apps/web/src/content/socials/*.json`
- Label metadata / JSON-LD: `apps/web/src/content/settings/site.json`
- Homepage copy: `apps/web/src/content/home/site.json`
- About page copy: `apps/web/src/content/about/site.json`
- Services page copy: `apps/web/src/content/services/site.json`

All JSON collection entries include `$schema` links to Astro-generated collection schemas for editor/CMS validation.

## Content model notes

- `releases.artist` is an Astro `reference('artists')`
- Collection-owned images for artists/releases/news use Astro `image()`
- Home/about decorative images also use Astro `image()`
- Artists and releases may carry an optional `shop_collection_handle` for future Fourthwall collection linking
- Home/about/settings/navigation/socials use structured JSON collections
- Query helpers live in `apps/web/src/lib/site-data.ts`

### Artist image standard

- Homepage featured roster is designed for a strict `3:4` portrait crop
- Ideal band-delivered source: `1800 x 2400`
- Acceptable minimum: `1200 x 1600`
- Ask bands to keep the subject centered with headroom and side breathing room
- Default rendering uses `object-fit: cover` and centered cropping
- If an artist image crops badly, replace the source image before introducing focal-point config

## Routing model

- Top-level section routes (`/`, `/distro/`, `/news/`, `/artists/`, `/releases/`, `/services/`, `/about/`) are same-document shell routes
- `AppShellRoot` fetches and caches rendered `<main>` content from the real Astro pages, then swaps it in place
- The shell now owns section-transition UX:
  - scroll reset
  - focus reset to `main`
  - section transition veil
  - route loading indicator
- Internal clicks to release/artist/news detail routes are intercepted and opened as overlays
- Direct loads to `/releases/[slug]/`, `/artists/[slug]/`, `/news/[slug]/` still render full Astro pages
- `News` currently remains routed content, but is hidden from the visible homepage/header/footer IA while `Distro` is active
- Overlay HTML is fetched from `partial = true` routes under `apps/web/src/pages/app-shell-overlay/`
- Non-shell routes still use normal document navigation

## Player model

- The music player is owned by the persistent shell, not page-local components
- Supports Bandcamp and Tidal embeds
- Single active session only
- Session states:
  - modal open
  - minimized
- Minimized player survives shell-managed top-level navigation
- The mini player should only appear after real embed intent:
  - the iframe must load
  - the user must interact with the iframe area
- Modal dismissal semantics are stateful:
  - before embed interaction: `Close` destroys the session
  - after embed interaction: `Minimize` keeps a `Player Ready` pill
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
- It now prioritizes a visible two-line title and a calm `Player Ready · {Provider}` status line
- If touched again, validate the floating pill carefully on narrow viewports

## Current Astro features in use

- content collections with schemas
- `reference()`
- `image()`
- `getCollection()`, `getEntry()`, `render()`
- partial routes for overlay content
- targeted `data-astro-prefetch`

## Styling model

- Primary styles are in `apps/web/src/styles/global.css`
- shadcn-ui primitives live in `apps/web/src/components/ui/`
- Keep the monochrome visual language and the current header/hero/releases direction unless the task explicitly changes it

## SEO and metadata model

- Metadata and Organization JSON-LD are assembled in `apps/web/src/layouts/SiteLayout.astro`
- Organization/social data comes from collection-backed settings and socials
- `apps/web/src/pages/sitemap.xml.ts` builds sitemap entries from static routes + collections

## Stripe guidance

- When working on Stripe-related planning or implementation, consult Stripe MCP when available.
- If Stripe MCP is unavailable or incomplete for the task, consult official Stripe docs.
- If guidance conflicts, prefer the current official Stripe API reference and Stripe docs.

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

These checks are mandatory both:

- after implementation is complete
- immediately before pushing

## Known limitations / handoff notes

- Do not casually move player logic back into page-local scripts
- Do not reintroduce Astro `ClientRouter` or other body-swapping route navigation for top-level sections without re-evaluating embedded-player persistence
- Prefetch exists both through link attributes and shell-managed fragment fetches; keep changes deliberate
- The minimized player was recently hardened for cross-browser visibility and compact mobile layout; validate it if touched
- The shell section-transition veil and focus-reset path are now part of the routing model, not cosmetic extras

## Reasonable next TODOs

1. Tighten content-query hygiene by centralizing repeated collection sorting/filtering helpers
2. If a CMS is added, build it on top of the existing `apps/web/src/content/**` collections rather than introducing a parallel content system
3. If player behavior changes, validate:
   - top-level section continuity
   - mobile nav continuity
   - overlay continuity
   - console cleanliness
4. If the minimized player is redesigned again, decide explicitly between:
   - floating over content
   - reserving bottom space

## Avoid

- Reintroducing Jekyll/Decap-era files or assumptions
- Moving shell state into scattered document-global scripts
- Reintroducing real route swaps on top-level section links without revisiting player persistence
- Introducing SSR/live content features unless the deployment model intentionally changes away from static GitHub Pages
