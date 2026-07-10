# BlackBox Records

Static Astro site for the BlackBox Records label.

## Stack

- Astro 7 (static output)
- React integration (for shadcn-ui primitives)
- Tailwind CSS v4 + shadcn-ui setup (design implemented in Astro templates + `apps/web/src/styles/global.css`)
- Type-safe content collections (`apps/web/src/content`)
- Separate Cloudflare Worker backend scaffold (`apps/backend/src/index.ts`) using TypeScript + Hono
- Code-first OpenAPI documents and a generated `@blackbox/api-client` workspace package

## URL model

The site uses one Product Environment model: Local, UAT, and PRD. The full matrix lives in [`docs/environment-model.md`](docs/environment-model.md).

UAT is the GitHub Pages static frontend:

- `site`: `https://blackbox-studio-athens.github.io`
- `base`: `/blackbox-records/`
- browser API target: `UAT_PUBLIC_BACKEND_BASE_URL`, expected to point at the UAT Worker

PRD is the Cloudflare Pages static frontend:

- `site`: `https://blackbox-records-web.pages.dev`
- `base`: `/`
- browser API target: `PRD_PUBLIC_BACKEND_BASE_URL`, expected to point at the PRD Worker
- commerce state: disabled until the explicit PRD-open production-readiness gate is present

The PRD build job in the shared static workflow sets these non-secret build-time variables before deploying the disabled PRD static artifact from `apps/web/dist`:

- `ASTRO_SITE_URL`: `https://blackbox-records-web.pages.dev`
- `ASTRO_BASE_PATH`: `/`
- `PUBLIC_BACKEND_BASE_URL`: from `PRD_PUBLIC_BACKEND_BASE_URL`

GitHub Pages UAT keeps the repo defaults in `apps/web/astro.config.mjs`:

- `site`: `https://blackbox-studio-athens.github.io`
- `base`: `/blackbox-records/`

For label-member UAT, the GitHub Pages URL is intentionally wired to the UAT Worker on every `main` push. Tester instructions live in [`docs/stripe-sandbox-uat.md`](docs/stripe-sandbox-uat.md). This is Stripe test mode only and is not PRD go-live approval.

### PRD Holding Page

The temporary public PRD Holding Page is built from the unlinked `/prd-holding/` source route and deployed only by the manual `.github/workflows/prd-holding-page.yml` workflow. The workflow prepares `apps/web/dist-holding`, uploads it as a one-day artifact, and can deploy it to the `holding` branch of the existing `blackbox-records-web` Pages project after approval through the protected `prd-holding` GitHub Actions environment.

- Build the normal PRD-shaped site: `pnpm build`
- Prepare the allowlisted holding artifact: `pnpm prd:holding:prepare`
- Check route isolation, assets, metadata, and workflow isolation: `pnpm prd:holding:check`
- Branch alias: `https://holding.blackbox-records-web.pages.dev`
- Public apex after separately approved activation: `https://blackboxrecordsathens.com/`

The holding branch is a temporary public surface inside PRD. It is not UAT, the full PRD readiness site, Promotion Evidence, or proof that checkout and live providers are ready. Domain activation remains an operator-controlled sequence: verify the branch alias, snapshot current DNS and redirect state, install the temporary exact-apex `302` guard, associate the apex with the existing Pages project, target the verified holding alias, wait for active TLS, configure exact-host HTTPS and `www` redirects, then remove the guard and verify. The full site stays at `https://blackbox-records-web.pages.dev/` until the production go-live change passes every live gate. At launch, retain the holding branch as the immediate rollback target until the full site is stable.

Backend Worker observability uses source-controlled Workers Logs/Traces config and structured safe runtime events. Operator notes live in [`docs/worker-observability.md`](docs/worker-observability.md).

## Navigation model

- Top-level sections (`/`, `/distro/`, `/artists/`, `/releases/`, `/services/`, `/about/`) are shell-routed in the browser and swapped in-place.
- Release, artist, and news detail routes remain direct-load Astro pages, but in-site clicks open them through the app-shell overlay.
- The Bandcamp/Tidal player stays mounted in the persistent shell so playback can survive top-level section switches.
- The minimized player is only shown after the user interacts with the embed area; a loaded embed alone does not create the pill.
- Real document navigations still occur for direct loads, refreshes, new tabs, and the external shop redirect.

## Catalog Promotion

Decap remains editorial-only. Content publication and buyable status are separate: generated catalog artifacts derive from current Store Item content, UAT provider state is applied through Stripe test-mode catalog tooling, and runtime checkout safety stays with D1, Worker gates, and operator controls. GitHub Pages UAT is validated by a separate post-merge UAT provider smoke workflow after the shared static deployment workflow in `pages.yml` completes. See [docs/catalog-promotion.md](docs/catalog-promotion.md) for catalog artifact, rollback, and Promotion Evidence expectations.

