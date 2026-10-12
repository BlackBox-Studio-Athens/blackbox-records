# Proposal

## Why

The site already has unique titles, descriptions, canonical and Open Graph tags, a sitemap, `robots.txt` and `Organization` data, and switch day handles cutover, redirects and indexing requests. Four gaps remain that limit what search engines index and show:

- Store Item pages, the pages that sell, are missing from `sitemap.xml`. The submitted sitemap should be complete on switch day.
- The cart checkout page (`/store/checkout/`) and the shell's HTML fragments (`/app-shell-overlay/*`) can be indexed as thin or duplicate pages.
- Structured data stops at `Organization`. Store Items carry no price or availability for Google results or free Shopping listings, releases and artists carry no music entities, and Home declares no site name.
- Off-site signals (Google Business Profile, profile links) and a routine for reading Search Console have no owner.

## What Changes

- **Before switch day:**
  - add every Store Item to the sitemap
  - mark the cart checkout page and shell fragments `noindex`
  - add a check that every sitemap URL is indexable and canonical to itself
- **Structured data:**
  - `WebSite` on Home for the site name
  - `Product` with `Offer` on Store Items, written after the page's existing offer read so price and availability match what the shopper sees
  - `MusicAlbum` on releases
  - `MusicGroup` on artists
- **Owner:**
  - set shipping and return policies in Search Console instead of per-item markup
  - create a Google Business Profile
  - link the site from label and artist profiles
  - optionally enable Merchant Center free listings
  - read Search Console monthly

## Capabilities

### New Capabilities

- `search-presence`: sitemap completeness, index exclusions, structured data and the owner's search routine.

## Impact

`sitemap.xml.ts`, `_headers`, the cart checkout page, `SiteLayout.astro`, the Store Item, release and artist pages, `StoreOfferPriceDisplay` and focused tests. No visible UI, content, data, API or dependency changes. Cloudflare stays on Free. Depends on `add-site-analytics` 1.1 for the verified Search Console property.
