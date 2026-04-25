# BlackBox Records

Static Astro site for the BlackBox Records label.

## Stack

- Astro 6 (static output)
- React integration (for shadcn-ui primitives)
- Tailwind CSS v4 + shadcn-ui setup (design implemented in Astro templates + `apps/web/src/styles/global.css`)
- Type-safe content collections (`apps/web/src/content`)
- Separate Cloudflare Worker backend scaffold (`apps/backend/src/index.ts`) using TypeScript + Hono
- Code-first OpenAPI documents and a generated `@blackbox/api-client` workspace package

## URL model

The production deployment is configured for GitHub Pages project hosting:

- `site`: `https://blackbox-studio-athens.github.io`
- `base`: `/blackbox-records/`

This is configured in `apps/web/astro.config.mjs`.

## Navigation model

- Top-level sections (`/`, `/distro/`, `/artists/`, `/releases/`, `/services/`, `/about/`) are shell-routed in the browser and swapped in-place.
- Release, artist, and news detail routes remain direct-load Astro pages, but in-site clicks open them through the app-shell overlay.
- The Bandcamp/Tidal player stays mounted in the persistent shell so playback can survive top-level section switches.
- The minimized player is only shown after the user interacts with the embed area; a loaded embed alone does not create the pill.
- Real document navigations still occur for direct loads, refreshes, new tabs, and the external shop redirect.

## Prerequisites

- Node.js 22.12+
- pnpm 10+

## Setup

```sh
pnpm install
```

## shadcn MCP registries

`apps/web/components.json` is configured with a curated multi-registry set:

- `@21st`: `https://21st.dev/r/shadcn/{name}`
- `@magicui`: `https://magicui.design/r/{name}`
- `@aceternity`: `https://ui.aceternity.com/registry/{name}.json`
- `@blocks`: `https://blocks.so/r/{name}.json`
- `@hextaui`: `https://hextaui.com/r/{name}.json`

Quick checks:

```sh
pnpm --dir apps/web dlx shadcn@latest search '@magicui' -q hero -l 5
pnpm --dir apps/web dlx shadcn@latest search '@blocks' -q dashboard -l 5
```

Notes:

- `@21st` can be used directly for item installs (for example `@21st/accordion`), but listing/search from its registry endpoint is currently unstable.
- Keep third-party registry usage on a curated allowlist and review dependency/file diffs before accepting generated code.
- Shared policy and new-project checklist: `../SHADCN-MCP-REGISTRY-PLAYBOOK.md`.

## Local development

```sh
pnpm dev
```

Run the default full local commerce stack:

```sh
pnpm dev:stack:stripe-mock
```

This is what `BlackBox Local Stack` runs in WebStorm. It prepares local D1, starts the Worker with an in-process mock Stripe gateway, and starts the static Astro site with a mock checkout panel. It does not require Docker, real Stripe keys, or `apps/backend/.dev.vars`.

Local mock checkout smoke path:

```text
http://127.0.0.1:4321/blackbox-records/store/disintegration-black-vinyl-lp/checkout/
```

That canonical path remains the fastest smoke path. Legacy `/store/barren-point/` and `/store/barren-point/checkout/` paths remain compatibility redirects for the same item option. In stripe-mock mode, the local seed generator now creates fake development `Stock`, `ItemAvailability`, and `price_mock_*` mappings for every current store item so each item can exercise the local no-network checkout path. Those values are not real inventory counts or Stripe test evidence.

Run the full local commerce stack with real Stripe test mode:

```powershell
$env:PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_..."
pnpm checkout:preflight:stripe-test
pnpm dev:stack:stripe-test
```

Before using `dev:stack:stripe-test`:

1. Copy `apps/backend/.dev.vars.example` to `apps/backend/.dev.vars`.
2. Fill `STRIPE_SECRET_KEY` with a real Stripe `sk_test_...` value.
3. Copy `apps/backend/prisma/seeds/local-stripe-test-state.sql.example` to the ignored `apps/backend/prisma/seeds/local-stripe-test-state.sql`.
4. Replace the example `price_...` value with a real Stripe test Price ID.
5. Run `pnpm checkout:preflight:stripe-test` to verify the local-only setup before starting servers.

