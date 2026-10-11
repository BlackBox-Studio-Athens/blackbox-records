# Validation

Product Environment: Local, on `main` at `1777a16d` with this change uncommitted. A concurrent owner's `#releases-merchandising` padding edit in `apps/web/src/styles/global.css` was in the tree during the runs; it is not part of this change.

Acceptance rows:

- **Shell/player/routing:** unit tests, the player-continuity spec and the related Store and shell specs.
- **Boundaries/tooling/instructions:** strict OpenSpec validation and `pnpm agent:check` for the agent-reference line.
- **Staff/editor:** the staff Bandcamp paste test only.

CMS/publication, Commerce and Release/environment do not apply, because nothing in content, the Worker or hosting changed.

## Bandcamp research

On 2026-10-11 the live `EmbeddedPlayer` bundle read these options: `bgcol`, `linkcol`, `transparent`, `size` (`small`, `medium` or `large`), `artwork`, `tracklist`/`notracklist`, `t`/`track`, `package`, `width` and `campaign`.

- A dark `bgcol` adds `theme-dark` and inverted icons, and `transparent` skips the player's own background.
- `minimal` and `fgcol` have no effect outside the legacy classic style.
- There is no autoplay and no playback API. The only message to the parent window is `playerinited`.

## Checks

- Vitest:
  - `pnpm test app-shell`: 45 files and 290 tests passed.
  - `pnpm test player`: 6 files and 42 tests passed.
  - These also passed: `music.test.ts`, `distro-content-schema.test.ts`, `editorial-validation.test.ts` and the staff `content-validation.test.ts` (27 tests).
- Playwright `player-continuity.spec.ts --repeat-each=2`: the new Store Item and Withdrawal test passed in every project, 23 of 24 runs overall. The one failure was the existing first test on `webkit-mobile`, at its Minimize step on `/releases/`, before any routing this change touches. Run alone, the unmodified baseline passed on `webkit-mobile`, so this is a WebKit tap flake under parallel load.
- Related specs (shell navigation, Store Crate, cart, Store Item pre-orders, shell islands, withdrawal, release merchandising): 173 passed and 2 failed.
  - `store-crate` "Back from an item page reopens the Crate" was a real regression, fixed in `crate-switch.ts` (see design). `store-crate.spec.ts` then passed 12 with 1 skipped.
  - The `webkit-mobile` cart failure and two Firefox cart failures in a later `store-cart.spec.ts` run (70 passed) use full-page loads, not the new routes. The Firefox tests passed when rerun alone (3 passed).
- `pnpm openspec -- validate extend-listening-continuity --type change --strict`: valid.
- `pnpm agent:check`: Agent guidance OK.
- `pnpm validate`: passed, `mode: local`. Summary: `.codex-artifacts/validation/2026-10-11T19-03-11-535Z-52732-436827/summary.json`.

## Unverified

- No real Bandcamp embed was opened in a browser. The house URL is unchanged for all 93 committed embeds.
- No PRD CMS entry was checked for light embeds.
- Hosted UAT/PRD behaviour is unverified.
