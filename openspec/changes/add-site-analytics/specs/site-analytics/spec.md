## ADDED Requirements

### Requirement: Search engines can verify and discover the production domain

The production domain SHALL be verified in Google Search Console as a Domain property and in Bing Webmaster Tools, and Cloudflare Crawler Hints SHALL be enabled for the zone. Verification SHALL use DNS records and SHALL NOT add verification files or meta tags to the site.

#### Scenario: Owner checks search verification

- **WHEN** the owner opens Google Search Console and Bing Webmaster Tools
- **THEN** both list `blackboxrecordsathens.com` as verified
- **AND** the site source contains no search-engine verification file or meta tag.

### Requirement: Visits are measured without cookies

The production apex SHALL be measured by Cloudflare Web Analytics automatic setup. Measurement SHALL set no cookies and SHALL NOT require a consent banner. The published privacy notice SHALL name Cloudflare Web Analytics and state that it uses no cookies.

#### Scenario: Visitor browses the production site

- **WHEN** a visitor loads the apex and navigates between sections inside the shell
- **THEN** each document and each in-shell navigation is counted as a page view
- **AND** the browser holds no analytics cookie.

### Requirement: Staff can read site analytics without a Cloudflare login

The staff Stats page SHALL chart visits and page views per day and list top pages, top referrers, countries and device types for a 7-day or 30-day range. It SHALL show the last successful read time and Retry when a read fails.

#### Scenario: Staff member opens Stats

- **WHEN** an authenticated staff member opens Stats and chooses a range
- **THEN** the page charts visits and page views per day and shows top pages, referrers, countries and device types
- **AND** no Cloudflare credential reaches the browser.

### Requirement: The analytics read keeps Cloudflare credentials in the Worker

The backend SHALL serve `GET /api/internal/analytics` behind the existing Access-protected internal route, query Cloudflare with a read-only token held only by the Worker, and cache responses for 15 minutes without KV.

#### Scenario: Cloudflare analytics is unavailable

- **WHEN** the GraphQL Analytics API fails or times out
- **THEN** the backend returns a stable error with a request ID
- **AND** the page keeps the last successful figures, labelled with their read time, and offers Retry.

#### Scenario: Unauthenticated request

- **WHEN** a request reaches `/api/internal/analytics` without a valid Access identity
- **THEN** it is rejected like every other internal route.

#### Scenario: Analytics has not been provisioned

- **WHEN** an authenticated request has a valid range but any analytics binding is absent or blank
- **THEN** the backend returns HTTP 200 with `status: "not_configured"`, the requested `range`, `generatedAt: null`, and empty data arrays
- **AND** it makes no upstream request and does not cache this state.

#### Scenario: Supported analytics range is requested

- **WHEN** an authenticated caller requests `7d` or `30d` with all analytics bindings set
- **THEN** the backend returns the documented response contract with UTC daily visits/page views, top paths/referrer hosts/countries and device types
- **AND** successful snapshots are cached for 15 minutes without bypassing Access verification or sharing request IDs
- **AND** missing or other range values return the stable invalid-request error.

#### Scenario: Staff reads public visitor traffic

- **WHEN** analytics is read for either supported range
- **THEN** every GraphQL group filters the configured site to `requestHost: "blackboxrecordsathens.com"` and `bot: 0`
- **AND** cached data from the previous unfiltered query is not reused.

#### Scenario: A failed analytics read is diagnosed

- **WHEN** an upstream HTTP, GraphQL, timeout, network, JSON, body-size or response-shape failure occurs
- **THEN** the existing request-correlated event identifies a fixed safe failure category and the upstream HTTP status when available
- **AND** logs and client responses contain no credentials, raw provider bodies or arbitrary exception messages.
