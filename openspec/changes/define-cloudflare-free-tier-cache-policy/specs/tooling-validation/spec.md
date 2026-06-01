## ADDED Requirements

### Requirement: Static cache header validation

The system SHALL validate repo-owned static cache header policy before cache behavior is accepted.

#### Scenario: Static build output is checked

- **WHEN** cache policy validation runs after `pnpm build`
- **THEN** it verifies that the Cloudflare Pages static artifact includes the expected cache header artifact
- **AND** fingerprinted Astro assets and document routes are classified according to the cache policy.

#### Scenario: Header policy drifts

- **GIVEN** a static header rule is added or changed
- **WHEN** validation detects immutable caching on a non-fingerprinted or unapproved asset pattern
- **THEN** validation fails with an actionable message naming the route pattern.

### Requirement: Worker cache header validation

The system SHALL test representative Worker API responses for explicit cache-control headers.

#### Scenario: Backend route tests run

- **WHEN** backend HTTP tests exercise public checkout, public Store Offer, checkout state, internal stock, internal order, and webhook routes
- **THEN** they assert the expected `Cache-Control` header for success and handled error responses
- **AND** they prove dynamic authoritative routes are not shared-cacheable.

#### Scenario: Generated API clients are updated

- **WHEN** route contracts or client fetch options change to support cache policy
- **THEN** generated API client changes are produced and checked through existing API generation and repository gates.

### Requirement: Hosted cache audit is bounded

The system SHALL provide a bounded hosted cache audit for PRD Cloudflare Pages and Worker responses.

#### Scenario: Hosted PRD audit runs

- **WHEN** a maintainer runs the hosted cache audit
- **THEN** it requests a small representative URL set
- **AND** it reports response URL, status, `Cache-Control`, `ETag`, and `CF-Cache-Status` when present
- **AND** it does not perform load testing, cache warming, provider mutation, checkout creation, or stock mutation.

#### Scenario: Hosted audit cannot reach provider

- **WHEN** Cloudflare credentials, PRD URL, or Worker URL are unavailable
- **THEN** the audit reports a blocked or skipped status
- **AND** local validation remains the minimum required implementation gate.

### Requirement: Free-tier regression checks

The system SHALL include validation guidance that protects the Cloudflare Free-tier budget.

#### Scenario: New cache validation is proposed

- **WHEN** a script or workflow adds repeated hosted requests
- **THEN** it documents the maximum number of Worker requests and D1-touching requests per run
- **AND** it stays materially below Workers Free daily request limits and D1 Free daily row limits.

#### Scenario: New cache dependency is proposed

- **WHEN** implementation adds KV, R2, Cache Rules, Worker Cache API, service worker, Pages Functions, or paid Cloudflare capabilities
- **THEN** the OpenSpec change identifies why headers and existing static delivery are insufficient
- **AND** it records Free-tier availability and failure behavior.