Run the full local commerce stack with stripe-mock:

```sh
pnpm dev:stack:stripe-mock
```

This mode points the Worker at an in-process mock Stripe gateway through the `mock` Wrangler env, generates local-only mock commerce state for every current store item, and renders a local mock checkout panel in the browser. It validates backend checkout flow control, but it is not a real embedded Checkout browser experience. It does not require Docker, real Stripe keys, or `apps/backend/.dev.vars`.

Run the Astro frontend explicitly:

```sh
pnpm dev:web
```

Run the frontend-only static-site launcher used by the committed WebStorm run configuration:

```sh
pnpm site:dev
```

Run the separate Worker backend scaffold locally:

```sh
pnpm dev:backend
```

Smoke-check the backend-local D1 binding:

```sh
pnpm --filter @blackbox/backend d1:smoke:local
```

Seed the backend-local commerce-state tables:

```sh
pnpm --filter @blackbox/backend d1:seed:local
```

Prepare local D1 for the full stack:

```sh
pnpm --filter @blackbox/backend d1:prepare:local
```

Seed local Stripe mapping variants:

```sh
pnpm --filter @blackbox/backend d1:seed:stripe-mock:local
pnpm --filter @blackbox/backend d1:check:stripe-mock:local
pnpm checkout:preflight:stripe-test
pnpm --filter @blackbox/backend d1:seed:stripe-test:local
```

List or apply backend D1 migrations:

```sh
pnpm --filter @blackbox/backend d1:migrations:list:local
pnpm --filter @blackbox/backend d1:migrations:apply:local
```

Generate the committed Prisma client for the Worker backend:

```sh
pnpm --filter @blackbox/backend prisma:generate
```

Bootstrap backend-local Wrangler secrets:

```sh
cp apps/backend/.dev.vars.example apps/backend/.dev.vars
```

Deploy the sandbox Worker manually:

```sh
pnpm deploy:backend:sandbox
```

When the frontend starts consuming Worker APIs, point it at the local backend with:

```sh
PUBLIC_BACKEND_BASE_URL=http://127.0.0.1:8787 pnpm dev:web
```

Compatibility alias:

```sh
pnpm worker:dev
```

Current Worker scope:

- no probe endpoints such as `healthz`, `status`, or `readyz`
- Hono owns the HTTP interface layer; unmatched routes currently return JSON `404`
- the backend-local D1 binding contract is `COMMERCE_DB`
- Prisma runtime access now exists behind backend-only repository seams
- the generated Prisma client is committed under `apps/backend/src/generated/prisma/`
- the D1 migration workflow baseline now exists under `apps/backend/prisma/migrations/`
- backend-local seed data now exists under `apps/backend/prisma/seeds/`
- a backend-only StoreOffer reader can now resolve mapped availability from D1
- protected internal stock routes now exist under `/api/internal/variants/*`
- the static Astro app now exposes the protected stock operations UI at `/stock/`
- D1-backed `Stock`, `StockChange`, and `StockCount` now back the operator stock ledger contract
- public store-offer and checkout API routes now exist under `/api/store/*` and `/api/checkout/*`
- checkout creation is Worker-owned and uses Stripe embedded Checkout Sessions through a backend gateway seam
- the static checkout shell mounts Stripe embedded Checkout from Worker-created sessions
- `pnpm dev:stack:stripe-test` prepares local D1, applies the ignored real Stripe test mapping seed, starts the Worker, and starts the static site
- `pnpm dev:stack:stripe-mock` prepares local D1, generates local-only mock commerce state for every current store item, starts the Worker with its in-process mock Stripe gateway, and starts the static site in mock checkout mode
- no webhook order authority, stock decrement, or frontend D1 wiring yet
- no backend production deployment path yet
- backend-owned OpenAPI documents are emitted to `apps/backend/openapi/`
- generated frontend-facing types and `openapi-typescript-fetch` wrappers live in `packages/api-client/`
- frontend discovers the backend only through `PUBLIC_BACKEND_BASE_URL`
- the dedicated sandbox deploy target is the `blackbox-records-backend-sandbox` Worker on `workers.dev`
- runtime business secrets stay in Worker secrets or backend-local Wrangler `.dev.vars`, not in browser env vars or GitHub deploy credentials

