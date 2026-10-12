# Tasks

Tags: `[Claude]` contains UI work; `[Claude or Codex]` has none; `[Owner]` needs the owner's Google sign-in or profile access. No task here changes visible UI.

## 1. Before switch day: sitemap and exclusions

- [x] 1.1 [Claude or Codex] Add every Store Item path to `sitemap.xml.ts` from `listStoreItems()`; extend `_sitemap-output.test.ts`.
- [x] 1.2 [Claude or Codex] Check whether the accepted snapshot has a reliable per-entry change time; add `lastmod` only if it does, otherwise record why it is omitted.
  - Omitted: snapshot records carry `collection`, `id`, `revisionId`, `slug` and `data` only, with no change time.
- [x] 1.3 [Claude or Codex] Mark `/store/checkout/` `noindex`; add `X-Robots-Tag: noindex` for `/app-shell-overlay/*` in `_headers` within the static cache-policy limits.
  - The cart return page is also `noindex`. Hosted HTML comes from the renderer Worker, which `_headers` does not reach, so the overlay pages also set the header on their response.
- [x] 1.4 [Claude or Codex] Check the other non-content outputs (`preorder-showcase.json`, demo routes, legacy redirect pages, 404) and mark or exclude any that can be indexed.
  - 404 is now `noindex`, since a direct request for its document can return 200. JSON outputs are not indexed as pages; demo routes exist only under `astro dev` and are `noindex`; `/shop/` and `/distro/` redirect instantly with a canonical to their target; the holding page is already `noindex`.
- [x] 1.5 [Claude or Codex] Add a build-output check over the Local production fixture: every sitemap URL exists, is not `noindex` and is canonical to itself.
  - `apps/web/scripts/check-sitemap.ts` runs at the end of the web build (`pnpm sitemap:check`); a fresh build listed 121 URLs and passed.

## 2. Store Item `Product` data

- [x] 2.1 [Claude or Codex] Add a structured-data helper in `apps/web` for `Product` and `Offer`, with the availability mapping from the design; unit-test every state, including Coming soon and a failed read producing nothing.
  - `apps/web/src/platform/lib/structured-data.ts`. Every non-ready offer, sold out included, carries no price from the Worker, so it publishes nothing (see design).
- [x] 2.2 [Claude or Codex] Write the `Product` script from `StoreOfferPriceDisplay` after a successful offer read, replacing it if the offer changes; keep exactly one script per page and none on failure.
  - Only the Store Item page passes product facts. The helper loads lazily to keep the Store Item eager bundle within budget; `e2e/store-item-preorders.spec.ts` asserts one `PreOrder` `Product`.

## 3. Site and music entities

- [x] 3.1 [Claude or Codex] Add `WebSite` data to Home.
- [x] 3.2 [Claude or Codex] Add `MusicAlbum` data to release pages and `MusicGroup` data to artist pages through the same helper; unit-test with and without tracklist, artist and links.
  - Content has no release type field, so `albumReleaseType` is omitted.

## 4. Owner

- [ ] 4.1 [Owner] After `add-site-analytics` 1.1, set Greece-only shipping and the 14-day return policy in Search Console's shipping and returns settings. If they are not offered, tell Claude or Codex to add them to the `Organization` data instead.
- [ ] 4.2 [Owner] Create a Google Business Profile for BlackBox Records with the site URL and the public Athens location details you choose to show.
- [ ] 4.3 [Owner] Point the website link on Bandcamp, Instagram, Facebook, Discogs and Spotify for Artists to the apex, and ask each label artist to link the label or their release page.
- [ ] 4.4 [Owner] Optional, after 5.2 passes: enable Merchant Center free listings from the site's structured data.
- [ ] 4.5 [Owner] Monthly from launch: check Search Console Pages, Product snippets and Merchant listings reports, and Core Web Vitals; send problems to Claude or Codex.

## 5. Acceptance

- [x] 5.1 [Claude or Codex] Run focused tests, strict OpenSpec validation and `pnpm validate`; record evidence.
  - [Validation note](validation.md).
- [ ] 5.2 [Claude or Codex] After promotion (on `pages.dev` before switch day, on the apex after): run Rich Results Test and Schema Markup Validator on one in-stock and one pre-order item, one sold-out item (expect no `Product` data), one release, one artist and Home; record results.
  - PRD release `be69cd6e` / run 565: both validators checked the in-stock item, release, artist and Home. The live listing has no pre-order or sold-out item; the release also has a non-error MusicAlbum `recordLabel` warning. Full matrix and screenshots are in [validation.md](validation.md#task-52-external-schema-validators); this task remains unchecked.
- [ ] 5.3 [Claude or Codex] After switch day, confirm in Search Console that the submitted sitemap's URL count matches the generated sitemap; archive this change.
