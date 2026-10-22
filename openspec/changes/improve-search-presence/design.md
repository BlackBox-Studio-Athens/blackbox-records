# Design

## Who implements what

`[Claude]` tasks contain UI work and are implemented by Claude. `[Claude or Codex]` tasks have no UI. `[Owner]` tasks need the owner's Google sign-in or profile access. Structured data and head tags are not visible UI, so no task here is `[Claude]` only.

## Priorities

1. **Before switch day** (section 1): sitemap completeness and index exclusions. These decide what Google sees first and are small.
2. **Store Item `Product` data** (section 2): the only markup with a visible result (price and stock in results, free Shopping listings).
3. **`WebSite` and music entities** (section 3): no rich result, but they help Google name the site and connect releases, artists and the label.
4. **Owner work** (section 4): off-site signals usually matter more than markup for a new domain.

The October 22 extension includes factual Breadcrumb and Article markup without new visible breadcrumbs or copy. `hreflang` (the site is English only), FAQ markup and visible keyword copy changes remain out of scope. Markup eligibility is not a ranking guarantee.

## Sitemap and exclusions

`sitemap.xml.ts` adds `/store/<slug>/` for every Store Item from `listStoreItems()`, the same source as the Store Item static paths, so the sitemap cannot drift from the built pages. `lastmod` is added only if task 1.2 finds a reliable per-entry change time in the accepted snapshot; Google ignores dates it finds inaccurate, so a guessed date is worse than none.

`/store/checkout/` gets `robots="noindex"` like the per-item checkout and return pages. `_headers` adds `X-Robots-Tag: noindex` for `/app-shell-overlay/*`. `robots.txt` is not used for this, because a disallowed URL cannot show crawlers its `noindex`. Task 1.4 checks the remaining non-content outputs, such as `preorder-showcase.json`, demo routes and legacy redirect pages.

A source test asserts that every Store Item path is in the sitemap. A build-output check over the Local production fixture asserts that each sitemap URL exists, has no `noindex` and is canonical to itself.

## Store Item `Product` data

The Store Item price and availability are read in the browser by `StoreOfferPriceDisplay` from the Worker, so the prerendered HTML has no price. Writing a price at build time would go stale when staff change prices. Instead, the component writes one `application/ld+json` script after its offer read succeeds, using the same values it displays. Google renders JavaScript and accepts generated structured data. Bing may not, which is an accepted limit.