## Prerequisites

- Node.js 24 LTS
- pnpm 10.33.4, via the repo `packageManager` field
- Go, only for the local official `stripe-mock` launcher

## Setup

```sh
pnpm install
```

## Toolchain policy

- Keep local and CI Node on the current 24.x LTS line; do not move this repo to Node Current for routine dependency updates.
- Keep TypeScript on `5.9.3` until `@astrojs/check` and `openapi-typescript` publish compatible TypeScript 6 peer ranges.
- Keep Prisma on the latest compatible v7 line, currently `7.8.0`; datasource URL configuration lives in `apps/backend/prisma.config.ts`.
- Keep repo Wrangler on the workspace dependency, currently `wrangler@4.94.0`; if a global Wrangler is installed, keep it aligned for ad hoc terminal use.
- Keep GitHub CLI and Serena MCP updated locally, but do not commit machine-local tool shims, caches, credentials, or MCP memories.

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

For Codex/browser smoke checks, prefer Astro's background dev server:

```sh
pnpm site:dev:bg
pnpm site:dev:status
pnpm site:dev:logs
pnpm site:dev:stop
```

`pnpm site:dev` remains the foreground static-site launcher for WebStorm and local stack process supervision.

Run the default full local commerce stack:

```sh
pnpm dev:stack:stripe-mock
```

This is what `BlackBox Local Stack` runs in WebStorm. It prepares local D1, starts official `stripe-mock` through local Go tooling, starts the Worker with the Stripe SDK pointed at the local mock API proxy, and starts the static Astro site with a mock checkout panel. Local newsletter signup uses the committed fake `re_mock_*` Resend config through a no-network provider mock. It does not require Docker, real Stripe keys, real Resend keys, or `apps/backend/.dev.vars`.

Local mock checkout smoke path:

```text
http://127.0.0.1:4321/blackbox-records/store/checkout/
```

That canonical path remains the fastest cart checkout smoke path. `/store/barren-point/` is the separate Barren Point distro item and is not a Disintegration alias. In stripe-mock mode, the local seed generator now creates fake development `Stock`, `ItemAvailability`, and `price_mock_*` mappings for every current store item so each item can exercise the local no-network checkout path. Those values are not real inventory counts or Stripe test evidence.

Run the full local commerce stack with real Stripe test mode:

```powershell
pnpm checkout:preflight:stripe-test
pnpm dev:stack:stripe-test
```

Run the at-will automated Stripe UAT smoke:

```sh
pnpm smoke:stripe-uat -- --scenario all
```

The Stripe UAT smoke runner targets the deployed UAT Worker path, drives Stripe-hosted Checkout with Playwright, checks UAT D1 remotely through Wrangler, and writes ignored evidence to `.codex-artifacts/smoke/uat/stripe-sandbox/<run-id>/` with a `summary.json` at the run root and `evidence.json` per scenario.

The runner defaults to the GitHub Pages UAT site and is also used by the downstream GitHub Actions `catalog-promotion-uat` environment after the UAT Pages deploy succeeds.

Supported scenarios are `happy_path_paid`, `three_d_secure`, `card_declined`, `insufficient_funds`, `expired_card`, `incorrect_cvc`, `processing_error`, and `all`. The committed JetBrains run configuration `Stripe Sandbox Smoke` runs `--scenario all` through `pnpm smoke:stripe-uat`. Stripe’s current test card reference lives at <https://docs.stripe.com/testing#cards>. Paid deployed UAT smoke expects the persistent Stripe Dashboard/Workbench webhook endpoint to deliver to `https://blackbox-records-backend-uat.blackboxrecordsathens.workers.dev/api/stripe/webhooks`; `stripe listen` is local/temporary diagnostic tooling only and is not persistent readiness evidence.

Run the UAT Resend smoke when you need to prove the UAT Worker can register a newsletter Contact through Resend:

```sh
pnpm smoke:resend-uat
```

The Resend UAT smoke posts a synthetic consented signup to `/api/newsletter/registrations`, expects the UAT sink routing to return `{"status":"registered"}`, and writes ignored evidence to `.codex-artifacts/smoke/uat/resend-uat/<run-id>/`. It does not print Resend API keys, Topic IDs, Contact IDs, or account diagnostics.

Render local paid-order email previews when you need to inspect the generated shopper and ops HTML:

```sh
pnpm email:previews
```

