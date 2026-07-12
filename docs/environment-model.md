# Environment Model

BlackBox Records uses three Product Environments: Local, UAT, and PRD. Other names such as GitHub Actions environment, Stripe test mode, Stripe live mode, and sandbox are platform or provider layers mapped under that product model.

## Matrix

| Product Environment | Normal mode or surface   | Static frontend                                                              | Worker runtime target                       | D1 store                  | Stripe/provider mode                 | CI credential scope     | Secret store                                                                                    | Validation gates                                                                                                               |
| ------------------- | ------------------------ | ---------------------------------------------------------------------------- | ------------------------------------------- | ------------------------- | ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Local               | `mock`                   | `http://127.0.0.1:4321/blackbox-records/`                                    | local Worker `mock`; `mock-api` is an alias | local D1                  | stripe-mock + no-network Resend mock | none                    | committed mock vars plus ignored local files only when needed                                   | `pnpm dev:stack:stripe-mock`, `pnpm --filter @blackbox/backend d1:check:stripe-mock:local`                                     |
| Local               | `uat-connected`          | `http://127.0.0.1:4321/blackbox-records/`                                    | deployed UAT Worker/API                     | UAT D1 through the Worker | Stripe test mode through UAT         | none                    | no UAT Stripe or Worker secrets are copied locally                                              | `pnpm dev:stack:uat-connected`, UAT smoke commands when a provider write is intentional                                        |
| UAT                 | deployed acceptance site | GitHub Pages at `https://blackbox-studio-athens.github.io/blackbox-records/` | Wrangler `uat` Worker runtime target        | UAT D1                    | Stripe test mode                     | `catalog-promotion-uat` | GitHub Actions secrets, Cloudflare Worker secrets, Stripe Dashboard/Workbench test-mode secrets | repository gates, `pnpm runtime:config:verify --env uat`, UAT Promotion Evidence                                               |
| PRD                 | disabled readiness site  | Cloudflare Pages at `https://blackbox-records-web.pages.dev/`                | Wrangler `prd` Worker runtime target        | PRD D1                    | Stripe live mode                     | `catalog-promotion-prd` | GitHub Actions secrets, Cloudflare Worker secrets, Stripe Dashboard/Workbench live-mode secrets | repository gates, `pnpm runtime:config:verify --env prd`, disabled or `not_configured` PRD evidence until `PRD_OPEN_GATE=open` |

PRD exists as a deployable static readiness surface, but live checkout and live provider catalog mutation are disabled until an explicit production-readiness gate opens them. Before that gate, PRD evidence is readiness-only, disabled, or `not_configured`; it is not successful PRD Promotion Evidence.

## Review Site Marker

The UAT static build sets the private build-time flag `SHOW_REVIEW_SITE_MARKER=true` and displays `Review site · test payments` beneath the header wordmark. Local, full PRD, PRD Holding Page, and diagnostic builds leave the flag unset, so they render no marker. Review Site Marker is presentational only: Worker feature gates and Stripe configuration still control checkout and payment authority.

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
3. Add an exact-apex temporary `302` redirect to the verified HTTPS holding alias, preserving path and query.
4. Associate `blackboxrecordsathens.com` with the existing Pages project, point the proxied apex target to the holding alias, and wait for active TLS.
5. Add the proxied `www` CNAME and exact-host `308` rules for HTTP apex and `www` canonicalization, preserving path and query.
6. Remove the temporary guard and immediately verify target identity, TLS, redirects, canonical/noindex headers, 404 behavior, and absence of registrar parking.

Any wrong target, full-site exposure, or TLS failure re-enables the temporary guard first. Restore the recorded DNS and redirect state if activation cannot complete. At approved full-site launch, repoint the apex to production `main` only after every production-go-live gate passes, and keep the verified holding branch available as rollback until launch stability is accepted.

The disabled PRD readiness probe does not require live Stripe secrets. Resend runtime config is still environment-scoped because email delivery and newsletter Contact writes are backend-owned. Opened PRD promotion runs use `pnpm runtime:config:verify --env prd --require-live-secrets` before live provider mutation.

## Platform Layers

