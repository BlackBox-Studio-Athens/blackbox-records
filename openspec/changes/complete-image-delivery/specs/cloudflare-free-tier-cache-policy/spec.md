# Cloudflare Free-tier cache policy Specification Delta

## MODIFIED Requirements

### Requirement: Cache policy taxonomy

The system SHALL classify cache behavior with canonical categories for Static Asset Cache, Public Image Worker Cache, Document Revalidation, Worker API Freshness, Authoritative Commerce State, and Same-Session Shell Cache.

#### Scenario: Cache behavior is documented

- **WHEN** a maintainer reviews cache behavior
- **THEN** the source-of-truth cache policy identifies whether the behavior belongs to static CDN/browser caching, public image Worker caching, document revalidation, Worker API freshness, authoritative commerce state, or same-session shell caching
- **AND** the policy does not describe caching for mutable private CMS data as part of this change.

#### Scenario: Public immutable image response is cached

- **GIVEN** a response comes from the public Worker for a content-addressed accepted snapshot image
- **WHEN** it is a successful image with immutable cache headers
- **THEN** Workers Caching may store it, with distinct negotiated variants where `Accept` changes the output format
- **AND** the cache authority is the immutable snapshot and media hashes, so content changes produce new URLs.

#### Scenario: Dynamic and private responses pass through uncached

- **WHEN** a request reaches a preview route, `/content-version.json`, a not-found or error response of the public renderer, an original image returned after a failed transformation, the staff CMS, or a private staff-media route
- **THEN** Workers Caching does not serve or store the response
- **AND** those responses, drafts, staff images, and cookie-setting responses carry an explicit `no-store` policy.

#### Scenario: Workers Caching is used on the Free tier

- **WHEN** the public Worker's default or image entrypoint uses Workers Caching
- **THEN** the deployment remains within the Free plan and counts every incoming Worker request toward the applicable daily request allowance, including cache hits
- **AND** an edge-served response skips Durable Object work
- **AND** rollout checks account for both Worker requests and Cloudflare Images unique transformations.

### Requirement: Document revalidation policy

The system SHALL keep HTML documents and route fragments revalidation-friendly instead of treating them as immutable static assets.

#### Scenario: Route document is requested

- **WHEN** a browser or app-shell fetch requests an HTML route document
- **THEN** the route document does not receive long-lived immutable caching
- **AND** any explicit cache header requires revalidation before reuse after deployment.

#### Scenario: Overlay partial route is requested

- **WHEN** the app shell fetches an overlay partial route
- **THEN** the HTTP cache policy treats the partial as a document fragment, not as an immutable asset
- **AND** the same-session overlay cache remains separate from CDN/browser document caching.

#### Scenario: Published HTML is briefly shared at the edge

- **GIVEN** the public renderer returns a successful render of the accepted snapshot
- **WHEN** it sets the response cache policy
- **THEN** the policy is `public, max-age=0, s-maxage=30, stale-while-revalidate=30`, so browsers revalidate every use and Workers Caching serves the render for at most 60 seconds
- **AND** the cache is keyed by Worker version, so a deployment never reuses an earlier build's page
- **AND** Content Publication confirmation reads the uncached `/content-version.json`, not a cached page.
