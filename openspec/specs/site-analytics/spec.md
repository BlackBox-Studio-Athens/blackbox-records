# Site Analytics Specification

## Purpose

Verify the production domain with search engines and let staff read existing aggregate site analytics without a Cloudflare login. Optional client-side measurement is deferred pending its data-protection assessment.

## Requirements

### Requirement: Search engines can verify and discover the production domain

The production domain SHALL be verified in Google Search Console as a Domain property and in Bing Webmaster Tools, and Cloudflare Crawler Hints SHALL be enabled for the zone. Verification SHALL use DNS records and SHALL NOT add verification files or meta tags to the site.

#### Scenario: Owner checks search verification

- **WHEN** the owner opens Google Search Console and Bing Webmaster Tools
- **THEN** both list `blackboxrecordsathens.com` as verified
- **AND** the site source contains no search-engine verification file or meta tag.

### Requirement: Visits are measured without cookies

The public Pages gateway SHALL append `no-transform` to HTML and conditional responses to prevent automatic optional beacon injection while the assessment is unresolved. It SHALL preserve existing cache, no-store, referrer and indexing restrictions; image/binary responses SHALL retain their existing behavior. No consent banner or replacement tracker is introduced. Existing staff aggregate reads and necessary delivery/security processing remain available. A claim that consent is unnecessary MUST be supported by the applicable GDPR and terminal-access assessment; cookie-free behavior alone does not establish that conclusion. Any later measurement activation requires an evidenced assessment and accurate coordinated privacy wording.

#### Scenario: Cookie-free collection is assessed

- **WHEN** the operator evaluates the configured analytics for publication acceptance
- **THEN** the assessment distinguishes the GDPR legal basis from any applicable terminal-access consent requirement
- **AND** missing assessment or account evidence remains unresolved rather than being inferred from the absence of cookies.

#### Scenario: Visitor browses the production site

- **WHEN** a visitor receives HTML through the public gateway
- **THEN** its response includes `Cache-Control: no-transform` alongside the existing cache directives
- **AND** the application adds no optional beacon script, including on checkout, email-preferences and HTML 404 replies.

#### Scenario: Conditional or private HTML is returned

- **WHEN** a document response is a conditional 304 or carries private/no-store restrictions
- **THEN** the gateway preserves its status, ETag and privacy directives while retaining `no-transform`
- **AND** deployment acceptance separately verifies that the actual edge response does not inject a beacon.

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

#### Scenario: Thirty-day traffic uses the same recent sampling window

- **WHEN** an authenticated caller requests thirty days of traffic
- **THEN** the Worker queries consecutive windows of at most seven UTC days with the newest bounds and fields equal to the seven-day query
- **AND** the oldest partial window completes the thirty-day range without gaps or overlapping bounds
- **AND** daily rows merge by date and breakdown rows merge by key, with at most ten top paths, referrers and countries ranked by visits and all device groups retained
- **AND** snapshots from earlier full-window cache versions are not reused.

#### Scenario: A failed analytics read is diagnosed

- **WHEN** an upstream HTTP, GraphQL, timeout, network, JSON, body-size or response-shape failure occurs
- **THEN** the existing request-correlated event identifies a fixed safe failure category and the upstream HTTP status when available
- **AND** logs and client responses contain no credentials, raw provider bodies or arbitrary exception messages.

#### Scenario: The analytics provider redirects

- **WHEN** the GraphQL endpoint responds with a redirect
- **THEN** the Worker rejects the response using the existing safe upstream HTTP failure
- **AND** it does not follow the redirect or forward its authorization header to the redirect target.
