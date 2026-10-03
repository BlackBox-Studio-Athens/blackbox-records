## ADDED Requirements

### Requirement: Hosted page views stay within a Worker-request budget

The hosted public site SHALL keep Worker invocations per page view within a budget recorded in the Free-tier rule, so ordinary traffic cannot exhaust the account's shared daily Workers allowance.

#### Scenario: A visitor loads a hosted page for the first time

- **WHEN** a cold first visit loads a representative hosted route with its images, stylesheets, scripts, fonts and favicons
- **THEN** the HTML document costs at most one Pages Function invocation and one renderer invocation
- **AND** CMS image candidates are fetched from direct Images transform URLs without invoking the Pages Function or the renderer
- **AND** repo-owned static assets, including ESM images and every `/favicon*` file, are served by Pages assets without a Function invocation and with their bytes unchanged.

#### Scenario: A request targets a path the site does not have

- **WHEN** a request path is outside the allowlist generated from the release's routes
- **THEN** the gateway answers with a static `no-store` 404 without calling the renderer.

#### Scenario: The budget is recorded and checked

- **WHEN** a release changes hosted delivery
- **THEN** `docs/cloudflare-free-tier.md` records the Worker-requests-per-page-view budget for a cold first visit and a warm repeat view of representative routes
- **AND** the bounded UAT pilot measures both against the budget before the release is accepted, without load testing or cache warming.

### Requirement: Published HTML is reused across renderer hibernation

The hosted renderer SHALL keep rendered published HTML reusable when its Durable Object hibernates, and SHALL let browsers and the edge revalidate it without re-downloading unchanged pages, while every reuse remains bound to one release and accepted snapshot.

#### Scenario: The renderer wakes after hibernation

- **WHEN** a request reaches the public renderer object after it has hibernated
- **THEN** a page already rendered for the current release, snapshot and path is served from the object's persisted storage without a snapshot parse or render
- **AND** stored pages are evicted least-recently-used by byte size within a declared limit
- **AND** a pointer refresh in progress is shared by concurrent requests, which keep serving the current snapshot meanwhile.

#### Scenario: A browser revalidates a hosted page

- **WHEN** a browser or the edge revalidates a published page with `If-None-Match`
- **THEN** the gateway forwards that header beside `Accept`, and only those two headers
- **AND** the renderer answers 304 when the weak ETag for the release, snapshot and path still matches.

#### Scenario: A publication is activated

- **WHEN** a new snapshot or release becomes current
- **THEN** no reuse path serves a page from a superseded snapshot or release beyond the documented edge window
- **AND** if publication-tagged purge is available on the Free plan, activation purges the tagged pages and a longer shared edge lifetime may apply, with the existing short window as the fallback
- **AND** previews, not-found and error responses, and `/content-version.json` stay `no-store`.

#### Scenario: Hosted cache features are selected

- **WHEN** an implementation uses Durable Object storage, tag purge, or a location hint for hosted HTML
- **THEN** each feature's availability on the Workers Free plan is confirmed from current Cloudflare documentation and recorded with the change
- **AND** a feature that is not available on Free is not used.
