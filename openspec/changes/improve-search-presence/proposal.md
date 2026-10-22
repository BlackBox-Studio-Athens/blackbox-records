# Proposal

## Audit implementation extension — 2026-10-22

The original sitemap, exclusion and entity implementation is retained below as delivery history. The October 22 audit verified 122 indexable sitemap URLs and Google-rendered Product markup; those are no longer missing. The user now authorizes implementation of all actionable audit items, with no visible site changes ideally, delegated to GPT-6.1 SOL high for non-UI behavior and Claude for UI behavior. The coordinator owns review and acceptance.

The extension consolidates document URL variants, corrects physical-offer dates and Organization country codes, makes search metadata distinctive using existing facts, synchronizes client-navigation head metadata, adds factual entity references/Article/Breadcrumb data, and corrects two obsolete article link destinations. Claude owns measured CSS delivery, interaction and layout-shift improvements while preserving the existing appearance. Off-site/profile, legacy-removal and provider-dependent items retain separate acceptance and cannot be declared complete by a local code change. No new outreach, paid services, public business-location choice or production promotion is implied.

Audit evidence: `.codex-artifacts/seo-20261022/extended/report.md`. Current starting release is 626 (`d4d98b40241c1a74b59a067eef9be842f57cb7ac`); performance numbers in that report are release 624 and require a fresh baseline before performance implementation.

## Original scope and delivered rationale

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

### Modified Capabilities

- `frontend-runtime-performance`: responsive measured Store card intrinsic-size estimates; the 520 px historical comparison arm remains explicitly documented, separate from current emitted CSS.

## Impact

`sitemap.xml.ts`, `_headers`, the cart checkout page, `SiteLayout.astro`, the Store Item, release and artist pages, `StoreOfferPriceDisplay` and focused tests. No visible UI, content, data, API or dependency changes. Cloudflare stays on Free. Depends on `add-site-analytics` 1.1 for the verified Search Console property.
