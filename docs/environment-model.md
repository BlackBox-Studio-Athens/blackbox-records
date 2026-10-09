# Environment Model

BlackBox Records uses three Product Environments: Local, UAT, and PRD. Other names such as GitHub Actions environment, Stripe test mode, Stripe live mode, and sandbox are platform or provider layers mapped under that product model.

Public HTML renders from accepted snapshots behind the existing Pages origins. Pages serves the renderer's client assets and the public GET/HEAD gateway; no route HTML ships. Each environment has its own renderer and R2 pointer; commerce and staff remain in the backend. See [content publication](content-publication.md).

The hosted release derives its gateway allowlist from Astro's resolved routes and excludes `/favicon*`, `/_astro/*`, `/assets/*` and `/robots.txt` from the Function. CMS image markup references the Images host directly, always using the environment's configured canonical Pages source origin. Public and publication work use separate disposable cache instances (`public-v2`, `publication-v2`) with an Eastern Europe placement hint; accepted state remains in R2 and the CMS journal.

### Pages fail-closed (HOST-11, decided)

Pages is fail-closed. The release ships no static route HTML: the Pages upload is the renderer's client assets, a prerendered `robots.txt` and the gateway, so there is no stale surface to fail open to. If the Function quota is exhausted, shoppers get the platform's error rather than older editorial content, and the renderer and quota outage stays visible. The mode is set once in the Cloudflare dashboard (Settings > Runtime > Fail open/closed > Fail closed) on `blackbox-records-web-uat` and `blackbox-records-web`, because the Cloudflare API rejects `fail_open` in a project PATCH (HTTP 400). Every UAT deploy and PRD promotion verifies it: before it uploads, `scripts/configure-public-gateway.mjs` reads the production configuration back and fails the run unless `fail_open` is `false`, naming the dashboard setting to change. Both projects were switched on 2026-10-07 and read back as `false` on production and preview. Because no HTML ships, the setting only decides what a quota outage looks like. Builds restore no CMS content, media or secrets; the renderer reads its accepted snapshot pointer from R2. Chunk-split drift between the Local fixture build that the e2e suite and bundle budgets verify and the hosted renderer build (HOST-12) is caught by the push's UAT static smoke before PRD.

## Matrix

| Product Environment | Normal mode or surface   | Static frontend                                                   | Worker runtime target                       | D1 store                  | Stripe/provider mode                 | CI credential scope     | Secret store                                                                                    | Validation gates                                                                                 |
| ------------------- | ------------------------ | ----------------------------------------------------------------- | ------------------------------------------- | ------------------------- | ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Local               | `mock`                   | `http://127.0.0.1:4321/blackbox-records/`                         | local Worker `mock`; `mock-api` is an alias | local D1                  | stripe-mock + no-network Resend mock | none                    | committed mock vars plus ignored local files only when needed                                   | `pnpm dev:stack:stripe-mock`, `pnpm --filter @blackbox/backend d1:check:stripe-mock:local`       |
| Local               | `uat-connected`          | `http://127.0.0.1:4321/blackbox-records/`                         | deployed UAT Worker/API                     | UAT D1 through the Worker | Stripe test mode through UAT         | none                    | no UAT Stripe or Worker secrets are copied locally                                              | `pnpm dev:stack:uat-connected`, UAT smoke commands when a provider write is intentional          |
| UAT                 | deployed acceptance site | Cloudflare Pages at `https://blackbox-records-web-uat.pages.dev/` | Wrangler `uat` Worker runtime target        | UAT D1                    | Stripe test mode                     | `catalog-promotion-uat` | GitHub Actions secrets, Cloudflare Worker secrets, Stripe Dashboard/Workbench test-mode secrets | repository gates, `pnpm runtime:config:verify --env uat`, UAT Promotion Evidence                 |
| PRD                 | disabled readiness site  | Cloudflare Pages at `https://blackbox-records-web.pages.dev/`     | Wrangler `prd` Worker runtime target        | PRD D1                    | Stripe live mode                     | `catalog-promotion-prd` | GitHub Actions secrets, Cloudflare Worker secrets, Stripe Dashboard/Workbench live-mode secrets | repository gates, `PRD_LAUNCH_APPROVED=true` plus `native_checkout_enabled` for shopper checkout |