- `Product`: `name`, `image` (the Store Item image's absolute URL), `description` (the page description), `brand` (`BlackBox Records` for label releases, the distro label otherwise). Optional `sku` is omitted: internal variant IDs are not merchant SKUs, and long IDs triggered Google's length warning. No identifier is shortened, fabricated or changed in commerce data.
- `Offer`: `price`, `priceCurrency` `EUR`, `url`, and `availability`:
  - `InStock` when buyable
  - `PreOrder`, omitting `availabilityStarts` unless a verified date for availability of that physical offer exists. Album/digital release dates and month-only shipping estimates are not physical availability dates.
- No script when the page shows no price or the offer read fails, so markup never disagrees with the page. The Worker returns no price for any offer that is not ready (sold out, Coming soon, Repressing, unavailable, catalog drift), and a pay-what-you-want price shows no amount, so these publish nothing. An `OutOfStock` offer would need a price the page does not show.

Search Console offers no shipping and returns settings for the verified property (task 4.1). The Organization fallback (task 3.4) therefore publishes `hasMerchantReturnPolicy` and `hasShippingService`, rather than repeating policies per item. The Greece-only 14-day mail-return policy distinguishes buyer-paid change-of-mind returns from free defect returns and links to the absolute `/terms/` URL for the sealed-recording exception. BOX NOW collection-point shipping uses one `ShippingConditions` per shared `deliveryQuantityBands` band, with item-count bounds and EUR charges. No handling or transit speed is asserted because the published terms provide none. Google's [shipping-policy documentation](https://developers.google.com/search/docs/appearance/structured-data/shipping-policy) supports `FulfillmentTypeCollectionPoint` for customer pickup.

## `WebSite` and music entities

All of these are server-rendered from accepted content.

- **Home:** `WebSite` with the label name from site settings (the same name as `Organization`) and `url`, so Google can show the site name instead of the domain.
- **Release pages:** `MusicAlbum` with:
  - `name`, `byArtist` (`MusicGroup` with its artist page URL), `datePublished`
  - `image`, `albumRelease` (`MusicRelease` with `recordLabel` naming the label), `albumReleaseType` where the content says it
  - `track` from the tracklist when present
- **Artist pages:** `MusicGroup` with `name`, `url`, `image`, `genre` and `sameAs` from the artist's links.

One helper module in `apps/web` builds these objects, and each page passes its own data. `SiteLayout.astro` passes the existing Organization facts to `createOrganizationStructuredData` and emits them through `serializeStructuredData`, which escapes `<` in inline JSON.

`recordLabel` belongs on `MusicRelease`, not directly on `MusicAlbum` ([Schema.org](https://schema.org/recordLabel)). The nested release preserves the label credit without asserting an unsupported album property. Ratings, reviews, shipping and returns are not invented to silence optional validator warnings.

## Validation

### October 22 ownership and integration

Use the existing audit evidence to reproduce defects before editing. SOL lane A exclusively owns `platform/config/site.ts`, public-gateway URL handling and their tests, plus non-visual head synchronization in `shell-page-snapshot.ts` and its tests. SOL lane B owns `SiteLayout.astro`, structured-data builders/tests, metadata props on public page templates, factual Article/Breadcrumb entities, and the narrowly scoped published-link correction preparation. Lane B must not edit `site.ts`; put metadata defaults in its owned existing layout/page paths or a focused metadata helper. Neither SOL lane edits CSS, visual JSX, interaction/focus behavior or UI-focused tests. The coordinator alone edits this change's shared planning and validation records.

Claude owns appearance-preserving performance and UI fixes and UI tests, with `claude-handoff.md` as the handoff. Shared files such as SiteLayout/page templates require a coordinator handoff after SOL lane B finishes; no concurrent writers. Graph refresh, global local validation and browser acceptance are serialized by the coordinator. Delegates run only their focused checks and return exact evidence/source identity without commits, pushes, deployments or content publication.

Canonical normalization applies to known public document routes and preserves query strings and the application base path. It must not redirect assets, media, API, overlay fragments, unknown paths or private routes into indexable documents. Existing robots/noindex rules, commerce authority and player continuity are unchanged.

Head synchronization removes/replaces route-owned social/entity tags without cloning stale route data or disrupting runtime Product scripts. Metadata uses only current accepted artist, item, format and location facts; browser/search titles may change, rendered body/H1 text must not. Stable entity IDs are production-canonical, and Article dates/authors or Breadcrumb labels must come from real published content/hierarchy. Related studio profiles are not treated as the same label entity without evidence.

The two old Cloudflare Pages anchors are corrected through their authoritative content owner. Image transform source URLs are deliberately excluded. No mass image fetch or new transformation profile is permitted while the observed 5,000/5,000 monthly limit is exhausted. Off-site identity links, secondary-domain DNS, Google Business Profile eligibility and provider removals are reviewed separately; missing owner facts or access remain explicit gates.

Completion requires focused tests, strict OpenSpec validation, `pnpm validate` under the feedback policy, equivalent rendered appearance/player behavior, and live HTTP/Google checks after separately authorized promotion. Record independent search outcome checks without attributing ranking gains to code alone.

Focused unit tests cover the helper and the `Offer` mapping, including no script on failure or Coming soon. Rich Results Test and Schema Markup Validator checks of one item per availability state, one release and one artist run after promotion (hosted, read-only).