- GitHub Actions environments are credential and protection scopes for workflow jobs. They are not Product Environments.
- Wrangler environments are Worker runtime targets named `local`, `uat`, and `prd`; `sandbox` and `production` are accepted only as legacy CLI aliases where documented.
- Stripe test mode, Stripe live mode, stripe-mock, the Local no-network Resend mock, and Resend provider resources are provider layers. They are not Product Environments.
- Secret stores remain isolated by design: local ignored files, GitHub Actions secrets, Cloudflare Worker secrets, and Stripe Dashboard/Workbench values must be populated separately. The repo may validate names and presence, but it must not print, commit, sync, or rotate sensitive values.
- `@t3-oss/env-core` validates local/process environment contracts in Node scripts and preflight checks. It is not a secret store.
- Resend uses verified `blackboxrecordsathens.com` for sending and the managed `ambkime.resend.app` Receiving domain for UAT. UAT maps application email and newsletter Contact writes to `uat-sink@ambkime.resend.app`; Receiving stays disabled on `blackboxrecordsathens.com`, and PRD must not honor the UAT sink override.
- Paid-order email brand URLs are public Worker runtime config. Local/UAT use the GitHub Pages home and logo URLs; PRD uses the Cloudflare Pages home and logo URLs until an approved custom public site domain replaces them.

## Origins And API Targets

| Scope                 | `PUBLIC_BACKEND_BASE_URL`                                                | `CHECKOUT_RETURN_ORIGINS`                                                                               |
| --------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Local `mock`          | `http://127.0.0.1:8787`                                                  | `http://127.0.0.1:4321,http://localhost:4321`                                                           |
| Local `uat-connected` | `https://blackbox-records-backend-uat.blackboxrecordsathens.workers.dev` | UAT Worker allows local origins only as named diagnostics                                               |
| UAT                   | `UAT_PUBLIC_BACKEND_BASE_URL` in GitHub Pages workflow variables         | `http://127.0.0.1:4321,http://localhost:4321,https://blackbox-studio-athens.github.io/blackbox-records` |
| PRD                   | `PRD_PUBLIC_BACKEND_BASE_URL` in Cloudflare Pages workflow variables     | `https://blackbox-records-web.pages.dev`                                                                |

Cloudflare Pages branch or preview deploys are non-product diagnostics. They must not be used as UAT acceptance, PRD readiness, Promotion Evidence, or shopper-facing commerce proof.

## Catalog Assets

Generated Product Projection image URLs are environment-scoped catalog promotion data.

- UAT catalog artifacts use the GitHub Pages UAT asset base: `https://blackbox-studio-athens.github.io/blackbox-records/`.
- PRD catalog verification and readiness use the Cloudflare Pages PRD asset base: `https://blackbox-records-web.pages.dev/`, unless a later approved change defines a PRD custom domain or shared canonical asset CDN.
- PRD readiness/live evidence must fail if it is generated from UAT Product image URLs.

## Email Brand Assets

- Local and UAT email brand home URL: `https://blackbox-studio-athens.github.io/blackbox-records/`.
- Local and UAT email brand logo URL: `https://blackbox-studio-athens.github.io/blackbox-records/assets/images/brand/logo-horizontal.png`.
- PRD email brand home URL: `https://blackbox-records-web.pages.dev/`.
- PRD email brand logo URL: `https://blackbox-records-web.pages.dev/assets/images/brand/logo-horizontal.png`.
- These URLs are public brand assets, not secrets, and `pnpm runtime:config:verify --env local|uat|prd` classifies them with the other Worker email config categories.

## Manual Checkpoints

After this model is active, maintainers need these provider-side steps:

1. Create or update the GitHub Actions credential scope `catalog-promotion-prd`, moving any required secrets, variables, and protection rules from the old production-named scope if it existed.
2. Set `UAT_PUBLIC_BACKEND_BASE_URL` and `PRD_PUBLIC_BACKEND_BASE_URL` in GitHub Actions variables so static builds cannot share one backend target by accident.
3. Add `PRD_OPEN_GATE=open` only when the production-readiness change explicitly approves live PRD checkout and live provider mutation.
4. Add or rotate Cloudflare Worker secrets from `apps/backend` with `wrangler secret put --env uat` or `--env prd`; do not store the values in docs, screenshots, chat, or committed files.
5. Configure Stripe Dashboard/Workbench webhook and catalog settings in test mode for UAT and live mode for PRD. Existing webhook signing secrets cannot be retrieved by Stripe APIs, so endpoint shape can be verified by CLI but signing-secret match needs a redacted runtime proof.
6. Configure Resend manually before live provider acceptance: verify `blackboxrecordsathens.com` DNS through Cloudflare, keep Receiving disabled on that custom domain, use `uat-sink@ambkime.resend.app` for UAT Receiving, align SPF/DKIM/DMARC, keep Cloudflare Email Routing for `support@blackboxrecordsathens.com` replies where needed, create/upload `RESEND_API_KEY`, configure `RESEND_NEWSLETTER_TOPIC_ID`, optionally configure `RESEND_NEWSLETTER_SEGMENT_ID`, and run read-only Resend CLI checks without committing evidence.
