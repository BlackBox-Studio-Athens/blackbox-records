## ADDED Requirements

### Requirement: Hosted CMS media is addressed by media identity

The hosted renderer SHALL address CMS media by the media's own content SHA, SHALL serve and transform only media that the live or a bounded number of recent accepted snapshots reference, and SHALL keep each transformation request within the widths the image components emit.

#### Scenario: A text-only publication is activated

- **WHEN** an accepted publication changes text but no media
- **THEN** every hosted media and image URL stays the same as before the publication
- **AND** no Images transformation is requested again for unchanged media.

#### Scenario: A media SHA is requested

- **WHEN** a request names a media SHA referenced by the live snapshot or one of the three most recently accepted snapshots
- **THEN** the media or its transformation is served with immutable caching
- **AND** a draft, failed-candidate, retired, or unknown media SHA returns 404 `no-store`
- **AND** checking the SHA costs constant time per request after the recent-snapshot index is built.

#### Scenario: A transformation width is requested

- **WHEN** an `/_image` request names a width
- **THEN** it is accepted only for a width the image components emit, including each image's intrinsic `src` width, and snaps to the declared ladder
- **AND** any other width returns 404 `no-store`.

#### Scenario: A transformation fails or the monthly allowance is spent

- **WHEN** Cloudflare Images cannot return a transformation
- **THEN** the renderer serves the verified original with a short shared cache lifetime and a marker header
- **AND** the original is never cached immutably under a transformation URL.

#### Scenario: A legacy snapshot-prefixed media URL is requested

- **WHEN** a cached page requests media through the earlier snapshot-prefixed URL shape
- **THEN** it is served only for the live or recent accepted snapshots, without re-parsing a full snapshot per request.

### Requirement: Hosted image transformations use a canonical source and direct URLs

Hosted pages SHALL reference CMS image transformations on the images host directly, and every transformation SHALL use one canonical source URL from configuration rather than the request host.

#### Scenario: A hosted page renders a CMS image

- **WHEN** the hosted renderer emits an image element for CMS media
- **THEN** its `src` and `srcset` point to transformation URLs on the configured images host
- **AND** the page preconnects to that host
- **AND** repo-owned ESM images use plain fingerprinted `/_astro` URLs.

#### Scenario: The public hostname changes

- **WHEN** the site is served from a new public hostname such as the apex domain
- **THEN** transformations keep working, because their source is the configured `PUBLIC_IMAGE_SOURCE_ORIGIN`
- **AND** the `image_transform` smoke scenario confirms that a 480 px request returns a small AVIF or WebP with immutable caching on that hostname.
