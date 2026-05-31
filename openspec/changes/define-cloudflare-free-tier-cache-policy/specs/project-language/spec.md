## ADDED Requirements

### Requirement: Cache policy terms
The system SHALL use canonical cache-policy terms across specs, docs, validation output, and implementation notes.

#### Scenario: Static cache behavior is named
- **WHEN** docs or validation describe long-lived caching for content-fingerprinted build files
- **THEN** they use `Static Asset Cache`
- **AND** they do not use that term for Worker API JSON, checkout state, stock state, or Decap/CMS behavior.

#### Scenario: Route document freshness is named
- **WHEN** docs or validation describe HTML route documents, overlay partials, `sitemap.xml`, or `robots.txt`
- **THEN** they use `Document Revalidation`
- **AND** they avoid implying those documents are immutable assets.

#### Scenario: Worker API freshness is named
- **WHEN** docs or validation describe checkout, Store Offer, stock, order, webhook, or provider-mutation API responses
- **THEN** they use `Worker API Freshness`
- **AND** they preserve the distinction from `Authoritative Commerce State`.

#### Scenario: Authority-bearing state is named
- **WHEN** docs, specs, tests, or UI copy describe price, stock, payment, order, checkout eligibility, provider mapping, or feature-gate authority
- **THEN** they use `Authoritative Commerce State`
- **AND** they state that browser, CDN, service-worker, and same-session shell caches do not own that state.

#### Scenario: Shell memory cache is named
- **WHEN** docs or code comments describe the app-shell page snapshot cache or overlay fragment cache
- **THEN** they use `Same-Session Shell Cache`
- **AND** they do not describe it as CDN caching, browser HTTP caching, or Worker caching.
