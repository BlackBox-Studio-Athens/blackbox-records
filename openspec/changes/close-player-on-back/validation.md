# Validation

Product Environment: Local, on branch `claude/bandcamp-back-key-android-95fc49` from `main` at `00afb49c`. These notes are written before the final `pnpm validate`. Its summary path, source fingerprint, mode, status and exit code are retained in `.codex-artifacts/back-key/final-validation.json`, so recording the result does not change the tested tree.

Acceptance rows: Shell/player/routing (unit tests, the player-continuity spec, the full Playwright run and a phone browser pass) and Boundaries/tooling/instructions (strict OpenSpec validation and `pnpm agent:check` for the agent-reference line). Staff/editor, CMS/publication, Commerce and Release/environment do not apply: no staff, content, Worker or hosted change.

## Reproduction before the change

On PRD (`blackbox-records-web.pages.dev`, desktop Chrome), the open player kept `history.length` at 1 through embed load and play. With the player open on `/artists/` after a shell navigation, Back switched the page behind it to `/releases/` and the modal stayed open. With the cart drawer open, Back did the same, which is the deferred follow-up.

## Checks

- Focused Vitest (`vitest run --config vitest.modules.config.ts` from `apps/web`): the new `player-modal-history` tests, popstate routing, document event routing and the session controller, 4 files and 37 tests passed. All of `src/components/app-shell` and `src/components/music`: 47 files and 249 tests passed.
- `astro check`: 0 errors and 0 warnings; the one hint is the existing deprecated `ZodIssueCode` in `store-cart.ts`.
- Playwright `player-continuity.spec.ts`: both tests passed twice (`--repeat-each 2`). Port 4321 belonged to another worktree's Astro and 4331 to another session, so this tree's Astro served 4341 under the ignored override `.codex-artifacts/back-key/playwright.config.ts`.
- The new Back step guards the routing hazard. With the same-URL early return disabled, it failed because the page jumped 925px to the top (`.codex-artifacts/back-key/e2e-mutation.log`). The step now waits for Minimize before Back, so the embed interaction is registered, as in the existing test.
- Playwright, all specs: 41 passed and 5 skipped (project-conditional desktop or phone tests), including the shell navigation, overlay and Menu specs. Summary: `.codex-artifacts/back-key/e2e/summary.json`.
- `pnpm agent:check`: Agent guidance OK.
- `pnpm openspec -- validate close-player-on-back --type change --strict --allow-worktree`: valid.

## Browser

DevTools MCP page with 390 × 844 mobile emulation and an Android user agent, against this tree's Astro on 4341 with the real Bandcamp embed. Screenshots are in `.codex-artifacts/back-key/`. Claude in Chrome's tab group window was occluded (`visibilityState` hidden), which pauses animation frames the shell waits on. Focusing the embed iframe stood in for tapping play; it is the shell's own interaction signal and avoids audible playback.

- From Artists, a shell navigation to Releases, then the last Listen at `scrollY` 1425. The player entry carried `__appShellPlayerModal` beside the section marker. Browser Back minimized the session (floating player shown) with the URL, `scrollY` and heading unchanged. A second Back went to Artists with the session alive (`01-back-minimized-390.png`).
- Forward twice: Releases, then the player entry, which reopened the minimized player without routing. Back minimized it again.
- After Stop, Listen without interaction and Back: the session stopped, its iframe was removed, `scrollY` (555) and the URL stayed, and focus returned to Listen.
- The Close control and a dispatched Escape keydown each closed the player and left the base entry current; one Back then reached Artists.
- Listen inside the Disintegration overlay, then Back: only the player closed and the overlay stayed at its URL (`02-back-in-overlay-keeps-overlay-390.png`). The next Back closed the overlay.
- Switching to the Tidal tab added no history entry; one Back closed the player.
- No console errors or warnings.

## Not verified here

- Android's hardware Back key and Back gesture could not be pressed on desktop. Without a close watcher in the page they perform the same session-history traversal as browser Back. The label's phone check follows a UAT release.
- Real audio playback was not started; interaction was signalled by focusing the iframe.
- Hosted UAT and PRD were not exercised with this change and nothing was released.