PRD exists as a deployable static readiness surface. A live catalog change needs its own reviewed one-run confirmation and does not authorize Worker or static deployment. Shopper checkout remains closed until separate launch approval and runtime enablement both pass. Before those controls pass, PRD evidence is readiness-only, disabled, or `not_configured`; it is not successful launch evidence.

Main pushes deploy only UAT. A push runs repository checks, the whole end-to-end suite and staff previews in Chromium and Firefox against the PRD staff build, and a content-free UAT build. One `deploy-uat` job runs once the checks and the build pass: a read-only Pages credential check, migrations, the Workers, Pages, Worker and hosted identity verification, then the UAT static smoke. The browser suites run beside the deploy; a failed suite or smoke turns the run red, and a run that did not succeed cannot be promoted. `pnpm release:watch [ref]` follows the push run for a commit (default `HEAD`) until it finishes and exits with its result. Provider smoke is not part of a push or promotion; it is the manual `uat-smoke.yml` workflow. PRD code promotion is `gh workflow run promote-prd.yml`, which takes no inputs. It reads which SHA and push run UAT serves, verifies that run succeeded on `main` with its suites, rebuilds PRD from that SHA, then applies migrations, deploys the Workers, then Pages, then verifies the deployed identity, preserving the holding branch and apex. It runs no browser or provider suite and took 2.0 minutes in run 37546197141; the Worker checks wait up to about two minutes for the new version to propagate. Routine rollback is revert, push and promote; emergency rollback pairs the renderer Worker version with the Pages deployment of the same run, and the CMS Worker only when no migration ran in between. See [the release runbook](catalog-promotion.md).

UAT deployments omit `NATIVE_CHECKOUT_ENABLED` from committed variables and retain `--keep-vars`, preserving the operator's override; the runtime defaults to closed when no override exists. Ordinary `verify-worker uat` and `verify-hosted uat` release checks require `nativeCheckout.enabled=false`. Close any authorized provider-test window before a software release; the separate manual provider smoke does not use these release checks.

## Review Site Marker

The UAT public build sets the private build-time flag `SHOW_REVIEW_SITE_MARKER=true`; Staff uses its existing `PUBLIC_STAFF_ENVIRONMENT=uat`. Both show a permanent yellow banner above the header: `UAT · TESTING ONLY` and `Data here is separate and does not transfer to or from the production site.` The `Open production site` link opens the corresponding production home in a new tab: `https://blackbox-records-web.pages.dev/` for public or `https://staff.blackboxrecordsathens.com/` for Staff. The banner wraps on mobile, remains visible while scrolling, and cannot be dismissed. Both browser titles start with `[UAT]`. Public checkout retains `Test checkout. No real payment will be taken.` beside the final checkout action. Local and PRD builds render none of these UAT cues. Review Site Marker is presentational only: Worker feature gates and Stripe configuration still control checkout and payment authority.

Use this non-technical template when sharing the UAT URL:

> Here is the site link for review. It is not the public launch site, and any payments are tests.

### PRD deployment surfaces before launch

PRD has two static deployment surfaces in the same `blackbox-records-web` Cloudflare Pages project:

- `main` serves the full disabled PRD readiness site at `https://blackbox-records-web.pages.dev/`.
- `holding` serves the temporary PRD Holding Page at `https://holding.blackbox-records-web.pages.dev/` and, after separately approved activation, at `https://blackboxrecordsathens.com/`.

The `holding` branch is not a fourth Product Environment. Its evidence proves only holding-page artifact, public-domain, TLS, redirect, and route-isolation readiness. It does not satisfy UAT acceptance, full-site PRD readiness, Promotion Evidence, Stripe, Worker, D1, catalog, webhook, or go/no-go gates.

The manual `.github/workflows/prd-holding-page.yml` workflow builds and verifies `apps/web/dist-holding` without credentials. Its optional deploy job targets only the Pages `holding` branch through the `prd-holding` GitHub Actions environment. The environment restricts deployment sources to `main` and has no required reviewers, so an explicit `deploy=true` dispatch needs no separate approval. DNS is never changed by CI.

Activation order is fixed:

