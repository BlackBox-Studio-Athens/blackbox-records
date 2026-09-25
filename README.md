# BlackBox Records

Astro site for the BlackBox Records label. Public pages render from accepted immutable content snapshots; Cloudflare Pages serves assets and forwards public reads to the renderer. See [content publication](docs/content-publication.md).

## Stack

- Astro 7 (published-content runtime plus retained static build)
- React integration (for shadcn-ui primitives)
- Tailwind CSS v4 + shadcn-ui setup (design implemented in Astro templates + `apps/web/src/styles/global.css`)
- Type-safe content collections (`apps/web/src/content`)
- Separate Cloudflare Worker backend scaffold (`apps/backend/src/index.ts`) using TypeScript + Hono
- EmDash 0.40.1 powers the protected editorial APIs; follow the [CMS upgrade ordering](apps/backend/cms-migrations/README.md) before core migrations.
- Code-first OpenAPI documents and a generated `@blackbox/api-client` workspace package

## URL model

The site uses one Product Environment model: Local, UAT, and PRD. The full matrix lives in [`docs/environment-model.md`](docs/environment-model.md).

UAT is the Cloudflare Pages public frontend:

- `site`: `https://blackbox-records-web-uat.pages.dev`
- `base`: `/`
- browser API target: `UAT_PUBLIC_BACKEND_BASE_URL`, expected to point at the UAT Worker

PRD is the Cloudflare Pages public frontend:

- `site`: `https://blackbox-records-web.pages.dev`
- `base`: `/`
- browser API target: `PRD_PUBLIC_BACKEND_BASE_URL`, expected to point at the PRD Worker
- commerce state: checkout disabled until `PRD_LAUNCH_APPROVED=true` and `native_checkout_enabled` both pass

The PRD build job in the shared static workflow sets these non-secret build-time variables before deploying the disabled PRD static artifact from `apps/web/dist`:

- `ASTRO_SITE_URL`: `https://blackbox-records-web.pages.dev`
- `ASTRO_BASE_PATH`: `/`
- `PUBLIC_BACKEND_BASE_URL`: from `PRD_PUBLIC_BACKEND_BASE_URL`

The protected staff frontend is a separate static Astro app:

- package: `@blackbox/staff`
- source: `apps/staff`
- artifact: `apps/staff/dist`
- hosting: assets packaged into the combined CMS Worker; live PRD workspace `https://staff.blackboxrecordsathens.com/content/`
- hosted API target: same-origin `/api/internal/*`

Local keeps the base-path defaults in `apps/web/astro.config.mjs`; hosted builds override both values:

- `site`: `https://blackbox-studio-athens.github.io`
- `base`: `/blackbox-records/`

For label-member UAT, the Cloudflare Pages URL is intentionally wired to the UAT Worker on deploy-relevant `main` pushes. Repository-only documentation pushes are skipped by the shared static workflow, while `workflow_dispatch` remains available for a forced redeploy. Tester instructions live in [`docs/stripe-sandbox-uat.md`](docs/stripe-sandbox-uat.md). This is Stripe test mode only and is not PRD go-live approval.

Commit → review UAT → explicitly promote this candidate. Main pushes deploy UAT only. In **Release BlackBox**, select `target=prd`, the reviewed full `artifact_commit_sha`, its successful `candidate_run_id`, and `confirm_code_promotion=true`. Promotion consumes the retained PRD public and combined CMS Worker artifacts (release contract v2) without rebuilding. UAT must still serve that candidate, configuration must match, and no newer release may have mutated PRD. Artifacts expire after seven days: dispatch `target=uat` with the same full SHA, wait for fresh acceptance, then use its new run ID. See [the release runbook](docs/catalog-promotion.md). Code confirmation does not authorize live catalog changes, apex activation, or shopper launch.

The UAT build alone shows the layered Review Site Marker: a solid `TEST SITE` label with `Test payments only` beneath the header wordmark, a `[TEST]` browser-title prefix, and `Test checkout. No real payment will be taken.` beside the final checkout action. These presentational cues identify a review URL; they do not enable checkout or own payment authority, which remain controlled by the Worker and Stripe configuration. Local, full PRD, and PRD Holding Page builds leave all three cues unset.

Share the UAT link with non-technical reviewers using this template:

> Here is the site link for review. It is not the public launch site, and any payments are tests.

### PRD Holding Page

The temporary public PRD Holding Page is built from the unlinked `/prd-holding/` source route and deployed only by the manual `.github/workflows/prd-holding-page.yml` workflow. The workflow prepares `apps/web/dist-holding`, uploads it as a one-day artifact, and can deploy it to the `holding` branch of the existing `blackbox-records-web` Pages project through the `prd-holding` GitHub Actions environment. That environment restricts deployment sources to `main` but has no required reviewers, so an explicit `deploy=true` dispatch proceeds without a separate approval prompt.

- Build the normal PRD-shaped site: `pnpm build`
- Prepare the allowlisted holding artifact: `pnpm prd:holding:prepare`
- Check route isolation, assets, metadata, and workflow isolation: `pnpm prd:holding:check`
- Branch alias: `https://holding.blackbox-records-web.pages.dev`
- Public apex after separately approved activation: `https://blackboxrecordsathens.com/`

