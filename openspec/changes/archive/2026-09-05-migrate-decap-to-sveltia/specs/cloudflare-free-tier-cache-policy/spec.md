## MODIFIED Requirements

### Requirement: Cache policy taxonomy

The system SHALL classify cache behavior with canonical categories for Static Asset Cache, Document Revalidation, Worker API Freshness, Authoritative Commerce State, and Same-Session Shell Cache.

#### Scenario: Cache behavior is documented

- **WHEN** a maintainer reviews cache behavior
- **THEN** the source-of-truth cache policy identifies whether the behavior belongs to static CDN/browser caching, document revalidation, Worker API freshness, authoritative commerce state, or same-session shell caching
- **AND** the policy does not describe CMS-level caching as part of this change.

#### Scenario: New cacheable surface is proposed

- **WHEN** a future change proposes caching a route, asset class, or API response
- **THEN** the change classifies the surface with the cache taxonomy
- **AND** it states the authority boundary, stale-data tolerance, invalidation mechanism, and Free-tier impact before implementation.
