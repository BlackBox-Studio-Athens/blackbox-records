## 1. Productionize the Existing Page Seam

- [x] 1.1 Move `apps/web/src/pages/demo/under-construction.astro` to the unlinked `apps/web/src/pages/prd-holding/index.astro` source route and remove all direct-replica/local-only wording.
- [x] 1.2 Replace fake navigation and `javascript:` URLs with build-time Instagram and inquiry-email values from existing content, filtering placeholders and failing when either required action is unavailable.
- [x] 1.3 Implement the “Unfinished Sleeve” two-field composition with the existing logo, live-band image, Veneer font, DESIGN.md monochrome tokens, responsive stacking, meaningful alt text, visible focus, and touch-safe links.
- [x] 1.4 Add the locked public copy and holding-only canonical, Open Graph, favicon, and `noindex, nofollow` metadata without environment, provider, private-preview, countdown, form, or launch-date language.
- [x] 1.5 Remove external font requests, hydrated components, page-owned JavaScript, glass effects, fake controls, and unrelated demo styling; keep only optional CSS entrance motion with a reduced-motion override.

## 2. Build a Minimal Holding Artifact

- [x] 2.1 Add a dependency-free Node/TypeScript preparation script that recreates `apps/web/dist-holding/`, promotes the built PRD Holding Page to `index.html`, copies it to `404.html`, and copies only required brand/font/favicon and `/_astro` assets.
- [x] 2.2 Generate holding-only `_headers` with `X-Robots-Tag: noindex, nofollow`, preserve safe static-asset caching, and omit the full sitemap and every final route document.
- [x] 2.3 Add the smallest focused test that fails on unexpected HTML files, missing same-origin assets, scripts, third-party page-load URLs, fake links, wrong canonical/noindex metadata, or forbidden final route output.
- [x] 2.4 Add root/web package commands for preparing and checking the holding artifact using existing `tsx` and Node APIs; add no dependency.

## 3. Add an Isolated Manual Deployment Workflow

- [x] 3.1 Add `.github/workflows/prd-holding-page.yml` as a separate `workflow_dispatch`-only workflow with a false-by-default deploy input; run install, `pnpm test:unit`, `pnpm check`, `pnpm audit:unused`, the PRD-shaped build, and holding-artifact preparation without invoking `.github/workflows/pages.yml`.
- [x] 3.2 Split the manual workflow into a credential-free build/artifact job and a bounded deploy job for `pages deploy apps/web/dist-holding --project-name=blackbox-records-web --branch=holding`; require approval from the protected `prd-holding` GitHub Actions environment and keep DNS outside CI.
- [x] 3.3 Add workflow assertions or tests proving `.github/workflows/pages.yml` contains no holding build, `dist-holding` artifact, `holding` branch, or holding deploy behavior; prove no `push` can deploy `holding` and only the approved manual workflow can consume `dist-holding` or target that branch.
- [x] 3.4 Update `README.md`, `docs/environment-model.md`, and affected baseline OpenSpec specs with the PRD Holding Page, branch target, evidence boundary, activation steps, and launch/rollback handoff; do not change the UAT URL or full-site PRD canonical origin yet.

## 4. Verify the Final Local Tree

- [x] 4.1 Run the focused holding-page and artifact tests, then run `pnpm test:unit`, `pnpm check`, and `pnpm build` against the exact final implementation tree.
- [x] 4.2 Serve the assembled holding artifact locally and use Browser Use at phone and desktop sizes to verify copy, image crop, keyboard focus, responsive layout, reduced motion, 404 behavior, and console/network cleanliness.
- [x] 4.3 Confirm the local artifact contains only `index.html`, `404.html`, `_headers`, and required assets; confirm it has no sitemap, final route HTML, API request, external font request, form, checkout action, or analytics request.
- [x] 4.4 Re-run `pnpm openspec:guard` and validate this change before any hosted deployment.

## 5. Deploy and Verify the Isolated Branch

- [x] 5.1 Reconfirm Wrangler identity, the single `blackbox-records-web` Pages project, and current production deployment without printing credentials or changing state.
- [x] 5.2 Configure the protected `prd-holding` GitHub Actions environment, then use the explicit `workflow_dispatch` input and required approval to deploy the verified artifact to the `holding` branch only; do not attach the domain yet.
- [x] 5.3 Use Browser Use and bounded HTTP checks against `holding.blackbox-records-web.pages.dev` to verify desktop/mobile rendering, assets, noindex headers, 404 isolation, no final routes, and no unexpected network or console errors.
- [x] 5.4 Stop before DNS work if the named branch alias cannot pass all hosted checks; do not create a second Pages project as an unreviewed fallback.

## 6. Activate the Correct Public Domain

- [ ] 6.1 After explicit domain-change approval, record a redacted snapshot of current apex, nameserver, `www`, Pages-domain, HTTP parking, and HTTPS state for rollback; use only `blackboxrecordsathens.com`, never `blakboxrecordsathens.com`.
- [ ] 6.2 Before Pages custom-domain association, create an exact-apex temporary Cloudflare Single Redirect with status `302` to the verified HTTPS holding branch alias, preserving path/query; verify it and record its exact rule priority for rollback.
- [ ] 6.3 With the temporary guard active, add `blackboxrecordsathens.com` as a custom domain on the existing Pages project, change the Pages-created proxied apex target to the holding branch alias, and wait until Cloudflare reports an active certificate; stop if the target differs.
- [ ] 6.4 Create a proxied `www` CNAME to `blackboxrecordsathens.com`, verify public `www` DNS and edge TLS, then add exact-host Cloudflare Single Redirect rules using `308`: HTTP apex to the equivalent HTTPS apex path/query, and every `www` request to the equivalent HTTPS apex path/query; verify neither rule matches another hostname and do not enable HSTS.
- [ ] 6.5 Remove the temporary guard and immediately verify apex target identity, DNS/TLS, both canonical redirects, no registrar parking, canonical/noindex headers, page rendering, guessed-route 404 behavior, and network/console cleanliness with Browser Use plus bounded DNS/HTTP probes.
- [ ] 6.6 If activation exposes production `main`, uses the wrong target, or fails apex/`www` TLS or content checks, re-enable the temporary guard first, then restore the recorded apex, `www`, and redirect-rule state and keep the verified branch deployment available for diagnosis.

## 7. Record the Launch Handoff

- [ ] 7.1 Update `production-go-live-readiness` with redacted proof for domain ownership, holding-page TLS/routing, and the remaining full-site custom-domain cutover; do not mark Stripe, Worker, D1, catalog, webhook, or go/no-go gates complete from holding-page evidence.
- [ ] 7.2 Keep the apex on the PRD Holding Page while any live Stripe Products/Prices, Payment Method Configuration, production webhook, Worker/D1, catalog/stock, rollback, exact-origin, or named go/no-go task remains open; do not soft-launch the full site because its static artifact is ready.
- [ ] 7.3 After `production-go-live-readiness` is complete and its named reviewers record a go decision, update all full-site custom-domain origins together, deploy and verify the full PRD artifact, repoint the apex to the production `main` target, retain the holding branch as rollback, then remove holding code only after stability.
- [ ] 7.4 Re-run `pnpm test:unit`, `pnpm check`, and `pnpm build` against the exact final documented tree and record final OpenSpec status.