This writes ignored HTML files under `.codex-artifacts/email-previews/` for Browser Use or the documented DevTools fallback. The previews use repo-owned template builders and do not create provider state.

Run the UAT static smoke when you need to verify deployed GitHub Pages static routes, Decap admin boot/config, representative public pages, checkout shell visibility, sitemap, robots, console errors, and high-risk public-secret exposure:

```sh
pnpm smoke:uat-static -- --site-url https://blackbox-studio-athens.github.io/blackbox-records --scenario all
```

The UAT static smoke runner is manual by design and writes ignored evidence to `.codex-artifacts/smoke/uat/uat-static/<run-id>/`. The supported scenarios are `cms_admin`, `cms_assets`, `checkout_shell`, `public_routes`, and `all`. It never creates provider state.

The PRD no-payment promotion smoke runner writes ignored evidence to `.codex-artifacts/smoke/prd/stripe-promotion/<run-id>/`. The `not_configured` paid-policy status means live payment was not attempted, not that PRD commerce is open.

Before accepting sandbox catalog or paid-order webhook readiness, run:

```sh
pnpm stripe:webhooks:verify --env uat
pnpm stripe:catalog:verify --env uat
```

Catalog Field Ownership is one-way. Repo content owns Product Projection fields that Stripe-hosted Checkout displays (`name`, `description`, image URLs, and app metadata), while Stripe owns Price Authority (`amount`, `currency`, active Price identity, and lookup key). A UAT product-presentation change starts in repo content or the generated projection, then runs `pnpm stripe:catalog:verify --env uat`, followed by reviewed `pnpm stripe:catalog:verify --env uat --apply` only when the dry-run plan is understood. A price change starts in Stripe as a replacement Price: move the lookup key/metadata to the replacement Price, archive the stale Price, then rerun catalog verification so D1 `VariantStripeMapping` and `StoreOfferSnapshot` follow Stripe without an Astro deploy. Stripe Dashboard edits to repo-owned Product presentation are catalog drift unless the repo projection is updated.

Full GitHub Pages UAT catalog alignment uses generated repo artifacts and a sandbox-only reset/apply flow. Run `pnpm stripe:catalog:artifacts:generate` after Store Item content changes and let `pnpm stripe:catalog:artifacts:check` catch drift in `pnpm check`. The reset command is dry-run by default and only deactivates BlackBox-owned Stripe sandbox Products/Prices; `pnpm stripe:catalog:verify --env uat --apply` creates the fresh active sandbox catalog and syncs D1 mappings/snapshots. See [`docs/stripe-sandbox-uat.md`](docs/stripe-sandbox-uat.md) for the full reset, D1 seed, deploy, and smoke sequence.

The webhook verifier is read-only. It proves the persistent endpoint URL, test-mode status, required catalog event subscriptions, UAT Worker `STRIPE_WEBHOOK_SECRET` presence, and the six-hour scheduled catalog-verification backstop when Cloudflare schedule credentials are available. It does not prove the existing endpoint signing secret equals the Worker secret because Stripe does not return an existing endpoint secret through list/retrieve APIs. After endpoint creation, endpoint recreation, or secret rotation, update the UAT Worker from `apps/backend` with `pnpm exec wrangler secret put STRIPE_WEBHOOK_SECRET --env uat` without logging the value, then rerun the verifier and paid smoke.

Before using `dev:stack:stripe-test`:

1. Copy `apps/backend/.dev.vars.example` to `apps/backend/.dev.vars`.
2. Fill `STRIPE_SECRET_KEY` with a real Stripe `sk_test_...` value.
3. Fill `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID` with the test-mode Payment Method Configuration ID.
4. Copy `apps/backend/prisma/seeds/local-stripe-test-state.sql.example` to the ignored `apps/backend/prisma/seeds/local-stripe-test-state.sql`.
5. Replace the example `price_...` value with a real Stripe test Price ID.
6. Run `pnpm checkout:preflight:stripe-test` to verify the local-only setup before starting servers.

Run the full local commerce stack with stripe-mock:

```sh
pnpm dev:stack:stripe-mock
```

This mode runs official `stripe-mock` locally through `go run github.com/stripe/stripe-mock@latest`, points the Worker Stripe SDK at a local compatibility proxy on `http://127.0.0.1:12110`, generates local-only mock commerce state for every current store item, and returns a local-only mock Checkout URL. It validates backend checkout flow control and Stripe API request shape, and local newsletter signup returns registered through the Worker-owned no-network Resend mock. It is not a real Stripe-hosted Checkout browser experience. It requires Go, but it does not require Docker, real Stripe keys, real Resend keys, or `apps/backend/.dev.vars`.

