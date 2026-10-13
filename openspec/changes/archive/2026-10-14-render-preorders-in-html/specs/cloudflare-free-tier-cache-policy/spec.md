## MODIFIED Requirements

### Requirement: Published HTML is reused across renderer hibernation

The hosted renderer SHALL keep rendered published HTML reusable when its Durable Object hibernates, and SHALL let browsers and the edge revalidate it without re-downloading unchanged pages, while every reuse remains bound to one release, accepted snapshot and open pre-order projection identity.

#### Scenario: The renderer wakes after hibernation

- **WHEN** a request reaches the public renderer object after it has hibernated
- **THEN** a page already rendered for the current release, snapshot, projection and path is served from the object's persisted storage without a snapshot parse or render
- **AND** stored pages are evicted least-recently-used by byte size within a declared limit
- **AND** a pointer refresh in progress is shared by concurrent requests, which keep serving the current snapshot meanwhile.

#### Scenario: A browser revalidates a hosted page

- **WHEN** a browser or the edge revalidates a published page with `If-None-Match`
- **THEN** the gateway forwards that header beside `Accept`, and only those two headers
- **AND** the renderer answers 304 when the weak ETag for the release, snapshot, projection and path still matches.

#### Scenario: The open pre-order projection changes

- **WHEN** the renderer accepts a projection with a new identity
- **THEN** no reuse path serves a page rendered from the previous projection beyond the documented edge window
- **AND** the renderer retires persisted pages from the previous projection and purges publication-tagged pages through the existing default-entrypoint purge
- **AND** an unchanged projection causes no retirement, purge or storage write.

#### Scenario: A publication is activated

- **WHEN** a new snapshot or release becomes current
- **THEN** no reuse path serves a page from a superseded snapshot or release beyond the documented edge window
- **AND** if publication-tagged purge is available on the Free plan, activation purges the tagged pages and a longer shared edge lifetime may apply, with the existing short window as the fallback
- **AND** previews, not-found and error responses, and `/content-version.json` stay `no-store`.

#### Scenario: Hosted cache features are selected

- **WHEN** an implementation uses Durable Object storage, tag purge, or a location hint for hosted HTML
- **THEN** each feature's availability on the Workers Free plan is confirmed from current Cloudflare documentation and recorded with the change
- **AND** a feature that is not available on Free is not used.

#### Scenario: Runtime publication invalidation is retried safely

- **WHEN** runtime publication activates an accepted R2 pointer
- **THEN** its private invalidation call verifies and refreshes that exact pointer in the public renderer object before purging publication-tagged HTML from the default Worker entrypoint
- **AND** an older in-flight refresh cannot overwrite the accepted selection
- **AND** missing or rejected UAT/PRD purge, a lost receipt or failed confirmation leaves accepted content intact and confirmation pending for retry
- **AND** an inactive or superseded pointer cannot be confirmed as live.

#### Scenario: Local publication has no edge cache

- **WHEN** Local publication reaches invalidation in an emulator without the edge cache API
- **THEN** exact accepted-pointer verification and refresh still permit confirmation
- **AND** this exception does not permit missing or failed purge to confirm UAT/PRD publication.
