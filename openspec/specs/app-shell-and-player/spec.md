## Purpose

Specify persistent app-shell navigation, overlay routing, and music-player behavior in the static Astro frontend.

## Requirements

### Requirement: Same-document shell navigation

The system SHALL intercept top-level section navigation through the persistent shell while preserving direct page loads.

#### Scenario: Shopper switches sections

- **GIVEN** a shopper clicks a header, footer, or mobile-nav section link
- **WHEN** the destination is a top-level shell route
- **THEN** `AppShellRoot` fetches and swaps the rendered `<main>` content
- **AND** scroll resets, focus moves to `main[data-app-shell-main]`, and transition indicators run without a full document reload.

### Requirement: Detail overlays

The system SHALL open artist, release, and news detail routes as overlays for shell-managed navigation while preserving full Astro pages for direct loads.

#### Scenario: Detail link opens in shell

- **GIVEN** a shell-managed page contains a release, artist, or news detail link
- **WHEN** the user follows that link
- **THEN** the shell fetches the partial overlay route
- **AND** direct loads to the same detail URL still render full pages.

### Requirement: Persistent player session

The system MUST keep the music player owned by the persistent shell with one active Bandcamp or Tidal session.

#### Scenario: User interacts with an embed

- **GIVEN** an embed iframe has loaded and the user interacted with the iframe area
- **WHEN** the user dismisses the player
- **THEN** close semantics minimize the active session into the player-ready state
- **AND** explicit stop destroys the session.

### Requirement: Shell navigation loading remains apparent

The app shell SHALL keep same-document route transitions visibly apparent while preserving focus and scroll behavior.

#### Scenario: Shell section navigation is in flight

- **GIVEN** a shopper follows a shell-managed header, footer, or mobile-nav section link
- **WHEN** the shell is fetching and applying the next page snapshot
- **THEN** the route loading indicator and section transition communicate that navigation is in progress
- **AND** the final state still resets scroll, moves focus to `main[data-app-shell-main]`, and does not leave a stale busy indicator open.

### Requirement: Overlay loading is visible and accessible

The app shell SHALL show an accessible overlay loading state while partial detail content is being fetched.

#### Scenario: Overlay content is loading

- **GIVEN** a shell-managed artist, release, or news detail link opens an overlay
- **WHEN** the partial overlay HTML is not yet available
- **THEN** the overlay panel reserves stable space and shows a visible loading status
- **AND** the loading status uses `role="status"` or equivalent polite live semantics
- **AND** close behavior and focus management remain available.

### Requirement: Player embed loading is visible and calm

The player surface SHALL make third-party iframe loading visible without implying playback has started.

#### Scenario: Embedded player iframe is loading

- **GIVEN** the user starts a Bandcamp or Tidal player session
- **WHEN** the iframe is mounted but has not reported loaded state
- **THEN** the modal displays a visible embed loading state with spinner or equivalent loading affordance
- **AND** the modal exposes busy state accessibly
- **AND** the loading copy does not imply audio playback is active before iframe interaction.

### Requirement: Shell loading motion respects reduced motion

The app shell SHALL keep loading and transition motion compatible with reduced-motion preferences.

#### Scenario: Reduced motion is requested

- **WHEN** the browser reports a reduced-motion preference
- **THEN** route, overlay, and player loading indicators avoid nonessential sweeping, pulsing, or animated placeholder motion
- **AND** visible status text remains available.

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

### Requirement: Homepage hero scroll opacity is transition-free

The app shell SHALL keep homepage hero opacity state free of CSS opacity transitions and per-scroll custom-property writes.

#### Scenario: Shopper scrolls through the homepage hero

- **GIVEN** the homepage hero is rendered in the persistent app shell
- **WHEN** the shopper scrolls from the hero into the next homepage section
- **THEN** the media layer, shade layer, grain layer, and scroll indicator update their hero scrolled state without declaring opacity transitions
- **AND** scrolling does not repeatedly start and cancel opacity transitions for those scroll targets
- **AND** the app shell does not write `--homepage-hero-scroll-progress` on every scroll frame.

#### Scenario: Scroll state changes only at the coarse threshold

- **GIVEN** the homepage hero scroll sync is connected
- **WHEN** repeated scroll events stay on the same side of the hero scrolled threshold
- **THEN** the app shell does not mutate the hero class repeatedly
- **AND** the app shell toggles the scrolled class when the threshold state changes.

#### Scenario: Reduced motion remains respected

- **WHEN** the browser reports a reduced-motion preference
- **THEN** the homepage hero keeps nonessential animation and transition behavior disabled by the existing reduced-motion rules
- **AND** the scroll-progress opacity fix does not remove visible content or status text.
