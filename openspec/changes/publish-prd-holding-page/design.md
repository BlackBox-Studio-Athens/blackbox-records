## Context

As of 2026-07-11, Cloudflare contains one Pages project, `blackbox-records-web`, whose production `main` deployment serves the full disabled PRD readiness site at `https://blackbox-records-web.pages.dev/`. UAT independently serves the same visible site from GitHub Pages. The verified PRD Holding Page is deployed at `https://holding.blackbox-records-web.pages.dev/`, and the active custom apex `https://blackboxrecordsathens.com/` serves that holding target with valid TLS. The misspelled `blakboxrecordsathens.com` is never used.

The repo now contains the production-owned source route at `apps/web/src/pages/prd-holding/index.astro`, a strict holding artifact builder/checker, and a protected manual branch deployment. The first deployed composition proved the delivery path. On 2026-07-11, the owner approved use of `blackboxrecordsathens.com` for this holding surface and requested a plainer under-construction treatment without the live-performance landing image.

This is a plain availability notice, not a campaign landing page. A visitor opening the label link needs immediate proof that BlackBox is active and reachable. Voice: **direct, quiet, working**. `PRODUCT.md`, `DESIGN.md`, and the current site remain authoritative; external visual references and imagery are unnecessary for this surface.

## Goals / Non-Goals

**Goals:**

- Put a deliberate, original BlackBox presence on the correct HTTPS apex without changing the UAT review site.
- Preserve the full `pages.dev` PRD readiness deployment for catalog assets and future launch checks.
- Use one static page, the existing logo, existing typography, and no landing image or client runtime.
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

Cloudflare warns that redirect rules can block Pages HTTP domain validation, so activation does not place a redirect guard in front of certificate issuance. The operator snapshots the existing parking record, associates the apex with the Pages project, and immediately changes the Pages-created proxied CNAME from production `main` to the already-verified `holding` branch alias before accepting activation. The operation stops and restores the recorded parking state if the branch target cannot be applied or if any bounded check exposes the full site.

If Cloudflare cannot activate the apex against the named branch alias through this staged association, implementation stops. A separate-project fallback requires a new decision; it is not silently created.

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

An artifact test enumerates emitted HTML and fails unless only `index.html` and `404.html` exist. The preparation script traces the holding HTML and CSS asset references under `/_astro`, copies only that recursive closure, and fails on missing files. The artifact check independently rejects missing and unreferenced assets so unrelated full-site bundles and media cannot leak into the holding deployment.

The existing demo is moved to `apps/web/src/pages/prd-holding/index.astro` and rewritten in place rather than creating another UI stack. The source route remains unlinked and noindex in normal UAT/PRD builds; only the allowlisted artifact promotes it to `/`.

### Use a plain under-construction composition

The page uses one restrained typographic field rather than a landing-page composition:

- the existing BlackBox logo, label/Athens kicker, `UNDER CONSTRUCTION.` headline, one short explanation, one active-status line, and the existing Instagram/email links;
- a single-column reading order on desktop and mobile, with generous but ordinary spacing and no split-screen treatment;
- no live-performance image, hero image, background image, decorative image, card grid, glass panel, gradient text, construction icon, hazard tape, registration marks, or simulated print effects.

The layout supports 320px through wide desktop without horizontal overflow and keeps the complete message and actions understandable at every viewport. Color comes directly from `DESIGN.md`: Void Background `#0d0d0d`, Ink Foreground `#f5f5f5`, Soft Muted `#b3b3b3`, and Hard Border `#262626`. Display type uses the existing self-hosted Veneer face; body text uses the existing Helvetica/Arial system fallback. No Google Fonts, generated imagery, stock imagery, or new asset is added.

### Lock concise public copy and real actions

Default copy:

- Kicker: `BLACKBOX RECORDS · ATHENS`
- H1: `UNDER CONSTRUCTION.`
- Body: `We’re building a new home for our artists, releases, distro, and services.`
- Status: `BLACKBOX RECORDS IS ACTIVE.`
- Links: `FOLLOW ON INSTAGRAM` and `EMAIL THE LABEL`

Instagram and email values come from existing repo content at build time. The canonical public destinations are `https://www.instagram.com/blackboxrecordsath/` and `info@blackboxrecordsathens.com`; backend order-operations routing remains separate. Placeholder `#` values are filtered out. No navigation to unfinished routes, private-preview language, environment names, provider status, countdown, or unapproved date appears.

### Keep interaction static and motion optional

The page has no hydrated component and emits no page-owned JavaScript. Only ordinary `https:` and `mailto:` anchors are interactive. The holding response sends `Cache-Control: no-transform` so Cloudflare does not replace the email action with its JavaScript-dependent Email Address Obfuscation route. Links receive visible keyboard focus and sufficiently large touch targets.