The first run may download and compile `stripe-mock` through Go. Official `stripe-mock` can return a null hosted Checkout `url`, so the local proxy applies a dev-only URL patch before the Worker receives the response. Real checkout code still sends the real Stripe SDK request shape.

Run the explicit alias for the same official stripe-mock API stack:

```sh
pnpm dev:stack:stripe-mock-api
```

Official `stripe-mock` is stateless and does not emit webhooks, so webhook checks use a signed local fixture:

```sh
pnpm stripe:webhook:simulate:local
```

Set `STRIPE_WEBHOOK_CHECKOUT_SESSION_ID` before running the simulator when the fixture must target a Browser-created local checkout session.

Run the Astro frontend explicitly:

```sh
pnpm dev:web
```

Run the frontend-only static-site launcher used inside local stack scripts:

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

Deploy the UAT Worker manually:

```sh
pnpm deploy:backend:uat
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
- checkout creation is Worker-owned and uses hosted Stripe Checkout Sessions through a backend gateway seam
- the static checkout shell redirects to Stripe-hosted Checkout from Worker-created sessions
- `pnpm dev:stack:stripe-test` prepares local D1, applies the ignored real Stripe test mapping seed, starts the Worker, and starts the static site
- `pnpm dev:stack:stripe-mock` prepares local D1, generates local-only mock commerce state for every current store item, starts official `stripe-mock` through Go, starts the Worker with the Stripe SDK pointed at the local mock API proxy, and starts the static site in mock checkout mode
- no webhook order authority, stock decrement, or frontend D1 wiring yet
- PRD Worker deployment remains gated by PRD-open readiness
- backend-owned OpenAPI documents are emitted to `apps/backend/openapi/`
- generated frontend-facing types and `openapi-typescript-fetch` wrappers live in `packages/api-client/`
- frontend discovers the backend only through `PUBLIC_BACKEND_BASE_URL`
- the dedicated UAT deploy target is the `blackbox-records-backend-uat` Worker on `workers.dev`
- runtime business secrets stay in Worker secrets or backend-local Wrangler `.dev.vars`, not in browser env vars or GitHub deploy credentials
- Resend transactional email and newsletter Contact operations are Worker-owned through the backend email module and official Resend SDK; the static frontend never receives Resend API keys, Topic/Segment IDs, provider responses, or delivery diagnostics

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

Run the browser/API commerce boundary audit:

```sh
pnpm audit:commerce-boundaries
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
- Local checkout mode is controlled by `PUBLIC_CHECKOUT_CLIENT_MODE`.
  - `stripe` asks the Worker to create a hosted Stripe Checkout Session and redirects to the returned `checkoutUrl`.
  - `mock` asks the Worker to create a local mock checkout session and redirects to the local-only mock Checkout URL.
- Native checkout availability is controlled by the Worker-owned `native_checkout_enabled` feature gate, exposed to the
  browser only as sanitized `/api/store/capabilities` state.
- The feature gate is a runtime switch, not an environment replacement. Worker environments still isolate D1 data,
  secrets, webhook endpoints, and return origins.
- Browser cart state is convenience state only. The current implementation stores a single browser-safe cart item in
  native `localStorage`; the planned multi-item CartDraft workstream should keep that dependency-free storage primitive
  behind the cart module unless carts become account-backed, cross-device, or operationally authoritative.
- Browser cart state must never contain Stripe Price IDs, stock authority, payment state, order state, D1 fields, or
  backend runtime secrets. The Worker must re-read authoritative availability, OnlineStock, and Stripe mappings before
  checkout.
- Cloudflare Pages PRD builds use GitHub Actions variables for browser-safe public env:
  - `PUBLIC_BACKEND_BASE_URL`
- Cloudflare Pages PRD builds also set non-secret Astro build-target env:
  - `ASTRO_SITE_URL=https://blackbox-records-web.pages.dev`
  - `ASTRO_BASE_PATH=/`
- Do not set `PUBLIC_CHECKOUT_CLIENT_MODE` on the PRD Pages workflow; reserve `mock` for explicit non-PRD local/mock testing.
- Local development uses:
  - `pnpm dev:web`
  - `pnpm dev:backend`
  - `PUBLIC_BACKEND_BASE_URL=http://127.0.0.1:8787`
