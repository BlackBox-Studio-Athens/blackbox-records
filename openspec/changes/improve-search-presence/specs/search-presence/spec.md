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
- **THEN** the page contains one `Product` with an `Offer` of `25.00` `EUR`, `PreOrder` availability and the release date as `availabilityStarts`.

#### Scenario: The offer read fails

- **WHEN** the Worker offer read fails
- **THEN** the page contains no `Product` structured data.

### Requirement: Site, releases and artists are described as entities

Home SHALL publish `WebSite` data naming the site. Release pages SHALL publish `MusicAlbum` data and artist pages `MusicGroup` data, server-rendered from accepted content.

#### Scenario: A release page is rendered

- **WHEN** a release with an artist and a tracklist is rendered
- **THEN** its `MusicAlbum` names the release, links the artist's `MusicGroup` page, gives the release date, image and label, and lists the tracks.
