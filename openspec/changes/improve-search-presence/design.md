# Design

## Who implements what

`[Claude]` tasks contain UI work and are implemented by Claude. `[Claude or Codex]` tasks have no UI. `[Owner]` tasks need the owner's Google sign-in or profile access. Structured data and head tags are not visible UI, so no task here is `[Claude]` only.

## Priorities

1. **Before switch day** (section 1): sitemap completeness and index exclusions. These decide what Google sees first and are small.
2. **Store Item `Product` data** (section 2): the only markup with a visible result (price and stock in results, free Shopping listings).
3. **`WebSite` and music entities** (section 3): no rich result, but they help Google name the site and connect releases, artists and the label.
4. **Owner work** (section 4): off-site signals usually matter more than markup for a new domain.

Breadcrumb markup, `hreflang` (the site is English only), FAQ markup and keyword copy changes are left out. Google barely shows breadcrumbs on phones, and the rest have no clear return here.

## Sitemap and exclusions

`sitemap.xml.ts` adds `/store/<slug>/` for every Store Item from `listStoreItems()`, the same source as the Store Item static paths, so the sitemap cannot drift from the built pages. `lastmod` is added only if task 1.2 finds a reliable per-entry change time in the accepted snapshot; Google ignores dates it finds inaccurate, so a guessed date is worse than none.

`/store/checkout/` gets `robots="noindex"` like the per-item checkout and return pages. `_headers` adds `X-Robots-Tag: noindex` for `/app-shell-overlay/*`. `robots.txt` is not used for this, because a disallowed URL cannot show crawlers its `noindex`. Task 1.4 checks the remaining non-content outputs, such as `preorder-showcase.json`, demo routes and legacy redirect pages.

A source test asserts that every Store Item path is in the sitemap. A build-output check over the Local production fixture asserts that each sitemap URL exists, has no `noindex` and is canonical to itself.

## Store Item `Product` data

The Store Item price and availability are read in the browser by `StoreOfferPriceDisplay` from the Worker, so the prerendered HTML has no price. Writing a price at build time would go stale when staff change prices. Instead, the component writes one `application/ld+json` script after its offer read succeeds, using the same values it displays. Google renders JavaScript and accepts generated structured data. Bing may not, which is an accepted limit.

- `Product`: `name`, `image` (the Store Item image's absolute URL), `description` (the page description), `brand` (`BlackBox Records` for label releases, the distro label otherwise). Optional `sku` is omitted: internal variant IDs are not merchant SKUs, and long IDs triggered Google's length warning. No identifier is shortened, fabricated or changed in commerce data.
- `Offer`: `price`, `priceCurrency` `EUR`, `url`, and `availability`:
  - `InStock` when buyable
  - `PreOrder` with `availabilityStarts` set to the release date for pre-orders
- No script when the page shows no price or the offer read fails, so markup never disagrees with the page. The Worker returns no price for any offer that is not ready (sold out, Coming soon, Repressing, unavailable, catalog drift), and a pay-what-you-want price shows no amount, so these publish nothing. An `OutOfStock` offer would need a price the page does not show.

Shipping (Greece only) and the 14-day withdrawal policy are set once in Search Console's shipping and returns settings (task 4.1) rather than repeated per item. If Search Console does not offer those settings for this property, `hasMerchantReturnPolicy` and `shippingDetails` move to the `Organization` data.

## `WebSite` and music entities

All of these are server-rendered from accepted content.

- **Home:** `WebSite` with the label name from site settings (the same name as `Organization`) and `url`, so Google can show the site name instead of the domain.
- **Release pages:** `MusicAlbum` with:
  - `name`, `byArtist` (`MusicGroup` with its artist page URL), `datePublished`
  - `image`, `albumRelease` (`MusicRelease` with `recordLabel` naming the label), `albumReleaseType` where the content says it
  - `track` from the tracklist when present
- **Artist pages:** `MusicGroup` with `name`, `url`, `image`, `genre` and `sameAs` from the artist's links.

One helper module in `apps/web` builds these objects, and each page passes its own data. `Organization` stays in `SiteLayout.astro`.

`recordLabel` belongs on `MusicRelease`, not directly on `MusicAlbum` ([Schema.org](https://schema.org/recordLabel)). The nested release preserves the label credit without asserting an unsupported album property. Ratings, reviews, shipping and returns are not invented to silence optional validator warnings.

## Validation

Focused unit tests cover the helper and the `Offer` mapping, including no script on failure or Coming soon. Rich Results Test and Schema Markup Validator checks of one item per availability state, one release and one artist run after promotion (hosted, read-only).