- UAT uses the same env var with its stable Worker hostname.
- The UAT backend target is the dedicated `workers.dev` Worker named `blackbox-records-backend-uat`.
- Its stable URL shape is `https://blackbox-records-backend-uat.<your-account-subdomain>.workers.dev`.
- The account-level `workers.dev` subdomain is owned in Cloudflare, not in this repo, so the Worker name is the repo-controlled stable portion of the UAT hostname.
- The frontend must not guess PRD or UAT backend origins in code.
- Worker secrets, D1 bindings, Stripe secret keys, Cloudflare Access config, and CI credentials remain backend/server-side only.
- Cloudflare Flagship setup uses binding name `FLAGS` and flag key `native_checkout_enabled`. Do not commit a Flagship
  app ID until the app exists and that non-secret account-specific value is explicitly approved.

## Protected operator hostname contract

- Internal stock operations live on a separate protected operator hostname, referred to in repo docs as `ops.<managed-zone>` until the real account-owned custom domain is provisioned.
- This hostname is distinct from:
  - the public Cloudflare Pages storefront
  - the public sandbox `workers.dev` backend used for shopper/browser sandbox checks
- Protected operator routes belong under:
  - static Astro UI: `/stock/`
  - static Astro detail state: `/stock/?variantId=<variantId>`
  - Worker API: `/api/internal/*`
- The protected surface is not a public-path subtree on the shopper hostname.
- Cloudflare Access uses Google as the identity provider for this hostname, and operator entry is controlled by an explicit email allowlist that stays out of the repo.
- Worker-side operator attribution comes from the Access-authenticated request header `cf-access-authenticated-user-email`, which the internal stock-write routes now persist as `actor_email`.
- The internal Worker API now exposes operator-only stock lookup and stock-write routes under `/api/internal/variants/*`.
- The internal Worker API now exposes read-only checkout order inspection under `/api/internal/orders*` for low-volume reconciliation. It is Access-protected, not a shopper API, and does not mutate order or stock state.
- The protected stock operations UI is built by the static Astro app at `/stock/`; it calls same-origin `/api/internal/*` on the protected operator hostname.
- For local split-port development, set `PUBLIC_BACKEND_BASE_URL=http://127.0.0.1:8787` so the static UI can call the local Worker; the Worker allows browser API calls only from origins listed in `CHECKOUT_RETURN_ORIGINS`.
- The stock UI is intentionally absent from public navigation. If served directly from public Cloudflare Pages or GitHub Pages UAT before the protected ops hostname is provisioned, it is not a PRD-safe stock operations surface.
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
- The required backend Stripe checkout configuration binding is:
  - `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID`
- The backend Resend runtime contract is:
  - `RESEND_API_KEY` as a Worker secret or harmless committed local mock value
  - `RESEND_FROM_EMAIL=orders@blackboxrecordsathens.com`
  - `RESEND_REPLY_TO_EMAIL=support@blackboxrecordsathens.com`
  - `RESEND_OPS_TO_EMAIL=blackboxrecordsathens@gmail.com`
  - `RESEND_NEWSLETTER_TOPIC_ID`
  - optional `RESEND_NEWSLETTER_SEGMENT_ID`
  - `RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL=blackboxrecordsathens+TESTING@gmail.com` for the UAT Worker target only
- Paid-order email brand URLs are non-secret Worker runtime config and must match the Product Environment profile:
  - `EMAIL_BRAND_HOME_URL`
  - `EMAIL_BRAND_LOGO_URL`
  - Local/UAT use the GitHub Pages public site and logo URLs.
  - PRD uses the Cloudflare Pages public site and logo URLs until an approved custom public site domain replaces them.
- Resend uses `blackboxrecordsathens.com` as the single approved Free-tier sending domain. DNS verification, SPF/DKIM/DMARC alignment, Cloudflare Email Routing for support replies, Topic/Segment setup, and Worker secret upload are manual operator checkpoints; do not commit provider-readiness evidence.
- Local and automated tests use application-level provider mocks and committed fake `re_mock_*` values. UAT application email and newsletter Contact writes route to the sink recipient; PRD ignores that override and uses real recipients only after provider setup is complete.
- The UAT Worker persistent webhook readiness check is:
  - `pnpm stripe:webhooks:verify --env uat`
  - it must stay verify-only and must not create, update, delete, rotate, log, or commit Stripe webhook endpoint secrets
- Future BOX NOW credentials remain Worker runtime secrets or out-of-band operator credentials. They must not be exposed through Astro `PUBLIC_*` env, Cloudflare Pages public build variables, generated frontend clients, static content, or committed seed files.
- The optional backend-local Stripe mock/test override is:
  - `STRIPE_API_BASE_URL`