The holding branch is a temporary public surface inside PRD. It is not UAT, the full PRD readiness site, Promotion Evidence, or proof that checkout and live providers are ready. Domain activation is an operator-controlled sequence: verify the branch alias, snapshot current DNS and redirect state, associate the apex with the existing Pages project, point the proxied apex at the verified holding alias, wait for active TLS, add the proxied `www` CNAME and exact-host `308` redirects, then verify target identity, path/query preservation, canonical/noindex metadata, and route isolation. Do not add a temporary redirect guard because it can block Pages domain validation. Rollback removes only the new `www` record and holding redirect rules, restoring the snapshotted apex target only if activation changed it. The full site stays at `https://blackbox-records-web.pages.dev/` until the production go-live change passes every live gate. At launch, retain the holding branch as the immediate rollback target until the full site is stable.

Backend Worker observability uses source-controlled Workers Logs/Traces config and structured safe runtime events. Operator notes live in [`docs/worker-observability.md`](docs/worker-observability.md).

## Navigation model

- Top-level sections (`/`, `/artists/`, `/releases/`, `/services/`, `/about/`, and discoverable Store categories) are shell-routed in the browser and swapped in-place.
- `Releases` remains editorial. Purchasable item options live in Store: `All` (`/store/`), `BlackBox Releases` (`/store/blackbox-releases/`), and `Distro` (`/store/distro/`) are always discoverable; `Merch` (`/store/merch/`) appears only when classified `Clothes` content exists and otherwise redirects to Store. All includes a compact Distro format handoff without duplicating cards. Category membership is presentation-only and does not change Store Item, offer, checkout, or stock authority.
- Store collection cards load browser-safe formatted prices through one snapshot-backed `/api/store/listing-prices` read per shell activation. Store Item detail and checkout keep authoritative Store Offer reads and revalidation.
- `/distro/` remains a compatibility redirect to `/store/distro/` and preserves a legacy group fragment when JavaScript is available.
- Release, artist, and news detail routes remain direct-load Astro pages, but in-site clicks open them through the app-shell overlay.
- The Bandcamp/Tidal player stays mounted in the persistent shell so playback can survive top-level section switches.
- The minimized player is only shown after the user interacts with the embed area; a loaded embed alone does not create the pill.
- Real document navigations still occur for direct loads, refreshes, new tabs, and the external shop redirect.

## Catalog Promotion

Local, UAT and PRD use the protected EmDash workspace for content, item creation, prices and stock. Content Publication is separate from Software Release: publishing saved content builds the website with the target's deployed code, while code promotion uses a reviewed UAT candidate. D1 and Worker controls own checkout safety. PRD deployment, import, catalog linkage and the first public CMS snapshot are complete; the Live receipt is recorded in [the cutover worksheet](docs/cms-cutover.md). Disintegration remains EUR 28.00 with stock 15 physical / 12 online. Live catalog confirmation never enables shopper checkout. See [catalog promotion](docs/catalog-promotion.md) for migration, release and recovery commands.

## Member workspace

