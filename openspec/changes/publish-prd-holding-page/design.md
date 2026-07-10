## Context

As of 2026-07-10, Cloudflare contains one Pages project, `blackbox-records-web`, whose production `main` deployment serves the full disabled PRD readiness site at `https://blackbox-records-web.pages.dev/`. UAT independently serves the same visible site from GitHub Pages. The correct owned domain is `blackboxrecordsathens.com`; it uses Cloudflare nameservers but is not a Pages custom domain, still serves Spaceship parking over HTTP, has no working HTTPS response, and has no `www` record. The misspelled `blakboxrecordsathens.com` does not resolve.

The repo also contains `apps/web/src/pages/demo/under-construction.astro`. It is useful as a route and build seam, but it is explicitly a direct MonoDeaf-style replica, loads unrelated Google Fonts, contains fake `javascript:void(0)` links, and claims to be local-only even though Astro emits it. It must not ship unchanged.

This is a brand-register page. Physical scene: a listener opens the label link from a gig poster on a phone in a dark venue and needs immediate proof that BlackBox is active and reachable. Voice: **photocopied, nocturnal, working**.

Reference lane:

- [RCA Records](https://www.siteinspire.com/website/6180-rca-records): black-and-white, grid-led, typographic record-label framing.
- [Inner Ear Records](https://www.siteinspire.com/website/5018-inner-ear-records): restrained black-and-white label identity.
- [Oto Nove Swiss Paris](https://www.siteinspire.com/website/9361-oto-nove-swiss-paris): music-first typography with a strict monochrome system.
- [NRLY coming-soon motion](https://www.awwwards.com/inspiration/coming-soon-page-animation-nrly): one controlled entrance sequence rather than scattered effects.

These references define a lane, not a layout to copy. `PRODUCT.md`, `DESIGN.md`, the current site, and repo-owned imagery remain authoritative.

## Goals / Non-Goals

**Goals:**

- Put a deliberate, original BlackBox presence on the correct HTTPS apex without changing the UAT review site.
- Preserve the full `pages.dev` PRD readiness deployment for catalog assets and future launch checks.
- Use one static page, one meaningful repo-owned image, existing brand assets, and existing typography with no client runtime.
- Make domain activation, retirement, go-live cutover, and rollback explicit and reversible.
- Give non-technical visitors only useful public information: the label is active, the site is being prepared, and real contact paths work.
- Keep the public apex on the PRD Holding Page until the existing production-go-live change proves live Stripe and every dependent PRD gate, followed by named go/no-go approval.

**Non-Goals:**

- Opening PRD checkout, configuring live Stripe, deploying the PRD Worker, or creating provider state.
- Replacing UAT, creating a fourth Product Environment, or treating the holding page as PRD acceptance evidence.
- Adding a newsletter form, CMS model, countdown, launch date, private-preview link, analytics, cookie banner, or status dashboard.
- Redesigning the full site, app shell, player, navigation, content collections, or global design system.
- Creating a second Pages project, Pages Function, Worker route, or frontend dependency.
- Soft-launching the full site with checkout hidden, disabled, test-backed, or otherwise incomplete.

## Decisions

### Keep one Pages project and isolate the holding deployment by branch

The existing `blackbox-records-web` Pages project remains the only PRD static project. Its production `main` deployment continues serving the full disabled readiness site at `blackbox-records-web.pages.dev`. A named Direct Upload branch, `holding`, receives the minimal PRD Holding Page artifact. The apex custom domain is added to the existing project and its proxied DNS target points to `holding.blackbox-records-web.pages.dev`, following Cloudflare's documented custom branch alias model.

The holding deployment stays out of the shared static workflow. A separate `.github/workflows/prd-holding-page.yml` workflow is manual-only, requires `workflow_dispatch` with an explicit boolean input, and gates its deploy job through a protected GitHub Actions environment named `prd-holding`. It runs the repository gates, builds the PRD-shaped Astro artifact, prepares `dist-holding`, hands that artifact to its deploy job, and targets only the `holding` branch. This prevents a holding-only dispatch from redeploying UAT or the Pages production `main` target. The shared workflow may continue evolving for its existing UAT and full PRD responsibilities; this change does not impose byte-for-byte immutability on it.

This preserves both current environments and avoids domain transfer between Pages projects at launch. A separate Pages project was rejected because it adds infrastructure and makes custom-domain handoff and certificate rollback more fragile. Replacing the production `main` artifact was rejected because it removes the full PRD readiness site. Replacing only the full site's root page was rejected because all other final routes would remain publicly reachable on the apex.

Custom-domain association can temporarily point an apex at the Pages production `main` target before its CNAME is changed to a branch alias. To prevent that exposure, activation first creates an exact-host temporary Cloudflare Single Redirect from the apex to the already-verified HTTPS holding branch alias. It uses status `302` and preserves path and query. With that guard active, the operator associates the domain, changes the Pages-created apex target to the `holding` alias, waits for Active TLS, and confirms the target. The guard is then removed and bounded apex checks run immediately. Any full-site response, wrong target, or certificate failure re-enables the guard and stops activation.

If Cloudflare cannot activate the apex against the named branch alias under this guard, implementation stops. A separate-project fallback requires a new decision; it is not silently created.

### Keep the holding page until Stripe-ready production approval

The public apex remains on the verified `holding` branch until `production-go-live-readiness` is complete and its named reviewers record a go decision. A complete static artifact, accepted UAT design, working custom domain, or available PRD readiness deployment does not qualify as launch approval.

The hard cutover prerequisites include live Stripe credentials, live Products and Prices, the approved Payment Method Configuration, the production webhook endpoint, PRD Worker and D1 configuration, launch catalog and stock readiness, rollback/emergency-disable evidence, exact custom-domain origins, and final human approval. UAT test-mode evidence proves review behavior only; it does not satisfy these PRD gates.

A public full-site soft launch with checkout hidden or disabled was rejected. It would recreate the same expectation problem as an unmarked UAT link and would split “launch” into an unclear visual launch and a later commerce launch. The PRD Holding Page therefore remains the only public apex experience until the complete site and live commerce can launch together. The full disabled PRD readiness artifact stays available only at its `pages.dev` origin for technical checks.

### Produce a strict allowlist artifact from the existing Astro build

The manual holding workflow runs one PRD-shaped Astro build. A small Node/TypeScript script using built-in filesystem APIs creates `apps/web/dist-holding/` from that build:

- promote the built PRD Holding Page document to `index.html`;
- copy the same document to `404.html` so guessed routes never expose the full site;
- copy only directories/files needed by the page, including referenced `/_astro` output, brand assets, fonts, and favicons;
- write holding-only `_headers` with `X-Robots-Tag: noindex, nofollow` and safe static headers;
- omit sitemap, admin, stock, store, checkout, shell partials, and every other route document.

An artifact test enumerates emitted HTML and fails unless only `index.html` and `404.html` exist. A link/asset check fails when the HTML references a missing local file. Copying the built `/_astro` directory is intentionally broader than tracing individual hashed assets; it keeps the preparation script short while still withholding full route documents.

The existing demo is moved to `apps/web/src/pages/prd-holding/index.astro` and rewritten in place rather than creating another UI stack. The source route remains unlinked and noindex in normal UAT/PRD builds; only the allowlisted artifact promotes it to `/`.

### Give the page one visual idea: “The Unfinished Sleeve”

Desktop uses a hard two-field composition rather than a centered template:

- a 58–64% grayscale live-performance image field, cropped edge-to-edge and treated like a photocopied record sleeve;
- a near-black information field with the label mark, one display headline, one short paragraph, a static status line, and two text links;
- one thin hard border and an offset registration-mark detail to suggest a sleeve still in production;
- no card grid, glass panel, gradient text, illustration pack, construction iconography, or generic yellow hazard tape.

Mobile stacks identity and copy before the image, keeps the primary message visible without scrolling on common phone heights, then allows natural vertical scrolling on short devices. The layout supports 320px through wide desktop without horizontal overflow.

Color comes directly from `DESIGN.md`: Void Background `#0d0d0d`, Ink Foreground `#f5f5f5`, Soft Muted `#b3b3b3`, and Hard Border `#262626`. No route accent is needed. Display type uses the existing self-hosted Veneer face; body text uses the existing Helvetica/Arial system fallback so the holding page makes no Google Fonts request. The existing BlackBox logo and `hero-live-band.jpg` are reused; no generated or stock imagery is added.

CSS grain may be created with restrained pseudo-element gradients. It must not reduce text contrast, animate continuously, or require a texture download.

### Lock concise public copy and real actions

Default copy:

- Kicker: `BLACKBOX RECORDS · ATHENS`
- H1: `THE SITE IS IN THE PRESS.`
- Body: `BlackBox Records is active. We’re building a new home for our artists, releases, distro, and services.`
- Status: `FULL SITE COMING ONLINE SOON.`
- Links: `FOLLOW ON INSTAGRAM` and `EMAIL THE LABEL`

Instagram and email values come from existing repo content at build time. Placeholder `#` values are filtered out. No navigation to unfinished routes, private-preview language, environment names, provider status, countdown, or unapproved date appears.

### Keep interaction static and motion optional

The page has no hydrated component and emits no page-owned JavaScript. Only ordinary `https:` and `mailto:` anchors are interactive. Links receive visible keyboard focus and sufficiently large touch targets.

One CSS entrance sequence may reveal the image field, headline, copy, and links over at most 700ms using opacity and transform. `prefers-reduced-motion: reduce` removes the sequence. There is no looping marquee, pointer-following effect, WebGL, parallax, autoplay media, or animated layout property.

### Treat the apex as canonical only for the holding artifact

The holding document uses `https://blackboxrecordsathens.com/` for canonical, Open Graph URL, and public metadata. It emits `noindex, nofollow` in both HTML and response headers and publishes no sitemap. This prevents the temporary page from competing with the later full site while allowing crawlers to observe the noindex instruction.

After holding activation passes, `www` receives a proxied CNAME to `blackboxrecordsathens.com`; DNS resolution and an edge certificate valid for `www.blackboxrecordsathens.com` must pass before redirect acceptance. Two exact-host Cloudflare Single Redirect rules then own canonicalization:

- apex requests with scheme `http` receive `308` to the same path and query on `https://blackboxrecordsathens.com`;
- every `www.blackboxrecordsathens.com` request receives `308` to the same path and query on the HTTPS apex.

The rules do not match other zone hostnames. The temporary activation guard is removed after these rules and the holding target pass checks. HSTS is not enabled as part of this change; it can be considered after HTTPS and redirects are stable.

The full PRD readiness build keeps `blackbox-records-web.pages.dev` as its canonical origin until the production-go-live change updates every dependent origin together. The holding change must not partially rewrite checkout origins, email brand URLs, catalog image origins, or full-site sitemap metadata.

### Validate the page as a public static surface

Implementation verification includes:

- a focused artifact test for the HTML allowlist, local asset closure, metadata, no scripts, no fake links, and no forbidden final routes;
- `pnpm test:unit`, `pnpm check`, and `pnpm build` against the final tree;
- Browser Use against the branch alias and then the custom domain at phone and desktop sizes, including keyboard focus, reduced motion, 404 behavior, HTTPS, apex/`www` redirects, console, and network cleanliness;
- bounded HTTP checks confirming the apex no longer serves registrar parking and returns the expected noindex/canonical headers.

## Risks / Trade-offs

- **A branch alias is mistaken for a product environment** → Document it as a deployment surface inside PRD and exclude it from UAT, PRD readiness, Promotion Evidence, and launch acceptance.
- **Artifact preparation accidentally publishes final routes** → Use an explicit copy allowlist and fail tests when any unexpected HTML document is present.
- **Copying all `/_astro` assets uploads unused files** → Accept small static duplication; tracing hashed dependencies would add brittle code without improving route isolation.
- **Custom-domain association briefly exposes production `main`** → Install the exact-host temporary `302` guard first, keep it active through CNAME/TLS setup, remove it only after the branch target is confirmed, and re-enable it on the first failed apex check.
- **DNS or certificate activation breaks the apex** → Verify the branch URL first, record parking DNS, require Active TLS, keep the temporary guard ready, and retain exact rollback targets/rules.
- **Temporary metadata leaks into the launched site** → Keep holding metadata inside the isolated artifact and make its retirement a launch checklist item.
- **The holding page becomes permanent** → Assign retirement to `production-go-live-readiness`; remove branch deployment only after the launched site is stable and rollback no longer needs it.
- **The finished static site creates pressure for a soft launch** → Keep cutover mechanically and procedurally blocked until all live Stripe and production-go-live evidence exists and named reviewers record approval.
- **External content values are missing or placeholders** → Filter invalid social entries at build time and fail the build if no real Instagram URL or inquiry email remains.

## Migration Plan

1. Rewrite and move the existing demo, add the artifact preparation script/tests, and add a separate manual-only holding workflow; do not change the shared UAT/PRD workflow, deploy, or change DNS while implementing code.
2. Build locally, run repo gates, and validate the source route and assembled artifact with Browser Use.
3. After explicit approval through `workflow_dispatch` and the protected `prd-holding` environment, deploy `dist-holding` to the existing Pages project's `holding` branch. Verify the branch alias before touching the domain.
4. After separate domain-change approval, snapshot current DNS/rules, install the exact-apex temporary `302` guard to the verified holding alias, and verify the guard before Pages custom-domain association.
5. With the guard active, associate `blackboxrecordsathens.com` with the existing Pages project, replace the Pages-created apex target with the holding branch alias, wait for Active TLS, and confirm the target without removing the guard.
6. Create a proxied `www` CNAME to the apex, verify `www` DNS/TLS, then configure exact-host `308` rules for HTTP apex and `www` canonicalization with path/query preservation. Remove the temporary guard and immediately verify public desktop/mobile behavior, headers, redirects, 404 behavior, target identity, and absence of registrar parking. Re-enable the guard on any failure.
7. For launch, complete and approve the existing `production-go-live-readiness` change first: verify live Stripe Products/Prices, Payment Method Configuration, production webhook, Worker/D1 and catalog/stock readiness, rollback, exact origins, and every other live gate as one reviewed cutover. Do not soft-launch the full site because its static artifact is ready.
8. Deploy and verify the full PRD artifact, then repoint the apex from the holding branch alias to the production `main` Pages target. Keep the holding branch available as the immediate static rollback.
9. After the launched site is stable, remove the holding deployment job, source route, artifact script, temporary branch deployment, and obsolete redirect rules in one cleanup change.

Rollback during activation: re-enable the temporary exact-apex `302` guard, restore the recorded parking DNS/redirect rules and prior `www` state if Pages activation never succeeded, and leave the custom domain detached if it never reached Active TLS. Rollback after launch: repoint the apex to the already-verified holding branch alias while retaining the verified `www` CNAME and exact-host HTTPS/`www` rules; do not detach the domain or improvise a new project during an incident.

## Open Questions

None required for implementation. The canonical hostname is `blackboxrecordsathens.com`, the apex is primary, `www` redirects to it, and the existing Pages project with a named holding branch is the selected topology.
