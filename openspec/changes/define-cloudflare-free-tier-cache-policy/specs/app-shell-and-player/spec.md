## ADDED Requirements

### Requirement: Same-session shell cache boundary
The system SHALL treat shell page and overlay fragment caches as same-session UI caches, not as authoritative data stores.

#### Scenario: Shell caches a page snapshot
- **GIVEN** a shopper navigates through the persistent shell
- **WHEN** `AppShellRoot` caches a fetched page snapshot
- **THEN** the cached snapshot is scoped to the current browser session
- **AND** it does not cache Worker API JSON, checkout state, stock state, payment state, or provider data.

#### Scenario: Overlay fragment is cached
- **GIVEN** a shopper opens an artist, release, or news overlay
- **WHEN** the overlay fragment loader caches fetched HTML
- **THEN** the cache is treated as static route markup for the current session
- **AND** it remains separate from Cloudflare CDN/browser HTTP cache policy.

### Requirement: Shell caches are bypassable for future freshness needs
The system SHALL provide or preserve a path to bypass or invalidate same-session shell caches when future actions require fresh route markup.

#### Scenario: Future mutation changes visible route content
- **GIVEN** a future feature mutates content that is visible in a shell-cached route
- **WHEN** the mutation completes
- **THEN** the implementation can clear, bypass, or refresh the affected shell cache entry
- **AND** it does not require a full document reload unless the route boundary requires it.

#### Scenario: Checkout or stock state changes
- **WHEN** checkout, order, or stock state changes through Worker APIs
- **THEN** shell page and overlay caches do not become the source of truth for that changed state
- **AND** any refreshed authority state comes from the Worker API.

### Requirement: Route loading remains honest under cache hits
The system SHALL keep loading feedback consistent whether shell navigation uses a cached snapshot, an in-flight fetch, or a fresh network request.

#### Scenario: Shell navigation hits same-session cache
- **WHEN** a top-level shell route is already cached in memory
- **THEN** the UI may avoid unnecessary loading animation
- **AND** it still resets scroll, moves focus, and presents the correct route state.

#### Scenario: Shell navigation fetches fresh content
- **WHEN** a top-level shell route is not cached or cache is bypassed
- **THEN** route loading feedback appears according to the loading-feedback standard
- **AND** the fetched document follows the HTTP document revalidation policy.
