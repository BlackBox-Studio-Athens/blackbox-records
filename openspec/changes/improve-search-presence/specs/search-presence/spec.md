## ADDED Requirements

### Requirement: The sitemap lists every indexable page

`sitemap.xml` SHALL list every Store Item page from the same source as the Store Item static paths, in addition to the existing pages. Every listed URL SHALL exist, SHALL NOT be marked `noindex` and SHALL be canonical to itself. `lastmod` SHALL be present only when it reflects a real content change.

#### Scenario: A Store Item is published

- **WHEN** an accepted snapshot contains a Store Item
- **THEN** the sitemap lists `https://blackboxrecordsathens.com/store/<slug>/`.

#### Scenario: The build-output check runs

- **WHEN** a sitemap URL is missing, `noindex` or canonical to another URL
- **THEN** the check fails and names the URL.

### Requirement: Transactional pages and fragments stay out of search indexes

The cart checkout page, the per-item checkout and return pages and the shell's `/app-shell-overlay/*` fragments SHALL be marked `noindex`. Fragments SHALL use an `X-Robots-Tag` header and SHALL NOT be blocked in `robots.txt`.

#### Scenario: A crawler fetches a shell fragment

- **WHEN** a crawler requests a URL under `/app-shell-overlay/`
- **THEN** the response carries `X-Robots-Tag: noindex`.

### Requirement: Store Items describe their offer to search engines

A Store Item page SHALL publish `Product` structured data with an `Offer` only after its offer read succeeds, using the same price and availability the page shows. It SHALL publish no `Product` data when the item has no price or the read fails.

#### Scenario: A pre-order item is viewed

- **WHEN** the offer read returns a pre-order priced at €25.00
- **THEN** the page contains one `Product` with an `Offer` of `25.00` `EUR` and `PreOrder` availability
- **AND** `availabilityStarts` is omitted unless a verified date for the availability of that offer exists; an album release date or month-only shipping estimate is not substituted.

#### Scenario: The offer read fails

- **WHEN** the Worker offer read fails
- **THEN** the page contains no `Product` structured data.

#### Scenario: Internal identifiers are longer than merchant SKU limits

- **WHEN** a priced Store Item publishes `Product` structured data
- **THEN** optional `sku` is omitted rather than populated from or shortened from the internal variant ID
- **AND** commerce identifiers are unchanged.

### Requirement: Site, releases and artists are described as entities

Home SHALL publish `WebSite` data naming the site. Release pages SHALL publish `MusicAlbum` data and artist pages `MusicGroup` data, server-rendered from accepted content.

#### Scenario: A release page is rendered

- **WHEN** a release with an artist and a tracklist is rendered
- **THEN** its `MusicAlbum` names the release, links the artist's `MusicGroup` page, gives the release date, image and label, and lists the tracks.
- **AND** the label is represented by `recordLabel` on a nested `albumRelease` of type `MusicRelease`, not directly on `MusicAlbum`.

### Requirement: Public document URL variants consolidate

Known public document paths SHALL use one trailing-slash canonical convention. Alternate slash forms SHALL permanently redirect to that form while preserving queries and supported base paths. Assets, media, API routes, fragments, private routes and unknown paths SHALL preserve their existing response and indexing boundaries.

#### Scenario: A slashless Store or artist document is requested

- **WHEN** a request targets `/store` or `/artists/afterwise`
- **THEN** it permanently redirects to the respective trailing-slash document
- **AND** the destination emits the same canonical used by the sitemap.

### Requirement: Search metadata describes the destination accurately

Public metadata SHALL distinguish Store Items using accepted artist/title/format facts and describe each page's purpose without changing visible page copy. Client navigation SHALL synchronize route-owned canonical, social and structured metadata with direct navigation. Organization country codes SHALL use supported country codes; entity identities, Article facts and Breadcrumb hierarchy SHALL be supported by published content.

#### Scenario: Two items share an album title

- **WHEN** items differ by artist or physical format
- **THEN** their document titles distinguish those known facts while visible headings remain unchanged.

#### Scenario: Product navigation reaches About

- **WHEN** the shell navigates from a Product page to About
- **THEN** About's title, description, canonical and social metadata match a direct About load
- **AND** stale Product entities are removed without interrupting the persistent player.

### Requirement: SEO delivery changes preserve the user experience

SEO implementation SHALL preserve the approved appearance, readable content, accessible controls, catalog and commerce rules. Performance changes SHALL be measured against matching source/device conditions and verified for visual and player continuity. New media transformation demand SHALL remain within the Free-tier budget.

#### Scenario: Performance optimization is accepted

- **WHEN** CSS or resource delivery is changed
- **THEN** equivalent viewport comparisons and relevant interaction checks preserve the current presentation
- **AND** before/after measurements identify their source release, device and throttling settings without claiming an unmeasured ranking effect.
