# Search presence acceptance

Work is on canonical main in `C:/Users/SVall/WebstormProjects/blackbox-records`, uncommitted above `8d4796413e2e135934cfc9a3037d1505e3f49f24`. The OpenSpec guard passed before edits. Product Environment: Local only.

## Acceptance rows

- **Shell/player/routing:** applies to the Store Item price display and overlay fragment headers. `e2e/store-item-preorders.spec.ts` passed 7 tests on `chromium-desktop` and `chromium-mobile`; each asserts exactly one `Product` with a `PreOrder` offer of `28.00` `EUR` and `availabilityStarts` from the release date. Navigation, overlays and the player are unchanged.
- **Boundaries/tooling:** `web-platform` exports the new `lib/structured-data.ts`; boundary lint passed in `pnpm validate`.
- **CMS/publication, commerce, release:** not applicable. No content, schema, Worker, price or stock change.

## Repository checks

- Focused tests: `check-sitemap`, `check-static-cache-policy`, `_sitemap-output`, `structured-data` and `StoreOfferPriceDisplay` passed (43 tests).
- `pnpm build:web` passed every post-build check, including the Store Item eager bundle budget and the new `pnpm sitemap:check`: 121 sitemap URLs, each built, without `noindex` and canonical to itself. The first build exceeded the Store Item budget by 86 bytes; the helper now loads lazily.
- Built output: Home has `Organization` and `WebSite`; release pages `MusicAlbum`; artist pages `MusicGroup`; every referenced image exists in `dist`. Cart checkout, cart return and 404 carry `noindex`; `_headers` sets `X-Robots-Tag: noindex` on `/app-shell-overlay/*`.
- `pnpm openspec -- validate improve-search-presence --type change --strict` passed.
- `pnpm validate` passed, `mode: local`: `.codex-artifacts/validation/2026-10-12T13-16-02-645Z-12240-0d453b/summary.json`, matching before/after fingerprint `c0c2f0f0875fcf0220b83934469497f4f64bff074dec8558ab32fb6462cb9cea`.

## Unverified

- The hosted renderer's overlay `X-Robots-Tag` response header: set by the overlay pages in SSR, observed only after promotion.
- Local release content has no tracklists, so track output is covered by unit tests only.
- Rich Results Test, Schema Markup Validator and Search Console checks (tasks 5.2 and 5.3) need a promoted site.
