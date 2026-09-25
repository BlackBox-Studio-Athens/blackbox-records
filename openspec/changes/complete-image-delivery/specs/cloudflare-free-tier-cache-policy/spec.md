# Cloudflare Free-tier cache policy Specification Delta

## MODIFIED Requirements

### Requirement: Cache policy taxonomy

The system SHALL classify cache behavior with canonical categories for Static Asset Cache, Public Image Worker Cache, Document Revalidation, Worker API Freshness, Authoritative Commerce State, and Same-Session Shell Cache.

#### Scenario: Public immutable image response is cached

- **GIVEN** a response comes from the named public image entrypoint for a content-addressed accepted snapshot image
- **WHEN** it is a successful image with immutable cache headers
- **THEN** Workers Caching may store it, with distinct negotiated variants where `Accept` changes the output format
- **AND** the cache authority is the immutable snapshot and media hashes, so content changes produce new URLs.

#### Scenario: Dynamic and private responses pass through uncached

- **WHEN** a request reaches the default public renderer, preview route, staff CMS, or private staff-media route
- **THEN** Workers Caching does not serve or store the response
- **AND** dynamic pages, previews, drafts, staff images, errors, and cookie-setting responses retain their existing no-store policy.

#### Scenario: Worker image cache is used on the Free tier

- **WHEN** the named public image entrypoint uses Workers Caching
- **THEN** the deployment remains within the Free plan and counts every incoming Worker request toward the applicable daily request allowance, including cache hits
- **AND** rollout checks account for both Worker requests and Cloudflare Images unique transformations.