Clean dev run (mirrors the `ateleia` workflow):

```sh
pnpm dev:clean
```

## Verification

```sh
pnpm test:unit
pnpm check
pnpm build
```

`pnpm check` is the repo-owned quality gate. It runs Prettier format verification, ESLint, and the existing Astro/TypeScript content checks.

Backend-only verification:

```sh
pnpm test:backend
pnpm check:backend
```

Generate backend OpenAPI documents and refresh the generated client package:

```sh
pnpm generate:api
```

## Backend contract model

- The backend owns the HTTP contract through code-first OpenAPI definitions.
- Public shopper APIs and staff-only internal APIs are emitted as separate OpenAPI documents:
  - `apps/backend/openapi/public-openapi.json`
  - `apps/backend/openapi/internal-openapi.json`
- Frontend code must consume backend API types through `@blackbox/api-client`, not by importing backend runtime modules.
- `@blackbox/api-client` uses `openapi-typescript-fetch` as the runtime client layer on top of the generated schema types.

## Frontend-to-Worker URL contract

- The browser-facing Astro app owns `PUBLIC_BACKEND_BASE_URL` for Worker discovery.
- The browser also owns `PUBLIC_STRIPE_PUBLISHABLE_KEY` so Stripe.js can initialize embedded Checkout.
- Local checkout mode is controlled by `PUBLIC_CHECKOUT_CLIENT_MODE`.
  - `stripe` uses real Stripe.js embedded Checkout and requires `PUBLIC_STRIPE_PUBLISHABLE_KEY`.
  - `mock` skips Stripe.js and renders a local mock checkout panel after `StartCheckout`.
- Local development uses:
  - `pnpm dev:web`
  - `pnpm dev:backend`
  - `PUBLIC_BACKEND_BASE_URL=http://127.0.0.1:8787`
- Sandbox will use the same env var with a future stable Worker hostname from Phase `05-05`.
- The sandbox backend target is the dedicated `workers.dev` Worker named `blackbox-records-backend-sandbox`.
- Its stable URL shape is `https://blackbox-records-backend-sandbox.<your-account-subdomain>.workers.dev`.
- The account-level `workers.dev` subdomain is owned in Cloudflare, not in this repo, so the Worker name is the repo-controlled stable portion of the sandbox hostname.
- The frontend must not guess production or sandbox backend origins in code.
- Worker secrets, D1 bindings, Stripe secret keys, Cloudflare Access config, and CI credentials remain backend/server-side only.

## Protected operator hostname contract

- Internal stock operations live on a separate protected operator hostname, referred to in repo docs as `ops.<managed-zone>` until the real account-owned custom domain is provisioned.
- This hostname is distinct from:
  - the public GitHub Pages storefront
  - the public sandbox `workers.dev` backend used for shopper/browser sandbox checks
- Protected operator routes belong under:
  - static Astro UI: `/stock/`
  - static Astro detail state: `/stock/?variantId=<variantId>`
  - Worker API: `/api/internal/*`
- The protected surface is not a public-path subtree on the shopper hostname.
- Cloudflare Access uses Google as the identity provider for this hostname, and operator entry is controlled by an explicit email allowlist that stays out of the repo.
- Worker-side operator attribution comes from the Access-authenticated request header `cf-access-authenticated-user-email`, which the internal stock-write routes now persist as `actor_email`.
- The internal Worker API now exposes operator-only stock lookup and stock-write routes under `/api/internal/variants/*`.
- The protected stock operations UI is built by the static Astro app at `/stock/`; it calls same-origin `/api/internal/*` on the protected operator hostname.
- For local split-port development, set `PUBLIC_BACKEND_BASE_URL=http://127.0.0.1:8787` so the static UI can call the local Worker; the Worker allows browser API calls only from origins listed in `CHECKOUT_RETURN_ORIGINS`.
- The stock UI is intentionally absent from public navigation. If served directly from public GitHub Pages before the protected ops hostname is provisioned, it is not a production-safe stock operations surface.
- D1 is the stock source of truth. Spreadsheets are temporary capture/reporting only; operators reconcile offline movement through `/stock/` using `StockChange` for known deltas and `StockCount` for recounts.
- `OnlineStock` is the conservative checkout-facing quantity and may be lower than physical `Stock`.
- This contract does not introduce shopper login; public storefront, public checkout, and sandbox shopper browsing remain unauthenticated.

