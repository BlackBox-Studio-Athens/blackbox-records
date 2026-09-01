# Activation Evidence

## Approval

- The owner's 2026-07-11 request explicitly approves using `blackboxrecordsathens.com` for the PRD Holding Page with HTTPS.
- The owner's 2026-09-01 instruction explicitly approves completing the Cloudflare configuration through the signed-in Chrome extension where Wrangler cannot perform the change.
- The approved hostname is `blackboxrecordsathens.com`. The misspelling `blakboxrecordsathens.com` is out of scope.

## Pre-change snapshot — 2026-07-11

- Authoritative nameservers: `eva.ns.cloudflare.com`, `sevki.ns.cloudflare.com`.
- Apex DNS resolved through Cloudflare's proxy; the underlying registrar-parking record is retained out of band for rollback.
- `www` had no public A, AAAA, or CNAME record.
- The Pages project had only its default `blackbox-records-web.pages.dev` domain.
- `http://blackboxrecordsathens.com/` returned a Cloudflare-served registrar parking page with title `Parking Page`.
- Apex HTTPS did not complete successfully.
- HTTP and HTTPS requests to `www.blackboxrecordsathens.com` did not complete successfully.
- No credentials, provider record identifiers, account identifiers, or tokens are recorded here.

## Verified holding deployment — 2026-07-11

- Protected workflow run: <https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/29125156988>.
- `https://holding.blackbox-records-web.pages.dev/` served the plain `UNDER CONSTRUCTION.` page with one logo, no landing image, no scripts, no forms, canonical apex metadata, and `noindex` directives.
- Desktop and 390 px Browser Use checks passed without horizontal overflow or console errors.
- A guessed final route returned the isolated holding fallback rather than a full-site page.

## Activation result

- The owner associated `blackboxrecordsathens.com` with the existing `blackbox-records-web` Pages project and changed the proxied apex target to `holding.blackbox-records-web.pages.dev`.
- The authenticated Pages API reported the custom domain and HTTP validation as `active`.
- Browser Use loaded `https://blackboxrecordsathens.com/` over HTTPS with the `UNDER CONSTRUCTION.` holding document, canonical apex metadata, `noindex, nofollow`, one logo, no form, and no console errors.
- The full Pages production `main` site did not appear on the apex.
- `www` DNS/TLS and exact-host canonical redirects were completed on 2026-09-01 as recorded below.

## Public contact correction — 2026-07-11

- Shared public content now resolves Instagram to `https://www.instagram.com/blackboxrecordsath/` and inquiries to `info@blackboxrecordsathens.com`.
- Backend order-operations routing remains unchanged.
- The assembled holding artifact passed exact destination checks and Browser Use at desktop and 390 px widths with two 18 px SVG icons, 44 px actions, no horizontal overflow, and no console errors.

## Closure deployment — 2026-09-01

- The final clean deployment used protected workflow run <https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/33521213349> from exact `main` source SHA `50b3ecbae6618cf96b7a9a620fa290973f03a00a`.
- The workflow concluded `success`; its credential-free build/artifact job and protected Pages deploy job both completed successfully without an approval prompt.
- Before dispatch, `pnpm openspec:guard`, `pnpm test:unit`, `pnpm check`, `pnpm build`, and strict change validation passed on the accepted source tree.

## Pre-mutation rollback snapshot — 2026-09-01

- The proxied, Auto-TTL apex CNAME already targeted `holding.blackbox-records-web.pages.dev`; it was not changed during this closure.
- No `www` DNS record existed, and the Redirect Rules table contained no Single Redirect rules.
- Existing MX, TXT, DKIM, DMARC, SPF, and other mail records were left unchanged.
- HTTPS apex returned `200` with the holding page, `Cache-Control: no-transform`, canonical apex metadata, and `noindex, nofollow`; HTTP apex returned its prior `301` to the equivalent HTTPS path/query.
- Rollback scope was therefore limited to deleting the new `www` CNAME and two new redirect rules. The apex target would be restored only if altered; no restoration was needed.

## Public domain closure — 2026-09-01

- Added proxied, Auto-TTL CNAME `www` to `blackboxrecordsathens.com`. Public DNS-over-HTTPS resolved `www` to Cloudflare edge addresses, and an HTTPS probe completed valid TLS before origin routing.
- Added active Single Redirect `PRD holding: www to HTTPS apex` matching only `(http.host eq "www.blackboxrecordsathens.com")`, targeting `concat("https://blackboxrecordsathens.com", http.request.uri.path)`, using `308`, and preserving the query string.
- Added active Single Redirect `PRD holding: HTTP apex to HTTPS apex` matching only `(http.host eq "blackboxrecordsathens.com" and not ssl)`, with the same dynamic target, `308`, and query preservation. Cloudflare's parser rejects `http.request.scheme`; `not ssl` is its valid HTTP-only equivalent.
- HSTS and zone-wide HTTPS redirects were not enabled. The apex CNAME and all mail records remained unchanged.
- Exact HTTP matrix passed:
  - HTTPS apex `/` returned `200` with `UNDER CONSTRUCTION.`, canonical `https://blackboxrecordsathens.com/`, and both HTML and response-header `noindex, nofollow` directives.
  - HTTP apex `/plan-probe?source=codex` returned one `308` to the identical HTTPS apex path/query.
  - HTTP and HTTPS `www` `/plan-probe?source=codex` each returned one `308` to the identical HTTPS apex path/query.
  - HTTPS apex `/not-a-real-route/?source=codex` returned the isolated holding fallback with `404`, not the full site or a commerce route.
- Browser Use passed at desktop and the 390 px profile: expected copy and actions rendered, the email action remained `mailto:info@blackboxrecordsathens.com`, the only bitmap was the existing BlackBox logo, no landing/decorative image appeared, no horizontal overflow occurred, loaded image/styles were healthy, and warning/error console logs were empty.
- Final handoff gates passed on the exact documentation/evidence tree: `pnpm test:unit`, `pnpm check`, and `pnpm build` completed successfully; the build produced 350 pages. The post-gate hosted matrix repeated the apex `200`, all three exact `308` redirects, holding-only `404`, noindex headers, 390 px rendering, and empty warning/error console results.
- No registrar parking or Pages production `main` content appeared. No credentials, secret values, provider record identifiers, or account identifiers are recorded in this evidence.