- `STRIPE_API_BASE_URL` defaults to real Stripe when unset. The committed `mock` Wrangler env binds it to `http://127.0.0.1:12110` for the local official stripe-mock proxy.
- The checkout return-origin and browser API CORS allowlist is configured server-side with `CHECKOUT_RETURN_ORIGINS`.
- `COMMERCE_DB` is runtime-only backend infrastructure, not a browser env var and not a GitHub Actions credential.
- `CHECKOUT_RETURN_ORIGINS` is a Worker runtime variable, not a browser-selected return URL or an open CORS wildcard.
- `RESEND_API_KEY` and Resend provider diagnostics are runtime-only backend concerns. Run `resend --version`, `resend doctor --json`, and read-only domain/sender/contact/topic checks manually when preparing provider readiness; keep command output and account evidence out of committed source.
- Current checkout return allowlist entries are exact origins only:
  - `http://127.0.0.1:4321`
  - `http://localhost:4321`
  - `https://blackbox-studio-athens.github.io`
  - `https://blackbox-records-web.pages.dev`
- Add Cloudflare Pages preview origins only as exact emitted origins during validation; never use `*.pages.dev`.
- `apps/backend/prisma/schema.prisma` includes a local placeholder SQLite URL only to satisfy the current Prisma 6 CLI; Worker runtime access still goes through `env.COMMERCE_DB`.
- Future privileged backend-only values such as BOX NOW credentials also remain runtime-only until the phases that introduce them.
- `PUBLIC_BACKEND_BASE_URL` remains the only browser-facing backend env.

## BOX NOW shipping contract

- Phase 9 shipping is Greece only with manual BOX NOW fulfillment.
- New checkout starts do not require or accept browser-selected BOX NOW locker data.
- Stripe Checkout collects the Greek shipping address and phone before payment through `shipping_address_collection` and `phone_number_collection`.
- Operators create BOX NOW shipments manually from paid order/payment tooling; BOX NOW voucher, label, tracking, and portal output stay out of the repo until a later milestone explicitly adds fulfillment persistence.
- Existing nullable locker snapshot fields remain legacy/prototype readback only:
  - `locker_id`
  - `country_code` with v1 value `GR`
  - `locker_name_or_label`
- Do not persist raw BOX NOW widget/API payloads, unapproved address or locker payload dumps, coordinates, voucher IDs, label URLs, tracking automation state, or partner-portal credentials in v1.
- Any future BOX NOW automation must use `C:\Users\SVall\WebstormProjects\boxnow-js`; do not add a bespoke BOX NOW client here.
- Operator handoff and local validation requirements live in `openspec/specs/shipping-fulfillment/spec.md`.
- Astro may render the shopper-facing shipping step, but the Worker owns checkout preflight, validation, order state, secrets, and any future BOX NOW server integration.

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
6. Apply to UAT with `pnpm --filter @blackbox/backend d1:migrations:apply:uat` when ready.

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

UAT D1 seed flow:

1. Apply UAT migrations only when the UAT environment is intentionally being prepared: `pnpm --filter @blackbox/backend d1:migrations:apply:uat`.
2. Apply the non-secret base commerce seed with `pnpm --filter @blackbox/backend d1:seed:uat` when preparing the older narrow sandbox fixture.
3. Apply the full GitHub Pages UAT catalog readiness seed with `pnpm --filter @blackbox/backend d1:seed:uat:catalog` before full-catalog `pnpm stripe:catalog:verify --env uat --apply`.
4. Do not use local mock stock, `price_mock_*` rows, real Stripe Price IDs, BOX NOW credentials, or production data in sandbox seed files.

Local development:

```sh
cp apps/backend/.dev.vars.example apps/backend/.dev.vars
```

- Fill `apps/backend/.dev.vars` locally before running `pnpm dev:backend` or `pnpm dev:backend:sandbox`.
- Verify the local D1 binding with `pnpm --filter @blackbox/backend d1:smoke:local`.
- `apps/backend/.dev.vars` is local-only, ignored by git, and must never be committed.
- Missing backend runtime secrets are acceptable only for local work that does not exercise those routes.
- Current Stripe-backed checkout routes require `STRIPE_SECRET_KEY` and `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID` before
  creating or reading Checkout Sessions.
- Hosted Worker checkout fails closed if the `FLAGS` binding is absent or feature evaluation fails; local/mock checkout
  remains enabled by default for no-account development.
- Checkout session creation and split-port browser API reads accept origins only from `CHECKOUT_RETURN_ORIGINS`; configured origins include local static dev, Cloudflare Pages PRD, and the GitHub Pages UAT origin.
- The static checkout shell does not load Stripe.js or receive a Checkout `client_secret`; it redirects to the Worker-returned hosted Checkout URL.
- `stripe-mock` mode does not require `apps/backend/.dev.vars` because the Worker `mock` env binds harmless local Stripe mock configuration and the browser redirects to a local-only mock Checkout URL.