## Worker secrets and CI auth

- Backend runtime secrets belong to the Worker runtime, not to Astro browser env vars and not to GitHub Actions.
- The backend runtime binding contract now includes:
  - `COMMERCE_DB`
- The backend persistence runtime now uses:
  - `@prisma/adapter-d1`
  - a committed generated Prisma client under `apps/backend/src/generated/prisma/`
  - repository seams under `apps/backend/src/domain/commerce/repositories/` and `apps/backend/src/infrastructure/persistence/prisma/`
- The current backend-local runtime secret contract is:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- The optional backend-local Stripe mock/test override is:
  - `STRIPE_API_BASE_URL`
- `STRIPE_API_BASE_URL` defaults to real Stripe when unset. The committed `mock` Wrangler env binds it to `mock` for the in-process local mock Stripe gateway.
- The checkout return-origin and browser API CORS allowlist is configured server-side with `CHECKOUT_RETURN_ORIGINS`.
- `COMMERCE_DB` is runtime-only backend infrastructure, not a browser env var and not a GitHub Actions credential.
- `CHECKOUT_RETURN_ORIGINS` is a Worker runtime variable, not a browser-selected return URL or an open CORS wildcard.
- `apps/backend/prisma/schema.prisma` includes a local placeholder SQLite URL only to satisfy the current Prisma 6 CLI; Worker runtime access still goes through `env.COMMERCE_DB`.
- Future privileged backend-only values such as BOX NOW credentials also remain runtime-only until the phases that introduce them.
- `PUBLIC_BACKEND_BASE_URL` remains the only browser-facing backend env.
- `PUBLIC_STRIPE_PUBLISHABLE_KEY` is safe browser configuration for Stripe.js and must not be confused with `STRIPE_SECRET_KEY`.

## D1 migration workflow

- `apps/backend/prisma/schema.prisma` is the declarative schema model.
- Prisma 7 moves datasource URLs to `prisma.config.ts`; keep the schema URL until the repo upgrades from Prisma 6 because Prisma 6 still requires it during generation.
- `apps/backend/prisma/migrations/*.sql` is the committed D1 schema history.
- The current pre-production commerce schema uses:
  - `0001_initial_commerce_state.sql` as the baseline store-state migration
  - `0002_add_internal_stock_ledger.sql` as the additive stock-ledger migration
- Wrangler is the only apply path for D1 schema changes.
- Prisma is used for client generation and SQL diff generation, not direct schema deployment.
- Manual Cloudflare dashboard schema edits are out of workflow.
- Do not use:
  - `prisma migrate dev`
  - `prisma db push`
  - `prisma migrate deploy`

Future migration flow:

1. Update `apps/backend/prisma/schema.prisma`.
2. Ensure local D1 is up to date with committed migrations.
3. Create a new empty migration file with `pnpm --filter @blackbox/backend d1:migrations:create -- <name>`.
4. Fill that file with `prisma migrate diff`.
   - Use `pnpm --filter @blackbox/backend exec prisma migrate diff --from-empty --to-schema-datamodel ./prisma/schema.prisma --script --output <file>` only for `0001_initial_commerce_state.sql`.
   - Use `pnpm --filter @blackbox/backend exec prisma migrate diff --from-local-d1 --to-schema-datamodel ./prisma/schema.prisma --script --output <file>` for later migrations.
5. Apply locally with `pnpm --filter @blackbox/backend d1:migrations:apply:local`.
6. Apply to sandbox with `pnpm --filter @blackbox/backend d1:migrations:apply:sandbox` when ready.

Do not rewrite committed migration history after real sandbox or production commerce data exists.

Local seed flow:

1. Apply migrations locally.
2. Run `pnpm --filter @blackbox/backend d1:seed:local`.
3. Use direct D1 queries or backend-local smoke checks to verify seeded rows exist.