One CSS entrance sequence may reveal the headline, copy, and links over at most 400ms using opacity and transform. `prefers-reduced-motion: reduce` removes the sequence. Static rendering is acceptable and preferred if motion adds no clarity. There is no looping marquee, pointer-following effect, WebGL, parallax, autoplay media, or animated layout property.

### Treat the apex as canonical only for the holding artifact

The holding document uses `https://blackboxrecordsathens.com/` for canonical, Open Graph URL, and public metadata. It emits `noindex, nofollow` in both HTML and response headers and publishes no sitemap. This prevents the temporary page from competing with the later full site while allowing crawlers to observe the noindex instruction.

After holding activation passes, `www` receives a proxied CNAME to `blackboxrecordsathens.com`; DNS resolution and an edge certificate valid for `www.blackboxrecordsathens.com` must pass before redirect acceptance. Two exact-host Cloudflare Single Redirect rules then own canonicalization:

- apex requests with scheme `http` receive `308` to the same path and query on `https://blackboxrecordsathens.com`;
- every `www.blackboxrecordsathens.com` request receives `308` to the same path and query on the HTTPS apex.

The rules do not match other zone hostnames. HSTS is not enabled as part of this change; it can be considered after HTTPS and redirects are stable.

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
- **Hashed asset tracing misses a generated dependency** → Resolve the holding HTML and CSS reference closure recursively, fail on missing files, and keep the independent artifact check strict about unreferenced output.
- **Custom-domain association briefly exposes production `main`** → Snapshot parking DNS, perform association and the holding-branch CNAME change as one staged operation, probe immediately, and restore parking state on the first wrong-target response.
- **DNS or certificate activation breaks the apex** → Verify the branch URL first, record parking DNS, require Active TLS, and retain exact rollback targets/rules.
- **Temporary metadata leaks into the launched site** → Keep holding metadata inside the isolated artifact and make its retirement a launch checklist item.
- **The holding page becomes permanent** → Assign retirement to `production-go-live-readiness`; remove branch deployment only after the launched site is stable and rollback no longer needs it.
- **The finished static site creates pressure for a soft launch** → Keep cutover mechanically and procedurally blocked until all live Stripe and production-go-live evidence exists and named reviewers record approval.
- **External content values are missing or placeholders** → Filter invalid social entries at build time and fail the build if no real Instagram URL or inquiry email remains.

## Migration Plan

1. Simplify the existing PRD Holding Page to the plain logo-and-type composition, remove the landing image and its emitted assets, and keep the existing artifact/workflow isolation.
2. Build locally, run repo gates, validate the source route and assembled artifact with Browser Use, then redeploy and verify the `holding` branch through the protected workflow.
3. Treat the owner's 2026-07-11 request to use `blackboxrecordsathens.com` as explicit domain-change approval and snapshot current DNS/rules before Pages custom-domain association.
4. Associate `blackboxrecordsathens.com` with the existing Pages project and immediately replace the Pages-created apex target with the holding branch alias. Wait for Active TLS, confirm the target, and restore the recorded parking state if the branch target cannot be applied or the full site appears.
5. Create a proxied `www` CNAME to the apex, verify `www` DNS/TLS, then configure exact-host `308` rules for HTTP apex and `www` canonicalization with path/query preservation. Immediately verify public desktop/mobile behavior, headers, redirects, 404 behavior, target identity, and absence of registrar parking.
6. For launch, complete and approve the existing `production-go-live-readiness` change first: verify live Stripe Products/Prices, Payment Method Configuration, production webhook, Worker/D1 and catalog/stock readiness, rollback, exact origins, and every other live gate as one reviewed cutover. Do not soft-launch the full site because its static artifact is ready.
7. Deploy and verify the full PRD artifact, then repoint the apex from the holding branch alias to the production `main` Pages target. Keep the holding branch available as the immediate static rollback.
8. After the launched site is stable, remove the holding deployment job, source route, artifact script, temporary branch deployment, and obsolete redirect rules in one cleanup change.

Rollback during activation: restore the recorded parking DNS/redirect rules and prior `www` state if Pages activation never succeeded, and leave the custom domain detached if it never reached Active TLS. Rollback after launch: repoint the apex to the already-verified holding branch alias while retaining the verified `www` CNAME and exact-host HTTPS/`www` rules; do not detach the domain or improvise a new project during an incident.

## Open Questions

None required for implementation. The canonical hostname is `blackboxrecordsathens.com`, the apex is primary, `www` redirects to it, and the existing Pages project with a named holding branch is the selected topology.
