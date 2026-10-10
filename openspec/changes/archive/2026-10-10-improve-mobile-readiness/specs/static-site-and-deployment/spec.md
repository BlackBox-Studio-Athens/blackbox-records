## MODIFIED Requirements

### Requirement: UAT static smoke stays read-only

UAT Static Smoke SHALL verify the Cloudflare public site's routes, public assets, metadata, redirects, Review Site Marker, HTML 404 page, phone layout and checkout shell without modifying content or provider state, within the request budget recorded in the Free-tier rule.

#### Scenario: UAT static smoke runs

- **WHEN** the suite targets configured UAT
- **THEN** public artifacts contain no Sveltia runtime, writable CMS configuration, or staff page documents
- **AND** old admin links lead to the protected workspace or a clear retired state
- **AND** authenticated staff tests remain a separate explicitly scoped suite.

#### Scenario: Representative pages follow published content

- **GIVEN** UAT content was published with different artists, releases, news or Store Items
- **WHEN** the suite selects detail pages to probe
- **THEN** it discovers one artist, release and news page from the deployed sitemap and one Store Item from the deployed Store listing
- **AND** it asserts HTTP status, Review Site Marker, console and page errors, secret exposure, media origin and UI copy rather than content titles
- **AND** a section without a discoverable page fails with a message naming that section.

#### Scenario: The smoke checks phones and unknown pages

- **WHEN** the suite runs
- **THEN** it loads eight representative routes in a 390 × 844 touch context and asserts no horizontal overflow, a viewport meta tag and no console or page errors
- **AND** it asserts that a path the site does not have returns an HTML 404 with a viewport meta tag
- **AND** the whole run stays at about 36 documents, 71 Worker requests and 36 Durable Object requests.

## ADDED Requirements

### Requirement: Unknown public documents get the prerendered 404 page

The public build SHALL prerender `404.html` into the Pages output. The gateway SHALL answer a GET or HEAD request outside the route allowlist that accepts `text/html` with that page as a `no-store` 404 through one Pages asset read and no renderer call, and SHALL answer other unknown requests, API, `_emdash`, private and scanner paths with plain text. Renderer detail routes with an unknown slug SHALL respond 404 so the 404 page renders.

#### Scenario: A phone visitor opens a mistyped URL

- **WHEN** a browser requests a public path the site does not have
- **THEN** the response is a `no-store` 404 HTML page with the viewport and theme-color metas
- **AND** the renderer is not called.

#### Scenario: A detail slug no longer exists

- **WHEN** a browser requests an artist, news, release, Store Item, checkout or privacy page with an unknown slug
- **THEN** the renderer responds 404 with the site's 404 page.

### Requirement: Brand icons and the manifest are static assets

`/apple-touch-icon*` and `/manifest.webmanifest` SHALL be excluded from the Pages Function routes and bypassed by the gateway, so they are served by Pages assets without a Function invocation.

#### Scenario: iOS requests the touch icon

- **WHEN** a browser requests `/apple-touch-icon.png` or `/manifest.webmanifest`
- **THEN** Pages assets serve it with its image or manifest type
- **AND** no Pages Function or renderer is invoked.