1. Verify the `holding` branch alias at phone and desktop sizes, including noindex headers and guessed-route isolation.
2. Record a redacted rollback snapshot of apex, nameservers, `www`, Pages-domain, parking, HTTP, and HTTPS state.
3. Associate `blackboxrecordsathens.com` with the existing Pages project, point the proxied apex target to the holding alias, and wait for active TLS. Do not add a temporary redirect guard because it can block Pages domain validation.
4. Add the proxied `www` CNAME and exact-host `308` rules for HTTP apex and `www` canonicalization, preserving path and query.
5. Immediately verify target identity, TLS, redirects, canonical/noindex headers, 404 behavior, and absence of registrar parking.

If activation exposes the wrong target, the full site, invalid TLS, broken metadata, or incorrect redirects, remove only the newly added holding redirect rules and `www` record, then restore the recorded apex target only if it changed. At approved full-site launch, repoint the apex to production `main` only after every production-go-live gate passes, and keep the verified holding branch available as rollback until launch stability is accepted. Public image transformations need no code change for the apex: the renderer always uses the environment's configured Images source (`PUBLIC_IMAGE_SOURCE_ORIGIN`, the Pages origin approved in the Images settings). Right after the apex serves `main`, run `pnpm smoke:uat-static -- --site-url https://blackboxrecordsathens.com --scenario image_transform`.

The disabled PRD readiness probe does not require live Stripe secrets. Resend runtime config is still environment-scoped because email delivery and newsletter Contact writes are backend-owned. A future confirmed PRD catalog run uses `pnpm runtime:config:verify --env prd --require-live-secrets` before live provider mutation.

## Platform Layers

- GitHub Actions environments are credential and protection scopes for workflow jobs. They are not Product Environments.
- Wrangler environments are Worker runtime targets named `local`, `uat`, and `prd`; `sandbox` and `production` are accepted only as legacy CLI aliases where documented.
- Stripe test mode, Stripe live mode, stripe-mock, the Local no-network Resend mock, and Resend provider resources are provider layers. They are not Product Environments.
- Secret stores remain isolated by design: local ignored files, GitHub Actions secrets, Cloudflare Worker secrets, and Stripe Dashboard/Workbench values must be populated separately. The repo may validate names and presence, but it must not print, commit, sync, or rotate sensitive values.
- `@t3-oss/env-core` validates local/process environment contracts in Node scripts and preflight checks. It is not a secret store.
- Resend uses verified `blackboxrecordsathens.com` for sending and the managed `ambkime.resend.app` Receiving domain for UAT. UAT maps application email and newsletter Contact writes to `uat-sink@ambkime.resend.app`; Receiving stays disabled on `blackboxrecordsathens.com`, and PRD must not honor the UAT sink override.
- Paid-order email brand URLs are public Worker runtime config. Local/UAT use the Cloudflare Pages home and logo URLs; PRD uses the Cloudflare Pages home and logo URLs until an approved custom public site domain replaces them.

## Services Inquiry Email Delivery

`POST /api/services/inquiries` is the public Worker endpoint for Services inquiries. The browser sends validated contact and inquiry fields, never a recipient address or provider configuration.

- Local uses the committed no-network email mock. A successful response proves application acceptance without Resend, Cloudflare alias forwarding, Gmail delivery, UAT effects, or PRD effects.
- UAT sends through Resend only to the managed `uat-sink@ambkime.resend.app` recipient policy. UAT does not exercise the public service aliases or Gmail forwarding.
- PRD maps General to `info@blackboxrecordsathens.com`, Tour Booking to `booking@blackboxrecordsathens.com`, Merch Printing to `merch@blackboxrecordsathens.com`, and Vinyl Pressing to `vinyl@blackboxrecordsathens.com`. Cloudflare Email Routing forwards all four aliases to the existing Gmail inbox; manually verify each alias before PRD acceptance.

The Worker returns `{"status":"submitted"}` only after provider acceptance. The site confirms inline without redirecting and does not send a visitor receipt. V1 has no CAPTCHA, Turnstile, honeypot, application rate limiting, or D1 inquiry persistence. Strict bounded validation, HTML escaping, pending-submit protection, and content-free logs remain required.

The About contact directory links `info@`, `demos@` and `touring@blackboxrecordsathens.com`; Cloudflare Email Routing must forward each to the same inbox. Do not publish `@blackboxrecords.com` addresses: that domain has a null MX.

## Origins And API Targets

