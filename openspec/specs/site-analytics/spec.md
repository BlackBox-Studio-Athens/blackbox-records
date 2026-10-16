# Site Analytics Specification

## Purpose

Verify the production domain with search engines, measure visits through automatic Cloudflare Web Analytics and let staff read aggregate site analytics without a Cloudflare login.

## Requirements

### Requirement: Search engines can verify and discover the production domain

The production domain SHALL be verified in Google Search Console as a Domain property and in Bing Webmaster Tools, and Cloudflare Crawler Hints SHALL be enabled for the zone. Verification SHALL use DNS records and SHALL NOT add verification files or meta tags to the site.

#### Scenario: Owner checks search verification

- **WHEN** the owner opens Google Search Console and Bing Webmaster Tools
- **THEN** both list `blackboxrecordsathens.com` as verified
- **AND** the site source contains no search-engine verification file or meta tag.

### Requirement: Visits are measured without cookies

Following the owner's 2026-10-16 decision, the gateway SHALL permit automatic Cloudflare Web Analytics by no longer adding `no-transform` to HTML and conditional replies. It SHALL preserve other cache/privacy directives, ETags, bodyless 304s and image behavior. Visits and shell navigation SHALL be measured without analytics cookies or an application-inserted beacon.

#### Scenario: Cookie-free collection is assessed

- **WHEN** the operator evaluates the configured analytics for publication acceptance
- **THEN** the assessment distinguishes the GDPR legal basis from any applicable terminal-access consent requirement
- **AND** missing assessment or account evidence remains unresolved rather than being inferred from the absence of cookies.

#### Scenario: Visitor browses the production site

- **WHEN** a visitor receives HTML through the public gateway
- **THEN** the gateway preserves the existing cache directives without adding `no-transform`
- **AND** production acceptance verifies the automatic Cloudflare beacon and a page-view request after Home-to-Store shell navigation, without analytics cookies.

#### Scenario: Conditional or private HTML is returned

- **WHEN** a document response is a conditional 304 or carries private/no-store restrictions
- **THEN** the gateway preserves its status, ETag and privacy directives without adding `no-transform`
- **AND** HTML 404 responses retain `no-store` and image/binary responses keep their existing cache behavior.

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