Local checkout seed flow:

1. For stripe-mock, run `pnpm --filter @blackbox/backend d1:seed:stripe-mock:local`; the generator derives current store items from static content and applies local-only fake 99/99 stock plus `price_mock_*` values.
2. Verify stripe-mock readiness with `pnpm --filter @blackbox/backend d1:check:stripe-mock:local`; it reports any current store item missing local mock availability, stock, or `price_mock_*` mapping rows.
3. For real Stripe test mode, copy `apps/backend/prisma/seeds/local-stripe-test-state.sql.example` to ignored `apps/backend/prisma/seeds/local-stripe-test-state.sql`, replace the example price with a real `price_...`, then run `pnpm --filter @blackbox/backend d1:seed:stripe-test:local`.
4. Do not commit real Stripe test Price IDs.

Local development:

```sh
cp apps/backend/.dev.vars.example apps/backend/.dev.vars
```

- Fill `apps/backend/.dev.vars` locally before running `pnpm dev:backend` or `pnpm dev:backend:sandbox`.
- Verify the local D1 binding with `pnpm --filter @blackbox/backend d1:smoke:local`.
- `apps/backend/.dev.vars` is local-only, ignored by git, and must never be committed.
- Missing backend runtime secrets are acceptable only for local work that does not exercise those routes.
- Current Stripe-backed checkout routes require `STRIPE_SECRET_KEY` before creating or reading Checkout Sessions.
- Checkout session creation and split-port browser API reads accept origins only from `CHECKOUT_RETURN_ORIGINS`; local defaults include `http://127.0.0.1:4321`, `http://localhost:4321`, and the GitHub Pages origin.
- The static checkout shell also requires `PUBLIC_STRIPE_PUBLISHABLE_KEY` before it can mount embedded Checkout in the browser.
- `stripe-mock` mode does not require `PUBLIC_STRIPE_PUBLISHABLE_KEY` or `apps/backend/.dev.vars` because the Worker `mock` env binds harmless local Stripe mock configuration and the browser renders the local mock checkout panel instead of loading Stripe.js.

CI/deploy credentials:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

- These GitHub credentials are only for authenticating CI or a developer into Cloudflare for deployment.
- They are not the Worker's runtime business secrets.
- Deployed runtime secrets terminate as Cloudflare Worker secrets/bindings, not as browser env vars and not as GitHub-only config.

## Sandbox backend CI/CD

- The static Astro site continues to deploy only through `.github/workflows/pages.yml`.
- The separate Worker sandbox deploy path is isolated in `.github/workflows/cloudflare-sandbox.yml`.
- That workflow:
  - runs on pushes to `sandbox`
  - can also be triggered manually
  - runs `pnpm generate:api`
  - runs `pnpm test:unit`
  - runs `pnpm check`
  - deploys only the backend workspace to Cloudflare Workers
- The sandbox `workers.dev` backend is a reachable sandbox target for browser checks, Stripe return URLs, and webhook testing.
- Cloudflare Access is not part of public sandbox browsing at this stage.
- Phase `06.1.1` now locks a separate protected staff-only hostname and Google-backed Access contract for internal stock work, while keeping the public sandbox backend reachable and unauthenticated.

## GitHub Pages CI/CD

- Deployment is handled by `.github/workflows/pages.yml`.
- The workflow uses `withastro/action@v5` and only deploys if all of these succeed:
  - `pnpm test:unit`
  - `pnpm check`
  - `pnpm build`
- Pushes go directly to `main` in this repo.
- If CI fails on `main`, GitHub Pages does not publish the broken revision; fix it with a follow-up commit or revert the bad commit on `main`.
- The Astro frontend remains the active Pages deployment target. The Worker scaffold is separate and currently local-only until later commerce infrastructure phases land.

## Content model

Content is managed in the repo through Astro content collections, and Decap CMS now provides an editing layer on top of the same `apps/web/src/content/**` files.

