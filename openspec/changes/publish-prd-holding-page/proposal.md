## Why

`blackboxrecordsathens.com` was delegated to Cloudflare but served registrar parking without working HTTPS. It is now attached to the existing Cloudflare Pages project and serves the isolated PRD Holding Page while the label prepares the full site without changing UAT, exposing unfinished commerce, or removing the full `pages.dev` PRD readiness surface.

## What Changes

- Publish an original, BlackBox-branded PRD Holding Page at `https://blackboxrecordsathens.com/` while the full site remains under review and live Stripe setup remains closed.
- Replace the existing local-only direct-replica demo with a production-owned, plain under-construction page that uses real content links, the existing logo, self-hosted typography, no landing image, and no runtime API or provider calls.
- Build a minimal holding artifact in a separate manual-only GitHub Actions workflow and deploy it to an isolated Cloudflare Pages branch target only through a protected approval gate, preserving both GitHub Pages UAT and the full `blackbox-records-web.pages.dev` PRD readiness site.
- Make the apex hostname canonical through a staged custom-domain association that immediately targets the verified holding branch, redirect HTTP to HTTPS and `www` to the apex with exact-host rules, keep the temporary page out of search indexes, and define explicit launch cutover and rollback steps.
- Keep the public message non-technical: the site is being prepared, the label is active, and visitors can use real contact and social paths. Do not expose environment names, Stripe status, private review links, or an invented launch date.
- Keep the PRD Holding Page on the public apex until every production-go-live gate passes, including live Stripe catalog, payment configuration, webhook, Worker/D1, rollback, and named go/no-go evidence. A finished static site alone does not authorize a soft launch.

## Capabilities

### New Capabilities

- `prd-holding-page`: Defines the temporary public page's content, visual language, accessibility, metadata, performance, and interaction boundaries.

### Modified Capabilities

- `static-site-and-deployment`: Adds an isolated holding artifact and Pages branch deployment, custom-domain routing, and a reversible cutover to the full PRD artifact.
- `environment-model`: Classifies the PRD Holding Page as a temporary public surface within PRD rather than a fourth Product Environment or PRD acceptance surface.
- `project-language`: Establishes `PRD Holding Page` as the canonical term and separates it from UAT, the PRD Readiness Site, and the launched PRD Site.

## Impact

- Frontend page and styling under `apps/web`, simplifying the current PRD Holding Page to a logo-and-type composition without a landing image.
- A small dependency-free artifact-preparation script, focused tests, package scripts, and a separate manual-only holding workflow; this change adds no holding build, artifact, branch, or deploy behavior to `.github/workflows/pages.yml`.
- Cloudflare Pages branch/custom-domain configuration, apex and `www` DNS/redirect behavior, TLS verification, and launch rollback procedure.
- Environment/deployment documentation and OpenSpec baselines after implementation.
- No new npm dependency, Pages Function, Worker route, database, form backend, checkout behavior, provider mutation, or change to the UAT URL.
- No full-site launch with checkout hidden or disabled as an interim public state; the public apex remains on the PRD Holding Page until production launch approval.