CI/deploy credentials and public build variables:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `ASTRO_SITE_URL`
- `ASTRO_BASE_PATH`
- Cloudflare Pages project name: `blackbox-records-web`
- `PUBLIC_BACKEND_BASE_URL`

- `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are only for authenticating CI or a developer into Cloudflare for deployment.
- `ASTRO_SITE_URL` and `ASTRO_BASE_PATH` are non-secret static build target values. Cloudflare Pages PRD uses `https://blackbox-records-web.pages.dev` plus `/`; GitHub Pages UAT uses `https://blackbox-studio-athens.github.io` plus `/blackbox-records/`.
- `PUBLIC_BACKEND_BASE_URL` is the browser-visible backend discovery variable for the static Astro frontend.
- None of these values are the Worker's runtime business secrets.
- Deployed runtime secrets terminate as Cloudflare Worker secrets/bindings, not as browser env vars and not as GitHub-only config.

## UAT backend CI/CD

- The static Astro site has one shared deployment workflow:
  - `.github/workflows/pages.yml` runs shared repository gates once, uploads the prebuilt UAT static artifact to GitHub Pages, and uploads the prebuilt disabled PRD static artifact to Cloudflare Pages.
- The separate UAT Worker deploy path is isolated in `.github/workflows/cloudflare-uat.yml`; `uat` is the Wrangler runtime target.
- That workflow:
  - runs on pushes to `uat`
  - can also be triggered manually
  - runs `pnpm generate:api`
  - runs `pnpm test:unit`
  - runs `pnpm check`
  - deploys only the backend workspace to Cloudflare Workers
- The UAT `workers.dev` backend is reachable for browser checks, Stripe return URLs, and webhook testing.
- Cloudflare Access is not part of public UAT browsing at this stage.
- Phase `06.1.1` now locks a separate protected staff-only hostname and Google-backed Access contract for internal stock work, while keeping the public UAT backend reachable and unauthenticated.

## GitHub Pages UAT CI/CD

- UAT deployment is handled by `.github/workflows/pages.yml`.
- The shared static workflow uses Node 24, pnpm 10.33.4, explicit pnpm setup/install steps, and only deploys UAT if all of these succeed:
  - `pnpm test:unit`
  - `pnpm check`
  - `pnpm audit:unused`
  - `pnpm build:web` for the UAT artifact
- The build step passes `PUBLIC_BACKEND_BASE_URL` from `UAT_PUBLIC_BACKEND_BASE_URL` so the GitHub Pages URL serves as the public UAT surface.
- Pushes go directly to `main` in this repo.
- If CI fails on `main`, GitHub Pages does not publish the broken UAT revision; fix it with a follow-up commit or revert the bad commit on `main`.
- GitHub Pages is the UAT static host and must not be described as PRD rollback or legacy production hosting.

## Cloudflare Pages PRD Deployment

- Cloudflare Pages is the PRD static frontend host and remains a disabled commerce readiness surface until the PRD-open gate exists.
- The deploy artifact remains the prebuilt Astro output at `apps/web/dist`.
- Cloudflare Pages Direct Upload acceptance is handled by `.github/workflows/pages.yml`, not by local manual `wrangler pages deploy`.
- The shared static workflow runs `pnpm test:unit`, `pnpm check`, `pnpm audit:unused`, and the PRD `pnpm build` before uploading `apps/web/dist` to the `blackbox-records-web` Pages project.
- The workflow sets Cloudflare-root static build values with `ASTRO_SITE_URL=https://blackbox-records-web.pages.dev` and `ASTRO_BASE_PATH=/`.
- The workflow passes only browser-safe public Astro variables into the frontend runtime: `PUBLIC_BACKEND_BASE_URL` from `PRD_PUBLIC_BACKEND_BASE_URL`.
- The Worker remains separate and owns `/api/*`, Stripe secrets, webhooks, D1, stock operations, order state, and future BOX NOW work.
- Do not introduce Pages Functions, SSR, D1 access, backend routes, or runtime business secrets into the Pages project.
- Browser-safe Pages variables are limited to `PUBLIC_BACKEND_BASE_URL`; keep `PUBLIC_CHECKOUT_CLIENT_MODE` unset for PRD.
- Required CI/project names are documented in `openspec/specs/static-site-and-deployment/spec.md`; account-specific IDs, tokens, and domains stay out of git.

## Cache policy

Cloudflare cache policy is explicit and versioned in repo-owned artifacts and route headers.