| Scope                 | `PUBLIC_BACKEND_BASE_URL`                                                | `CHECKOUT_RETURN_ORIGINS`                                                                |
| --------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Local `mock`          | `http://127.0.0.1:8787`                                                  | `http://127.0.0.1:4321,http://localhost:4321`                                            |
| Local `uat-connected` | `https://blackbox-records-backend-uat.blackboxrecordsathens.workers.dev` | UAT Worker allows local origins only as named diagnostics                                |
| UAT                   | `UAT_PUBLIC_BACKEND_BASE_URL` in Cloudflare Pages workflow variables     | `http://127.0.0.1:4321,http://localhost:4321,https://blackbox-records-web-uat.pages.dev` |
| PRD                   | `PRD_PUBLIC_BACKEND_BASE_URL` in Cloudflare Pages workflow variables     | `https://blackbox-records-web.pages.dev`                                                 |

Cloudflare Pages branch or preview deploys are non-product diagnostics. They must not be used as UAT acceptance, PRD readiness, Promotion Evidence, or shopper-facing commerce proof.

## Catalog Assets

Generated Product Projection image URLs are environment-scoped catalog promotion data.

- UAT catalog artifacts use the Cloudflare Pages UAT asset base: `https://blackbox-records-web-uat.pages.dev/`.
- PRD catalog verification and readiness use the Cloudflare Pages PRD asset base: `https://blackbox-records-web.pages.dev/`, unless a later approved change defines a PRD custom domain or shared canonical asset CDN.
- PRD readiness/live evidence must fail if it is generated from UAT Product image URLs.

## Email Brand Assets

- Local and UAT email brand home URL: `https://blackbox-records-web-uat.pages.dev/`.
- Local and UAT email brand logo URL: `https://blackbox-records-web-uat.pages.dev/assets/images/brand/logo-horizontal.png`.
- PRD email brand home URL: `https://blackbox-records-web.pages.dev/`.
- PRD email brand logo URL: `https://blackbox-records-web.pages.dev/assets/images/brand/logo-horizontal.png`.
- These URLs are public brand assets, not secrets, and `pnpm runtime:config:verify --env local|uat|prd` classifies them with the other Worker email config categories.

## Manual Checkpoints

After this model is active, maintainers need these provider-side steps:

1. Create or update the GitHub Actions credential scope `catalog-promotion-prd`, moving any required secrets, variables, and protection rules from the old production-named scope if it existed.
2. Set `UAT_PUBLIC_BACKEND_BASE_URL` and `PRD_PUBLIC_BACKEND_BASE_URL` in GitHub Actions variables so static builds cannot share one backend target by accident.
3. Remove the obsolete production control variable from GitHub and Worker configuration. Do not replace it with a persistent catalog-preparation variable; a future live catalog change needs its own reviewed one-run confirmation.
4. Keep `PRD_LAUNCH_APPROVED` absent until the sole launch approver accepts final evidence. At launch, checkout still requires `native_checkout_enabled` to resolve true. The optional Worker variable `PRD_AVAILABILITY_ALERTS_APPROVED` defaults off when absent, false or invalid. Keep it absent or false through closed preparation and verify it for approved public selling. The [2026-10-08 scope](../openspec/changes/migrate-stripe-to-blackboxrecords/evidence.md#owner-decisions--2026-10-08) supersedes restricted-beta cohort/order/end requirements without activating these controls. Alert delivery still requires both checkout controls. This input affects only PRD availability alerts, never order delivery or estimate notices; Local and UAT ignore it.
5. Add or rotate Cloudflare Worker secrets from `apps/backend` with `wrangler secret put --env uat` or `--env prd`; do not store the values in docs, screenshots, chat, or committed files.
6. Configure Stripe Dashboard/Workbench webhook and catalog settings in test mode for UAT and live mode for PRD. Existing webhook signing secrets cannot be retrieved by Stripe APIs, so endpoint shape can be verified by CLI but signing-secret match needs a redacted runtime proof.
7. Configure Resend manually before live provider acceptance: verify `blackboxrecordsathens.com` DNS through Cloudflare, keep Receiving disabled on that custom domain, use `uat-sink@ambkime.resend.app` for UAT Receiving, align SPF/DKIM/DMARC, keep Cloudflare Email Routing for `support@blackboxrecordsathens.com` replies where needed, create/upload `RESEND_API_KEY`, configure `RESEND_NEWSLETTER_TOPIC_ID`, optionally configure `RESEND_NEWSLETTER_SEGMENT_ID`, and run read-only Resend CLI checks without committing evidence.