- Artists: `apps/web/src/content/artists/*.md`
- Releases: `apps/web/src/content/releases/*.md`
- Distro items: `apps/web/src/content/distro/*.json`
- News: `apps/web/src/content/news/*.md`
- Home copy: `apps/web/src/content/home/*.json`
- About copy: `apps/web/src/content/about/*.json`
- Services copy: `apps/web/src/content/services/*.json`
- Navigation: `apps/web/src/content/navigation/*.json`
- Social links: `apps/web/src/content/socials/*.json`
- Site settings: `apps/web/src/content/settings/*.json`
- Collection-owned images live next to their Markdown entries and are validated by Astro content schemas.
- JSON collection entries include `$schema` references to Astro-generated collection schemas for editor/CMS validation.
- Artists and releases may include an optional `shop_collection_handle` for future Fourthwall collection linking.
- Home/about decorative images are now validated as Astro image fields.
- Home, About, and Services now store their page sections as editable block lists in Decap so whole sections can be deleted or reordered when needed.

Collection schemas are defined in `apps/web/src/content.config.ts`.

## Decap CMS

BlackBox now ships with an Astro-hosted Decap CMS at `/admin/`.

- Admin entry: `apps/web/src/pages/admin/index.astro`
- Generated config: `apps/web/src/pages/admin/config.yml.ts`
- Admin styling: `apps/web/public/admin/admin.css`
- Preview styling/runtime: `apps/web/public/admin/preview.css`, `apps/web/public/admin/init.js`
- Local Decap proxy: `apps/web/scripts/start-decap-proxy.mjs`
- Combined local CMS dev server: `apps/web/scripts/start-cms-dev.mjs`
- Global Decap media browser root: `apps/web/src/content/uploads/`

### Local CMS development

Start Astro on a dedicated CMS port and the local Decap proxy together:

```sh
pnpm cms:dev
```

Run only the local Decap proxy:

```sh
pnpm cms:proxy
```

Default local ports:

- Astro CMS dev server: `4322`
- Decap proxy: `8082`

### Decap environment variables

- `DECAP_SITE_URL`
  - Optional production override for the published site root used by Decap.
- `DECAP_REPOSITORY`
  - GitHub repository slug used by DecapBridge in production.
- `DECAP_BRANCH`
  - Branch Decap writes to. Defaults to `main`.
- `DECAPBRIDGE_BASE_URL`
  - DecapBridge auth base URL.
- `DECAPBRIDGE_AUTH_ENDPOINT`
  - PKCE auth endpoint path.
- `DECAPBRIDGE_AUTH_TOKEN_ENDPOINT`
  - PKCE token endpoint path.
- `DECAPBRIDGE_GATEWAY_URL`
  - DecapBridge gateway URL.
- `DECAP_LOCAL_PROXY_PORT`
  - Local Decap proxy port. Defaults to `8082`.
- `CMS_DEV_PORT`
  - Astro port used by `pnpm cms:dev`. Defaults to `4322`.

### GitHub Pages + DecapBridge setup

Production `/admin/config.yml` is generated during the GitHub Pages build, so the DecapBridge values must be present in the Pages workflow environment.

Add these in GitHub:

- Repository `Settings -> Secrets and variables -> Actions -> Variables`
  - `DECAP_SITE_URL`
    - `https://blackbox-studio-athens.github.io/blackbox-records/`
  - `DECAP_REPOSITORY`
    - `BlackBox-Studio-Athens/blackbox-records`
  - `DECAP_BRANCH`
    - `main`
  - `DECAPBRIDGE_BASE_URL`
    - `https://auth.decapbridge.com`
  - `DECAPBRIDGE_GATEWAY_URL`
    - `https://gateway.decapbridge.com`
- Repository `Settings -> Secrets and variables -> Actions -> Secrets`
  - `DECAPBRIDGE_AUTH_ENDPOINT`
    - The exact PKCE auth endpoint path DecapBridge generated for this site
  - `DECAPBRIDGE_AUTH_TOKEN_ENDPOINT`
    - The exact PKCE token endpoint path DecapBridge generated for this site

Notes:

- Keep the endpoint values in GitHub `Secrets`, not `Variables`.
- The workflow now injects these values during the Pages build, so the published `/admin/config.yml` can emit the real `git-gateway` PKCE config.
- Local `pnpm cms:dev` remains on the proxy backend unless you explicitly provide real DecapBridge values in your local environment.
- For hosted production access, keep the DecapBridge site on `pkce` and leave only Google enabled as a login provider.

