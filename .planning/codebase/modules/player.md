# Module Canvas: player

## Responsibility

Own player-provider metadata, embedded-player session state, and the listen-trigger contract used by shopper-facing
routes and cards.

## Owned Files And Directories

- `apps/web/src/components/app-shell/player-provider-data.ts`
- `apps/web/src/components/app-shell/player-provider-data.test.ts`
- `apps/web/src/components/app-shell/player-provider-warmup.ts`
- `apps/web/src/components/app-shell/player-provider-warmup.test.ts`
- `apps/web/src/components/app-shell/player-iframe-session.ts`
- `apps/web/src/components/app-shell/player-iframe-session.test.ts`
- `apps/web/src/components/app-shell/player-session-machine.ts`
- `apps/web/src/components/app-shell/player-session-machine.test.ts`
- `apps/web/src/components/app-shell/player-session-ui.ts`
- `apps/web/src/components/app-shell/player-session-ui.test.ts`
- `apps/web/src/components/music/MusicStreamingServiceListenTrigger.astro`
- `apps/web/src/utils/music.ts`
- `apps/web/src/utils/music.test.ts`

## Provided Interface

- listen-trigger rendering contract
- player iframe session/cache helpers
- player session reducer and presentation state
- provider descriptor data
- rendered listen-trigger dataset readers and default-provider selection
- provider origin warmup helpers

## Internal Implementation Area

- embed URL building details
- player trigger dataset parsing and provider priority
- provider warmup and label details
- provider origin preconnect and DNS-prefetch details
- iframe DOM attributes, cache pruning, and active/inactive iframe marking
- player session state derivation internals

## Allowed Dependencies

- `platform-shared`

## Named Interfaces / SPI Surfaces

- none required initially

## Published Events

- none formal today

## Listened-To Events

- none formal today; the shell consumes rendered trigger metadata through the DOM contract

## Verification Strategy

- keep unit coverage on iframe session/cache helpers, session machine, UI derivation, provider data, provider warmup, and
  music helper output
- prevent shopper-facing modules from owning iframe or session state directly

## Tests Required Before Refactors

- existing player helper tests
- `player-iframe-session.test.ts`
- `player-provider-warmup.test.ts`
- `utils/music.test.ts`
- Browser Use listen-trigger compatibility checks when touched through the shell

## Migration Status

`closed`