- Static Asset Cache: fingerprinted Astro build assets under `/_astro/*` use the repo-owned `apps/web/public/_headers` artifact with `Cache-Control: public, max-age=31536000, immutable`.
- Document Revalidation: route HTML, overlay partial HTML, `sitemap.xml`, `robots.txt`, `/store/*`, `/stock/*`, and `/admin/*` stay revalidation-friendly and do not use year-long immutable caching.
- Route Document Headers: no explicit document revalidation headers were added in this change; Cloudflare Pages defaults remain in effect for route HTML and overlay partials.
- Worker API Freshness: checkout, Store Offer, stock, order, webhook, operator, and error responses use `Cache-Control: no-store`.
- TTL Policy: no route class in this change receives a future TTL; the store capabilities and Store Offer routes remain `no-store` because they carry checkout authority.
- Same-Session Shell Cache: app-shell page snapshots and overlay fragments remain in-memory UI caches only; they are not CDN caches and they do not own commerce state.
- Validation: `pnpm cache:policy:check` inspects the built `apps/web/dist/_headers` artifact, and `pnpm build` runs it through the `apps/web` build script.
- Hosted audit: `pnpm cache:policy:hosted-audit` performs a bounded read-only PRD header audit against the deployed Pages and Worker URLs. It is diagnostic only and stays out of required CI because deployment propagation timing can make it flaky.
- Browser Use is not required for this change because the implementation is limited to headers, tests, scripts, and docs; it does not alter app-shell runtime behavior.

## Content model

Content is managed in the repo through Astro content collections, and Decap CMS now provides an editing layer on top of the same `apps/web/src/content/**` files.

- Artists: `apps/web/src/content/artists/*.md`
- Releases: `apps/web/src/content/releases/*.md`
- Distro items: `apps/web/src/content/distro/*.json`
- News: `apps/web/src/content/news/*.md`
- Home copy: `apps/web/src/content/home/*.json`
- About copy: `apps/web/src/content/about/*.json`
- Services copy: `apps/web/src/content/services/*.json`
- Newsletter copy: `apps/web/src/content/newsletter/*.json`
- Navigation: `apps/web/src/content/navigation/*.json`
- Social links: `apps/web/src/content/socials/*.json`
- Site settings: `apps/web/src/content/settings/*.json`
- Collection-owned images live next to their Markdown entries and are validated by Astro content schemas.
- JSON collection entries include `$schema` references to Astro-generated collection schemas for editor/CMS validation.
- Artist, release, and distro entries stay editorial-only; Fourthwall collection handles and CMS-authored commerce controls are not part of the content contract.
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

### DecapBridge hosted setup

Hosted `/admin/config.yml` is generated during the static frontend build, so the DecapBridge values must be present in the deploy workflow environment that is intended to serve PRD admin access. The values below are already wired for the GitHub Pages UAT workflow; mirror them into the Cloudflare Pages build path in a focused CMS/deploy task before treating hosted Decap admin as validated on Cloudflare Pages.

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
  - `newsletter`
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

`pnpm build` outputs static files to `apps/web/dist/`.

## WebStorm run configuration

- `.run/BlackBox Local Stack.run.xml` is the canonical committed local-stack launcher.
- `.run/Stripe Sandbox Smoke.run.xml` is the at-will automated Playwright Stripe test-mode checkout launcher and runs `pnpm smoke:stripe-uat -- --scenario all`.
- It targets the GitHub Pages UAT site by default.
- It runs `pnpm dev:stack:stripe-mock`, which starts local D1 prep, local official `stripe-mock` through Go, the local Worker backend pointed at the local stripe-mock proxy, and the local Astro frontend without Docker or real Stripe keys.
- Real Stripe test mode remains available from the terminal through `pnpm dev:stack:stripe-test`.
- `pnpm dev:stack:stripe-mock-api` is a terminal alias for the same official stripe-mock API path; do not add a second WebStorm launcher for it unless explicitly requested.
- Other focused backend/frontend scripts remain available from the terminal, not committed IDE run configs.
- The static-site launcher remains pinned to `http://127.0.0.1:4321/blackbox-records/`.
- If port `4321` is already in use, the static-site launcher fails fast instead of silently switching ports.
- Local D1 comes from Wrangler automatically during Worker dev; no separate D1 process is part of the run-config flow.
- The stack launchers run D1 migrations and seed SQL before starting long-running services.
- `pnpm --filter @blackbox/backend d1:check:stripe-mock:local` verifies every current store item has local mock checkout readiness rows after the mock seed runs.
- `pnpm --filter @blackbox/backend d1:smoke:local` remains a verification command, not a launch prerequisite.
