# Activation Evidence

## Approval

- The owner's 2026-07-11 request explicitly approves using `blackboxrecordsathens.com` for the PRD Holding Page with HTTPS.
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
- `www` DNS/TLS and exact-host canonical redirects remain pending under tasks 7.4–7.5.

## Public contact correction — 2026-07-11

- Shared public content now resolves Instagram to `https://www.instagram.com/blackboxrecordsath/` and inquiries to `info@blackboxrecordsathens.com`.
- Backend order-operations routing remains unchanged.
- The assembled holding artifact passed exact destination checks and Browser Use at desktop and 390 px widths with two 18 px SVG icons, 44 px actions, no horizontal overflow, and no console errors.
