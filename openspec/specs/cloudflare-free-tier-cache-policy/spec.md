# cloudflare-free-tier-cache-policy Specification

## Purpose

Defines cache categories and freshness rules for the public site, commerce APIs, and protected staff surfaces while preserving authoritative state, privacy, and Cloudflare Free-tier limits.

## Requirements

### Requirement: Cache policy taxonomy

The system SHALL classify cache behavior with canonical categories for Static Asset Cache, Document Revalidation, Worker API Freshness, Authoritative Commerce State, and Same-Session Shell Cache.

#### Scenario: Cache behavior is documented

- **WHEN** a maintainer reviews cache behavior
- **THEN** the source-of-truth cache policy identifies whether the behavior belongs to static CDN/browser caching, document revalidation, Worker API freshness, authoritative commerce state, or same-session shell caching
- **AND** the policy does not describe caching for mutable private CMS data as part of this change.

### Requirement: Staff immutable reuse preserves fresh authorization and mutable state

Staff caching MUST introduce no time-based freshness window. Successful hashed code/style/font assets MAY use private browser storage with mandatory revalidation and platform validators after authentication. Staff HTML, APIs, private media, errors and cookie-setting responses MUST remain no-store.

#### Scenario: A browser revalidates a staff asset

- **WHEN** a browser conditionally requests an eligible hashed asset
- **THEN** authorization runs before any successful or not-modified response
- **AND** denied access cannot reuse an earlier response without validation.

#### Scenario: Workspace reads the same accepted manifest

- **WHEN** the freshly read pointer selects the same environment, bucket and checksum as the CMS object's single retained verified manifest
- **THEN** the workspace reuses the parsed manifest without another R2 manifest read
- **AND** mutable drafts, publication status and commerce queries still run.

#### Scenario: Publication changes or cannot be read

- **WHEN** the current pointer changes, disappears or fails to read
- **THEN** the workspace uses the newly verified manifest, no accepted manifest, or an explicit failure respectively
- **AND** no old snapshot is substituted for an unreadable or invalid new publication.

#### Scenario: New cacheable surface is proposed

- **WHEN** a future change proposes caching a route, asset class, or API response
- **THEN** the change classifies the surface with the cache taxonomy
- **AND** it states the authority boundary, stale-data tolerance, invalidation mechanism, and Free-tier impact before implementation.

### Requirement: Fingerprinted static asset caching

The system SHALL allow long-lived immutable caching only for static assets whose filenames are content-fingerprinted or otherwise versioned by the build.

#### Scenario: Cloudflare Pages serves hashed Astro assets

- **GIVEN** the PRD static artifact is built for Cloudflare Pages
- **WHEN** the artifact includes hashed Astro assets under `/_astro/*`
- **THEN** those assets may receive `Cache-Control: public, max-age=31536000, immutable`
- **AND** the rule is represented in a repo-owned Cloudflare Pages `_headers` artifact or an equivalent versioned static header artifact.

#### Scenario: Asset filename is not content-addressed

- **GIVEN** an asset path can be reused for different bytes across deployments
- **WHEN** cache policy is assigned
- **THEN** the system MUST NOT assign immutable year-long caching to that asset class without a versioning or rename policy.

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

### Requirement: Worker API freshness policy

The system MUST send explicit cache-control headers for Worker API responses.

#### Scenario: Dynamic commerce API responds

- **WHEN** the Worker returns a checkout, Store Offer, capability, checkout-state, webhook, provider mutation, internal stock, or internal order response
- **THEN** the response includes a route-appropriate `Cache-Control` header
- **AND** the default dynamic API policy is `no-store`.

#### Scenario: Public read endpoint is considered for a TTL

- **GIVEN** a public Worker read endpoint is proposed for a nonzero shared-cache or browser-cache TTL
- **WHEN** the endpoint includes availability, stock, payment, order, feature-gate, provider mapping, or operator-sensitive state
- **THEN** the TTL is rejected unless the endpoint is split or redesigned so the cached response cannot affect authoritative commerce or stock decisions.

### Requirement: Free-tier-safe cache strategy

The system MUST keep caching implementation compatible with Cloudflare Free-tier limits and the hosted architecture.

#### Scenario: Cache implementation is selected

- **WHEN** implementation chooses between headers, Cache Rules, Worker Cache API, service worker, KV, R2, Pages Functions, or a paid product
- **THEN** the first accepted implementation uses repo-owned headers and tests unless a stronger OpenSpec change approves the added runtime or provider dependency
- **AND** it does not require a paid Cloudflare plan.

#### Scenario: Hosted validation runs

- **WHEN** a hosted cache validation command checks PRD response headers
- **THEN** it uses a bounded set of representative URLs
- **AND** it avoids cache warming, load testing, or repeated Worker/D1 calls that could materially consume Free-tier daily quotas.
