## MODIFIED Requirements

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

#### Scenario: Live page snapshot starts no image requests

- **GIVEN** the shell captures the current page for its same-session cache, on mount or before a section navigation
- **WHEN** it copies and sanitizes the page's main content
- **THEN** the copy lives in an inert document with no browsing context, so images it contains, including lazy ones, are not requested
- **AND** the stored snapshot HTML is the same as before.