### Production auth model

- Local development uses `decap-server` with the `proxy` backend. No DecapBridge login is required.
- When the DecapBridge PKCE endpoints are not configured yet, the generated config stays on the local `proxy` backend instead of emitting broken placeholder login URLs.
- Production `/admin/` only builds a DecapBridge PKCE config once the DecapBridge environment values above are set correctly.
- The published `/admin/` is intended to be Google-only through DecapBridge social login. The repo does not emit Decap `classic` username/password auth.
- The local `pnpm cms:dev` flow is intentionally different from production and continues using the unauthenticated proxy backend for editing convenience.

### Hosted login troubleshooting

- If the published `/admin/` still shows a password form, the cause is DecapBridge dashboard/provider configuration, not the generated repo config.
- In DecapBridge, keep the site on `pkce`, disable any non-Google providers, and turn off any optional password or email/password login toggles.
- The published `/admin/config.yml` should show `backend.name: git-gateway` and `auth_type: pkce`. If it does, the repo side is already configured for Google-only social login.

### Media assets behavior

- The Decap `Media assets` drawer is rooted at `apps/web/src/content/uploads/`.
- That folder acts as a mirrored library of the images currently in use across the site, including the brand assets that otherwise live in `public/assets/images/brand/`.
- Decap’s global media drawer does not aggregate collection-local image folders into one repo-wide browser, so the mirrored uploads folder exists specifically to make those current assets appear in the drawer.
- Collection image fields still keep their per-collection `media_folder` / `public_folder` overrides, so editing existing content continues to save files beside the relevant entries and remains compatible with Astro `image()` fields.

### Collection coverage

The CMS edits the same Astro content files already used by the site:

- Single-file collections:
  - `home`
  - `about`
  - `services`
  - `settings`
- Folder collections:
  - `navigation`
  - `socials`
  - `artists`
  - `releases`
  - `distro`
  - `news`

Image widgets are scoped per collection so saved paths stay compatible with Astro `image()` fields and collection-local assets.

## Artist image standard

Featured artist imagery is currently designed around a strict portrait crop on the homepage roster.

- Ideal source delivery: `1800 x 2400`
- Acceptable minimum: `1200 x 1600`
- Composition guidance:
  - keep the subject centered
  - leave headroom and side breathing room for hard crops
  - avoid tiny logos or overly distant subjects for roster usage
- Current UI behavior:
  - homepage featured roster uses a strict `3:4` crop
  - images use `object-fit: cover`
  - images are center-cropped by default

If a source crops badly, replace the source image rather than adding focal-point config by default.

## Project structure

- `src/layouts/`: document and page shell layouts
- `src/components/`: shared sections, cards, shell/player UI, UI primitives
- `src/pages/`: routed Astro pages and endpoints
- `src/styles/`: global Tailwind/shadcn layer
- `public/assets/`: static brand assets and 404 assets

## Build output

`pnpm build` outputs static files to `dist/`.

## WebStorm run configuration

- `.run/BlackBox Local Stack.run.xml` is the only committed WebStorm launcher for now.
- It runs `pnpm dev:stack:stripe-mock`, which starts local D1 prep, the local Worker backend with an in-process mock Stripe gateway, and the local Astro frontend without Docker or real Stripe keys.
- Real Stripe test mode remains available from the terminal through `pnpm dev:stack:stripe-test`.
- Focused backend/frontend scripts remain available from the terminal, not committed IDE run configs.
- The static-site launcher remains pinned to `http://127.0.0.1:4321/blackbox-records/`.
- If port `4321` is already in use, the static-site launcher fails fast instead of silently switching ports.
- Local D1 comes from Wrangler automatically during Worker dev; no separate D1 process is part of the run-config flow.
- The stack launchers run D1 migrations and seed SQL before starting long-running services.
- `pnpm --filter @blackbox/backend d1:check:stripe-mock:local` verifies every current store item has local mock checkout readiness rows after the mock seed runs.
- `pnpm --filter @blackbox/backend d1:smoke:local` remains a verification command, not a launch prerequisite.