Use [UAT staff](https://staff-uat.blackboxrecordsathens.com/content/) or the Local workspace at `http://127.0.0.1:8787/content/`. [PRD staff](https://staff.blackboxrecordsathens.com/content/) now serves the imported content through the combined Worker. The cutover is complete and normal editorial work can resume there.

| Task                   | Member action                                                                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Edit content           | In **Content**, choose a collection or page in the sidebar, select a record, and save the draft. Use **Publish saved content** for editorial content; linked Release/Distro records use **Publish item** in Items. |
| Browse images          | Open **Content → Media** to search, preview and upload images. Use **Choose image** or **Change image** in an editor to select artwork. Uploads and saved drafts remain private until publication.                 |
| Create an item         | In **Items**, complete the guided Release, Distro or Merch form, choose the price and opening stock, then **Create item** and **Publish item**. An editorial-only Release needs no selling price or stock.         |
| Change a selling price | Open the item and use **Change price**. Retry/check the retained operation if interrupted; do not create a second item. Stripe remains Price Authority.                                                            |
| Update stock           | In **Stock**, record a known stock change or use **Count stock** for a recount. Set online quantity conservatively; it may be lower than physical stock.                                                           |

**Check publication status** reports when the website is Live. **Retry publication** retries a failed website attempt. Existing open shopper tabs are not forcibly reloaded. **Orders** contains paid-order details and the Greek delivery/contact information for manual BOX NOW fulfillment. Recovery procedures are in [CMS backup and restore](docs/cms-backup.md); CMS restoration never restores commerce balances or orders.

## Prerequisites

- Node.js 24.21.0, pinned by `.node-version` and the root package engine
- pnpm 12.0.0, via the repo `packageManager` field
- Go, only for the local official `stripe-mock` launcher

## Setup

```sh
pnpm install
```

## Toolchain policy

- Keep local and CI Node on `24.21.0`; update `.node-version`, the root package engine, and every workflow together.
- Keep TypeScript on `5.9.3` until `openapi-typescript` publishes a compatible TypeScript 6 peer range.
- Keep Prisma on the latest compatible v7 line, currently `7.10.0`; datasource URL configuration lives in `apps/backend/prisma.config.ts`.
- Keep backend Wrangler pinned to `4.131.1` with Workers types `5.20260911.1`. The existing Workers test-pool overrides remain separate. Astro 7.3.2 builds use Vite 8.3.0 and Rolldown 1.2.8; earlier locked versions generated invalid EmDash chunks.
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

The normal command is `pnpm dev`, or **BlackBox Local Stack** in WebStorm. Both start the same Local stack described below. The isolated CMS integration diagnostic is:

```sh
pnpm --filter @blackbox/backend test:emdash
```

It runs the real CMS on port 8799 with a temporary callback on 8800, synthetic D1/R2 data, and fake providers. It checks the REST contract, concurrent revisions, lifecycle conflicts, rejected writes, and Hono routes. This isolated fixture is diagnostic; the normal Local and UAT workspaces use the combined backend.

The backend uses the free SQLite-backed `COMMERCE_RUNTIME` Durable Object binding for existing Hono requests and scheduled paid-order work. Its data still lives in `COMMERCE_DB`. Keep the binding in every Wrangler environment and retain the `commerce-runtime-v1` class migration; Wrangler provisions it during deploy and emulates it locally. CMS diagnostics use a separate `CMS_RUNTIME` object. This keeps expensive execution inside the objects' CPU allowance while the entry Worker forwards requests. Workers Free remains required; no paid upgrade is needed for the measured checkpoint workload.

The combined backend artifact is prepared with `pnpm --filter @blackbox/backend build:cms`; it builds the staff workspace and packages its assets with the owned CMS handler. `BLACKBOX_BUILD_ENV` selects `mock` (default), `local`, `uat`, or `prd`. Commerce configuration comes from the existing Wrangler file; separate CMS database/media identities come from `apps/backend/cms-resources.json`. Generated configuration and migration manifests stay under ignored `.emdash/`. Build preparation does not deploy or switch production traffic.

After a target-specific build, `pnpm --filter @blackbox/backend cms:migrations --env uat` checks the supported CMS migration manifest using an existing Cloudflare session. It defaults to read-only. Applying requires `--apply --fingerprint <reviewed-target-fingerprint>`; PRD apply remains subject to the migration report and one-run cutover approval. Commerce migrations remain owned by the existing Prisma/D1 commands. Hosted CMS requests reject empty/uninitialized schemas and never bootstrap them. `pnpm --filter @blackbox/backend test:staff-hosting` checks a compiled Local artifact for private staff HTML/modules, alternate-host denial, and public commerce routing.

```sh
pnpm dev
```

For frontend-only diagnostics, use Astro's background dev server. CMS and item-publication acceptance must use the full Local stack above:

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

`pnpm dev` and `BlackBox Local Stack` in WebStorm run this same command. It applies Local D1 migrations, seeds mock commerce only when the store is empty, starts official `stripe-mock` through Go, and builds/starts the combined CMS and commerce Worker. The public Astro site stays at `http://127.0.0.1:4321/blackbox-records/`; Content, Items, Stock and Orders share `http://127.0.0.1:8787/content/` and the same Local operator identity. The Local public service imports initial editorial content only when all CMS collections are empty. Existing content, stock and prices remain in `apps/backend/.wrangler/state` across restarts. The Local mock launcher does not load `.dev.vars` or dotenv credentials. Local newsletter signup uses the committed fake `re_mock_*` Resend config through a no-network provider mock. It does not require Docker, real Stripe keys, real Resend keys, or hosted login.

Local publication polling uses the running CMS Worker's database binding. Temporary API/database failures leave requests pending and keep the last activated public site available, with retries capped at ten-second intervals. The terminal logs failures and recovery. A successful build is acknowledged only after its public receipt is verified; lost acknowledgements retry without rebuilding. These Local-only endpoints are unavailable in UAT and PRD. Do not delete `.wrangler/state` to troubleshoot a polling error. The focused recovery check is `node --test scripts/local-publication-poll.test.mjs`.

The official stripe-mock proxy retains Local Product and Price writes in `apps/backend/.wrangler/state/mock-catalog.json`, so guided item setup and price edits survive restart. New items remain withheld until publication. Previously seeded placeholders without Product bindings still require catalog reconciliation; startup does not replace their prices or stock.

Local Content publication builds a private snapshot and replaces the served static output on the same public port. Save draft stays private; Publish saved content requests the build, and Check publication status reports Live after the served snapshot receipt matches. Fresh page loads see the publication. Open tabs and their music players are not forcibly reloaded; the existing shell cache may retain previously visited content until reload. Linked Release/Distro records use Publish item in Items.

In Items, review the linked saved content, then select Publish item. The command approves the selected artwork, updates Product presentation only when it changed, publishes the native revision and requests the static publication. Price and stock stay unchanged. Check publication resumes retained work; Retry publication starts another website attempt after a failed one. Local publication and hosted maintenance complete the item after the CMS Live receipt, even with the browser closed. Native unpublish pauses linked item checkout first. Runtime catalog migration and Local/UAT new-item acceptance are complete. PRD shopper launch remains separately gated; a publication receipt does not enable checkout.

Only the approved immutable artwork copy is served at `/media/published/<sha256>` on the public Worker. CMS originals, drafts, snapshots and backups remain private.

The Local public service imports only an empty CMS and verifies the source library before its first baseline publication. If existing drafts differ, it stops rather than publishing those drafts implicitly. Later restarts build from the last published snapshot and preserve newer drafts. If an initial import is interrupted, use the explicit idempotent CMS import diagnostic to finish it; ordinary startup never overwrites existing editorial records. Retired public `/admin/*` routes return 404; editing uses EmDash. `pnpm dev:web` and `pnpm site:dev` remain frontend-only Astro development diagnostics. Running `d1:seed:stripe-mock:local` explicitly without `--if-empty` is a reseed diagnostic that replaces mock stock/price fixtures, not the normal restart path.

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

The runner defaults to the Cloudflare Pages UAT site and is also used by the same-release GitHub Actions `catalog-promotion-uat` environment after the UAT Pages deploy succeeds.

Supported scenarios are `happy_path_paid`, `three_d_secure`, `card_declined`, `insufficient_funds`, `expired_card`, `incorrect_cvc`, `processing_error`, and `all`. The committed JetBrains run configuration `Stripe Sandbox Smoke` runs `--scenario all` through `pnpm smoke:stripe-uat`. Stripe’s current test card reference lives at <https://docs.stripe.com/testing#cards>. Paid deployed UAT smoke expects the persistent Stripe Dashboard/Workbench webhook endpoint to deliver to `https://blackbox-records-backend-uat.blackboxrecordsathens.workers.dev/api/stripe/webhooks`; `stripe listen` is local/temporary diagnostic tooling only and is not persistent readiness evidence.

Receipt-aware UAT proof is operator-started and stays out of GitHub Actions:

```sh
pnpm smoke:stripe-uat -- \
  --scenario happy_path_paid,pay_what_you_want_paid \
  --verify-email-receipts
```

The command requires the authenticated local Resend CLI profile, performs a quiet Receiving preflight, waits for exactly one shopper and one ops message per paid order at the managed UAT sink, and writes redacted receipt observations. The default receipt deadline is 120 seconds; use `--email-receipt-timeout-ms` only when overriding it. The checked-in post-merge workflow omits this flag and remains credential-free. Resend Free currently includes 3,000 sent-plus-received transactional emails per month, a 100-per-day limit, and 30-day retention; one canonical receipt run consumes eight units. See <https://resend.com/docs/knowledge-base/account-quotas-and-limits> and <https://resend.com/pricing>.

Run the UAT Resend smoke when you need to prove the UAT Worker can register a newsletter Contact and submit a Services inquiry through Resend:

```sh
pnpm smoke:resend-uat
```

The Resend UAT smoke posts a synthetic consented signup to `/api/newsletter/registrations` and a synthetic inquiry to `/api/services/inquiries`. It expects `{"status":"registered"}` and `{"status":"submitted"}` only after provider acceptance under the managed UAT sink policy, then writes ignored evidence to `.codex-artifacts/smoke/uat/resend-uat/<run-id>/`. Evidence and console output exclude inquiry name, visitor email, message, service details, Resend API keys, Topic IDs, Contact IDs, and provider diagnostics.

Render local paid-order email previews when you need to inspect the generated shopper and ops HTML:

```sh
pnpm email:previews
```

This writes ignored HTML files under `.codex-artifacts/email-previews/` for Browser Use or the documented DevTools fallback. The previews use repo-owned template builders and do not create provider state.

Run the UAT static smoke when you need to verify deployed Cloudflare Pages static routes, retired admin-route 404 responses, representative public pages, checkout shell visibility, sitemap, robots, console errors, and high-risk public-secret exposure:

```sh
pnpm smoke:uat-static -- --site-url https://blackbox-records-web-uat.pages.dev --scenario all
```

The UAT static smoke runner is manual by design and writes ignored evidence to `.codex-artifacts/smoke/uat/uat-static/<run-id>/`. The supported scenarios are `public_assets`, `checkout_shell`, `public_routes`, and `all`. It never creates provider state.

The PRD no-payment promotion smoke runner writes ignored evidence to `.codex-artifacts/smoke/prd/stripe-promotion/<run-id>/`. The `not_configured` paid-policy status means live payment was not attempted, not that PRD commerce is open.

Before accepting sandbox catalog or paid-order webhook readiness, run:

```sh
pnpm stripe:webhooks:verify --env uat
pnpm stripe:catalog:verify --env uat
```

Catalog ownership is simple: EmDash content and its approved runtime projection own Product presentation; Stripe Product default Price selects the selling amount; D1 owns stock, pauses, reservations, and orders. Add a replacement Price in Stripe Dashboard and set it as default. Older Prices can remain active. Signed webhooks and authoritative detail/checkout reads refresh the bound D1 mapping and listing snapshot.

Routine installation, checks, tests, builds, and software deployment do not generate or apply repository catalog data. Read-only catalog verification inspects persisted published runtime items and their provider bindings. `pnpm catalog:readiness:generate` explicitly generates ignored SQL from repository migration data for reviewed migration/recovery only; it is not the current EmDash catalog. See [Catalog release](docs/catalog-promotion.md).

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

Run the staff stock frontend on the same local port after stopping the public frontend:

```sh
PUBLIC_BACKEND_BASE_URL=http://127.0.0.1:8787 pnpm dev:staff
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
- the independent staff Astro app exposes the protected stock operations UI at `/stock/`
- D1-backed `Stock`, `StockChange`, and `StockCount` now back the operator stock ledger contract
- public store-offer and checkout API routes now exist under `/api/store/*` and `/api/checkout/*`
- checkout creation is Worker-owned and uses hosted Stripe Checkout Sessions through a backend gateway seam
- the static checkout shell redirects to Stripe-hosted Checkout from Worker-created sessions
- `pnpm dev:stack:stripe-test` prepares local D1, applies the ignored real Stripe test mapping seed, starts the Worker, and starts the static site
- `pnpm dev:stack:stripe-mock` prepares local D1, generates local-only mock commerce state for every current store item, starts official `stripe-mock` through Go, starts the Worker with the Stripe SDK pointed at the local mock API proxy, and starts the static site in mock checkout mode
- no webhook order authority, stock decrement, or frontend D1 wiring yet
- PRD checkout remains gated by explicit launch approval plus runtime enablement
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
pnpm validate
```

`pnpm check` is the repo-owned quality gate. It runs Prettier format verification, ESLint, and the existing Astro/TypeScript content checks.

`pnpm validate` (also `pnpm validate:full`) runs the complete tests, checks and build without catalog generation. The original `pnpm test:unit`, `pnpm check`, and `pnpm build` commands remain standalone equivalents. Full logs, native Vitest JSON, ESLint statistics and `summary.json` are retained under `.codex-artifacts/validation/<run-id>/`; the summary records source identity and rejects a source change during validation. A pass establishes repository gates, not task-specific acceptance. For staff/editor changes run `pnpm validate:editor` too; CMS/publication checks remain additional as documented in [content publication](docs/content-publication.md) and [content workspace](docs/content-workspace.md).

For CI prerequisites without a build, use `pnpm validate:checks`; it is partial and does not establish completion. `pnpm format:check` uses the native content cache under the ignored validation cache directory; use `pnpm format:check:uncached` for parity or diagnosis. The root `pnpm build` overlaps independent web/staff builds and joins both results before returning.

For iteration, use `pnpm validate:fast --scope web|staff|backend|api-client|all`. The default is `all`; use it for shared packages, content, config, migrations, or tooling. This runs selected-package tests and type checks plus root contracts, but is always partial and does not replace full completion or task-specific browser/CMS/asset checks. Full validation defaults to two independent test/check groups; use `--jobs 1` for sequential diagnosis. Neither mode overlaps builds with other phases. This candidate remains subject to benchmark acceptance targets. A stale `.codex-artifacts/validation/active.lock` after a hard kill requires checking that its recorded PID is no longer running before removing that exact lock. Use `pnpm validate:editor --trace` to capture the primary browser context on failure; traces supplement assertion logs and screenshots, not replace them.

The measurement protocol and acceptance targets are in [the validation benchmark](docs/validation-benchmark.md). Reduced output alone is not proof of reduced total AI usage.

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
- PRD also requires Worker binding `PRD_LAUNCH_APPROVED=true`; stale or absent launch approval fails closed. Catalog
  preparation confirmation is not a checkout input.
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
- Hosted UAT and PRD internal requests require a valid `Cf-Access-Jwt-Assertion`. The Worker verifies its RS256 signature, exact `CF_ACCESS_TEAM_DOMAIN` issuer, `CF_ACCESS_POLICY_AUD` audience, lifetime, and email claim before any route service or D1 work.
- The forwarded `cf-access-authenticated-user-email` header is ignored. Stock-write `actor_email` comes only from the verified assertion claim.
- JWT-free operator identity exists only for Product Environment Local on `localhost` or `127.0.0.1`, using the committed local-only `LOCAL_OPERATOR_EMAIL` binding.
- EmDash and staff operations use the existing verified Access identity; retired GitHub CMS authentication is not a runtime dependency.
- The internal Worker API now exposes operator-only stock lookup and stock-write routes under `/api/internal/variants/*`.
- The internal Worker API now exposes read-only checkout order inspection under `/api/internal/orders*` for low-volume reconciliation. It is Access-protected, not a shopper API, and does not mutate order or stock state.
- The protected stock operations UI is built from `apps/staff` at `/stock/`; it calls same-origin `/api/internal/*` on the protected operator hostname.
- For local split-port development, set `PUBLIC_BACKEND_BASE_URL=http://127.0.0.1:8787` so the static UI can call the local Worker; the Worker allows browser API calls only from origins listed in `CHECKOUT_RETURN_ORIGINS`.
- Public web builds reject any `/stock/` artifact; staff builds reject shopper, admin, and other undeclared routes.
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
  - `RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL=uat-sink@ambkime.resend.app` for the UAT Worker target only
- Paid-order email brand URLs are non-secret Worker runtime config and must match the Product Environment profile:
  - `EMAIL_BRAND_HOME_URL`
  - `EMAIL_BRAND_LOGO_URL`
  - Local/UAT use the Cloudflare Pages public site and logo URLs.
  - PRD uses the Cloudflare Pages public site and logo URLs until an approved custom public site domain replaces them.
- Resend uses `blackboxrecordsathens.com` for sending and a separate managed `*.resend.app` Receiving sink for UAT. Keep Receiving disabled on `blackboxrecordsathens.com`; DNS verification, SPF/DKIM/DMARC alignment, Cloudflare Email Routing for support replies, Topic/Segment setup, and Worker secret upload are manual operator checkpoints; do not commit provider-readiness evidence.
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
  - `https://blackbox-records-web-uat.pages.dev`
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
3. Apply the full Cloudflare Pages UAT catalog readiness seed with `pnpm --filter @blackbox/backend d1:seed:uat:catalog` before full-catalog `pnpm stripe:catalog:verify --env uat --apply`.
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
- Checkout session creation and split-port browser API reads accept origins only from `CHECKOUT_RETURN_ORIGINS`; configured origins include local static dev, Cloudflare Pages PRD, and the Cloudflare Pages UAT origin.
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
- `ASTRO_SITE_URL` and `ASTRO_BASE_PATH` are non-secret static build target values. Cloudflare Pages PRD uses `https://blackbox-records-web.pages.dev` plus `/`; Cloudflare Pages UAT uses `https://blackbox-records-web-uat.pages.dev` plus `/`.
- `PUBLIC_BACKEND_BASE_URL` is the browser-visible backend discovery variable for the static Astro frontend.
- None of these values are the Worker's runtime business secrets.
- Deployed runtime secrets terminate as Cloudflare Worker secrets/bindings, not as browser env vars and not as GitHub-only config.

## UAT backend CI/CD

- The static Astro site has one shared deployment workflow:
  - `.github/workflows/pages.yml` runs shared repository gates once, deploys the prebuilt UAT artifact to Cloudflare Pages; a separate confirmed promotion consumes the retained PRD artifacts.
- `.github/workflows/pages.yml` owns repository gates, catalog preparation, UAT Worker deployment, static deployments, and same-SHA UAT smoke.
- `.github/workflows/uat-smoke.yml` remains available for manual diagnostics.
- Rerun the release at the same source SHA after correcting its readiness report. See the catalog release runbook for compatible application rollback; routine releases never reset operational data.
- The UAT `workers.dev` backend is reachable for browser checks, Stripe return URLs, and webhook testing.
- Cloudflare Access is not part of public UAT browsing at this stage.
- Phase `06.1.1` now locks a separate protected staff-only hostname and Google-backed Access contract for internal stock work, while keeping the public UAT backend reachable and unauthenticated.

## Cloudflare Pages UAT CI/CD

- UAT deployment is handled by `.github/workflows/pages.yml`.
- Deploy-relevant pushes to `main` build both targets and deploy UAT only; pushes changing only `docs/**`, `openspec/**`, root `*.md`, or root `LICENSE` are skipped. `workflow_dispatch` remains available for a forced deployment.
- The shared static workflow uses Node 24.21.0, pnpm 12.0.0, explicit pnpm setup/install steps, and only deploys UAT if all of these succeed:
  - `pnpm validate:checks`
  - `pnpm audit:unused`
  - `pnpm build:web` for the UAT artifact
- The build step passes `PUBLIC_BACKEND_BASE_URL` from `UAT_PUBLIC_BACKEND_BASE_URL` so the Cloudflare Pages URL serves as the public UAT surface.
- Pushes go directly to `main` in this repo.
- A failed build blocks UAT deployment. A later deployment or smoke failure may leave changed or mixed hosted revisions; inspect the workflow summary before retrying or validating a compatible rollback.
- Cloudflare Pages is the UAT static host and must not be described as PRD rollback or legacy production hosting.

## Cloudflare Pages PRD Deployment

- Cloudflare Pages is the PRD static frontend host and remains a disabled commerce readiness surface until launch approval and runtime checkout enablement both pass.
- The deploy artifact remains the prebuilt Astro output at `apps/web/dist`.
- The staff artifact is built separately at `apps/staff/dist` and packaged into the combined Worker; no standalone staff Pages upload runs.
- Cloudflare Pages Direct Upload acceptance is handled by `.github/workflows/pages.yml`, not by local manual `wrangler pages deploy`.
- The shared static workflow runs `pnpm validate:checks` and `pnpm audit:unused`, restores only Astro's native image asset cache, then builds the UAT and PRD targets in the existing content order. Independent web/staff preparation and the Chromium/Firefox fixture checks overlap after their prerequisites; packaging waits for all results.
- The workflow sets Cloudflare-root static build values with `ASTRO_SITE_URL=https://blackbox-records-web.pages.dev` and `ASTRO_BASE_PATH=/`.
- The workflow passes only browser-safe public Astro variables into the frontend runtime: `PUBLIC_BACKEND_BASE_URL` from `PRD_PUBLIC_BACKEND_BASE_URL`.
- The Worker remains separate and owns `/api/*`, Stripe secrets, webhooks, D1, stock operations, order state, and future BOX NOW work.
- Do not introduce Pages Functions, SSR, D1 access, backend routes, or runtime business secrets into the Pages project.
- Browser-safe Pages variables are limited to `PUBLIC_BACKEND_BASE_URL`; keep `PUBLIC_CHECKOUT_CLIENT_MODE` unset for PRD.
- Required CI/project names are documented in `openspec/specs/static-site-and-deployment/spec.md`; account-specific IDs, tokens, and domains stay out of git.

## Cache policy

Cloudflare cache policy is explicit and versioned in repo-owned artifacts and route headers.

- Static Asset Cache: fingerprinted Astro build assets under `/_astro/*` use the repo-owned `apps/web/public/_headers` artifact with `Cache-Control: public, max-age=31536000, immutable`.
- Document Revalidation: public route HTML, overlay partial HTML, `sitemap.xml`, `robots.txt`, and `/store/*` stay revalidation-friendly; the separate staff artifact applies `no-store` to `/stock/*`.
- Route Document Headers: no explicit document revalidation headers were added in this change; Cloudflare Pages defaults remain in effect for route HTML and overlay partials.
- Worker API Freshness: checkout, Store Offer, Store listing-price presentation, stock, order, webhook, operator, and error responses use `Cache-Control: no-store`.
- TTL Policy: no route class in this change receives a future TTL; store capabilities, Store Offer, and listing-price presentation routes remain `no-store`.
- Same-Session Shell Cache: app-shell page snapshots and overlay fragments remain in-memory UI caches only; they are not CDN caches and they do not own commerce state.
- Validation: `pnpm cache:policy:check` inspects the built `apps/web/dist/_headers` artifact, and `pnpm build` runs it through the `apps/web` build script.
- Hosted audit: `pnpm cache:policy:hosted-audit` performs a bounded read-only PRD header audit against the deployed Pages and Worker URLs. It is diagnostic only and stays out of required CI because deployment propagation timing can make it flaky.
- Browser Use is not required for this change because the implementation is limited to headers, tests, scripts, and docs; it does not alter app-shell runtime behavior.

## Content model

EmDash owns hosted editorial content. Public builds consume an immutable published snapshot; the following repository collections are retained for migration/recovery and Local/UAT fixtures, not as the current hosted catalog.

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
- Home, About, and Services use named fixed-layout objects; editors cannot delete or reorder their sections.

Collection schemas are defined in `apps/web/src/content.config.ts`.

Full CMS database/media backup, seven-day retention, pre-upgrade capture and isolated recovery commands are documented in [CMS backup and recovery](docs/cms-backup.md). The daily hosted workflow is enabled with private storage and a reviewed Free-tier budget; changes must preserve those gates. Commerce restoration is never part of CMS recovery.

The replacement CMS has a Local-only migration check. After `pnpm --filter @blackbox/backend build:cms --env mock`, run `pnpm --filter @blackbox/backend test:cms-content` and `pnpm --filter @blackbox/backend test:cms-import`. These use ephemeral Local storage; the import check reconciles all 129 records and 152 raster image paths twice. `pnpm cms:import:local` is a no-write source validation command; `--apply` requires an already-running compiled Local CMS. News/social soft deletion requires confirmation and a current revision; other and permanent deletion remain blocked. Local/UAT acceptance and the PRD import are complete; the cutover worksheet records the current PRD publication receipt. See [Local migration evidence](openspec/changes/replace-sveltia-with-emdash-operations/local-editorial-migration-evidence.md).

Export an existing local CMS with `pnpm cms:snapshot:export --env local --target http://127.0.0.1:8787/ --out .codex-artifacts/new-snapshot`. The parent directory must exist and the destination must be new. The command reads published revisions and referenced media within the capture budget, writes media before the manifest, and returns the manifest path, SHA-256, and request count. The default is 200 requests; use `--max-requests <count>` (at most 1000) for a larger planned capture. Budget two inventory scans, one read per published revision, and two reads per unique media identity, including pagination. It does not publish or deploy. Hosted export requires the Free-tier preflight in `docs/cloudflare-free-tier.md`, the exact configured target, a native EmDash read token in `CMS_EXPORT_TOKEN`, and Access service credentials in `CMS_EXPORT_ACCESS_CLIENT_ID` and `CMS_EXPORT_ACCESS_CLIENT_SECRET`; do not put credentials on the command line.

The CMS owner can create and list export tokens through the native `/_emdash/api/admin/api-tokens` endpoint and revoke one with `DELETE /_emdash/api/admin/api-tokens/<id>`. Creation accepts only the scopes `content:read` and `media:read`; native expiry and revocation remain authoritative. Staff authentication and normal mutation/CSRF checks protect token management. The raw token is returned only at creation and belongs in the target's CI secret store. Token-bearing requests can reach only the fixed export GET routes, never editorial writes, token management, or commerce APIs. Each authenticated native token read also attempts a D1 `last_used_at` update: include that write attempt and token/user lookups in the account-wide export budget. No Astro session or KV binding is added.

Build that export with `pnpm build:content-snapshot --snapshot <snapshot.json> --sha256 <digest> --env local|uat|prd`. Referenced image bytes live beside the manifest at `media/<sha256>.png`, `.jpg`, or `.webp`, matching its MIME type. This command builds only the static web artifact; it does not deploy, contact the CMS, or change commerce. Snapshot mode rejects missing/invalid content and media without falling back to repository content. The normal Local stack already builds from CMS snapshots and refreshes them through Content publication. Standalone Astro diagnostics and ordinary hosted builds retain repository inputs until the explicit hosted source cutover; they are not substitutes for Local publication acceptance. Do not run Astro checks or a second web build concurrently with a snapshot build because they share the local content cache.

Publication builds additionally pass `--release-identity <release.json> --publication-id <UUID> --ci-run-id <run ID>` together. The code identity file supplies `sha`, `runId`, and `runNumber`; its SHA must match the checked-out commit. The successful build writes `apps/web/dist/release.json`, preserving that code identity and adding the publication ID, CI run ID, and snapshot digest. Its authenticated `/publications/run` claim requires `codeSha`; `/publications/complete` accepts only the bound run/code/snapshot, verifies matching public metadata at the fixed target origin, and records the workflow-supplied deployment ID.

The prepared `.github/workflows/content-publication.yml` shares the software release lock. Trusted main tooling resolves the target's canonical successful Pages deployment and release run, claims the pending CMS request, captures and privately stages published content, then builds a separate checkout of that deployed SHA. Credentials are scoped to export/deployment steps, not the source build. Only the static public artifact is deployed. The final step checks the canonical deployment and its immutable content identity, submits the deployment receipt, and verifies public content. The CMS retains the receipt before checking public propagation. The existing scheduler retries retained receipts at most once per five minutes; active CI stays pending, ended CI without a receipt becomes failed, and superseded waiting requests are closed. Immediate acknowledgement uses the existing maximum of 12 propagation checks; capture and staging are not automatically retried.

Hosted EmDash publication and recovery were accepted at cutover; see `docs/cms-cutover.md`. New hosted bulk work still requires a current Free-tier budget. The deployed code must already support snapshot builds. Configure separate `UAT_` and `PRD_` secrets for `CMS_EXPORT_TOKEN`, `CMS_PUBLICATION_EXPORT_TOKEN`, `CMS_EXPORT_ACCESS_CLIENT_ID`, and `CMS_EXPORT_ACCESS_CLIENT_SECRET`; the completion credential must match the target Worker binding. Set the corresponding `UAT_CMS_PUBLICATION_MAX_REQUESTS` or `PRD_CMS_PUBLICATION_MAX_REQUESTS` variable only from the measured budget (1–1000; no fallback). Missing UAT credentials never fall back to PRD. Account for native token D1 reads/write attempts, media staging, journal operations, and existing release API reads. The existing Pages credential handles only the static deploy in this workflow. Software promotion now rejects an artifact whose content identity differs from current target content; refresh it by dispatching the existing release workflow with target=uat and the same reviewed artifact_commit_sha, then explicitly promote the new successful candidate_run_id. Candidate preparation restores the immutable published snapshot for each target; it never imports UAT content into PRD or substitutes a newer editable CMS state. See docs/catalog-promotion.md for the pre-cutover behavior and restore budget.

Runtime catalog backfill is an explicit migration command, `pnpm catalog:backfill`, with dry-run and reviewed-plan requirements. It does not seed prices or stock. Prepare Local CMS inputs with `pnpm cms:import:local -- --prepareLocal <directory>` and capture a fresh `--verifyOnly` report against the same running CMS. Existing Local and UAT catalogs are now reconciled; see [catalog migration evidence](openspec/changes/replace-sveltia-with-emdash-operations/runtime-catalog-evidence.md#localuat-reconciliation-completion--2026-09-15) and the [cutover worksheet](docs/cms-cutover.md) for commands and remaining hosted setup.

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

- `.run/BlackBox Local Stack.run.xml` runs `pnpm dev:stack:stripe-mock`, the same flow as `pnpm dev`: Local D1 preparation, official `stripe-mock` through Go, the combined CMS/commerce Worker and the public snapshot service. It needs no Docker, real keys or `.dev.vars`.
- `.run/Stripe Sandbox Smoke.run.xml` runs `pnpm smoke:stripe-uat -- --scenario all --screenshots always --timeout-ms 120000` against deployed UAT. It is a provider diagnostic, not a Local startup step. Its only committed environment value is the non-secret expected payment label `Link`.
- Real Stripe test mode remains available from the terminal through `pnpm dev:stack:stripe-test`.
- `pnpm dev:stack:stripe-mock-api` is a terminal alias for the same official stripe-mock API path; do not add a second WebStorm launcher for it unless explicitly requested.
- Other focused backend/frontend scripts remain available from the terminal, not committed IDE run configs.
- The static-site launcher remains pinned to `http://127.0.0.1:4321/blackbox-records/`.
- If port `4321` is already in use, the static-site launcher fails fast instead of silently switching ports.
- Local D1 comes from Wrangler automatically during Worker dev; no separate D1 process is part of the run-config flow.
- The stack launchers run D1 migrations and seed SQL before starting long-running services.
- `pnpm --filter @blackbox/backend d1:check:stripe-mock:local` verifies every current store item has local mock checkout readiness rows after the mock seed runs.
- `pnpm --filter @blackbox/backend d1:smoke:local` remains a verification command, not a launch prerequisite.
