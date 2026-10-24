# Claude UI acceptance return

Source: `main` at `e29a60ba` plus the uncommitted upgrade tree, 23 October 2026.

## Staff bundle budgets

- Baseline: HEAD was exported with `git archive` and built in a temp folder; this is not a worktree. Upgraded: the current tree.
- Every Staff route grew by about 1.0 KiB Brotli. The growth sits in shared Radix chunks: `dist` +381 and +330 bytes, `dropdown-menu` +77 and `content-sections` +101 (about 790 bytes from radix-ui 1.6.7 → 1.8.1). The Vite `preload-helper` added 99 bytes.
- The owner approved a 5 KiB raise for both routes: overview 121 → 126 KiB and orders 129 → 134 KiB, in `scripts/check-runtime-bundle-graphs.ts`. `pnpm performance:bundles --scope=staff` passes. No UI components changed.

## Playwright hold

- On Playwright 1.64.1, Firefox `page.setViewportSize` hangs, even on `about:blank`; a standalone probe timed out at the first resize. Playwright 1.63.0 with the same probe resizes in 30–65 ms. Upstream report: microsoft/playwright#43028. No fixed stable release exists; only 1.65 alphas.
- `playwright` is held at 1.63.0, and renovate caps it below 1.64.0.

## Browser results (Local dev stack, `pnpm test:e2e`)

| Run               | Specs                                                                                       | Result                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Playwright 1.64.1 | player-continuity, shell-navigation, store-cart, home-scroll, release-merchandising, routes | 273 passed, 17 failed (16 Firefox `setViewportSize` timeouts, 1 WebKit cart quantity poll) |
| Playwright 1.63.0 | release-merchandising, store-cart                                                           | 156 passed, 1 failed, 8 skipped. All 17 earlier failures passed.                           |

The remaining failure is `store-cart.spec.ts:621` on `firefox-desktop`, where `waitForLoadState('networkidle')` on Home timed out after 90 s. Results with `--repeat-each`:

| Tree                                                                 | Failures |
| -------------------------------------------------------------------- | -------- |
| Upgraded tree                                                        | 3/20     |
| HEAD                                                                 | 0/20     |
| HEAD + astro 7.4.2, @astrojs/react 7.1.1, @vitejs/plugin-react 6.1.2 | 2/20     |
| HEAD + astro 7.4.2 only                                              | 1/20     |

- Trace: every recorded request finished within 11 s. Only the Vite HMR websocket stayed open. A standalone Firefox probe of Home on the same dev server reached `networkidle` in 12 of 12 runs.
- Likely cause: an interaction between Astro 7.4's dev server and this test's route fixtures. The cause is not established. Production builds are not covered by this evidence.

## Limits

- Staff browser previews were not run locally. `validate:editor` needs a maintainer grant, and CI runs them. Staff unit tests passed in the Codex batch.
- No manual visual review of Motion 14 or reduced motion. The home-scroll and player-continuity E2E specs passed.
- No commits, pushes or hosted work.

## Networkidle flake: root cause and fix

- Root cause: Playwright's Firefox `networkidle` lifecycle can miss an idle Home page and never fire. In timed-out runs, request, frame, websocket and history diagnostics found no open request, no child frame and no reload. Playwright's trace recorded all 150 resources finished, and the second "navigation" was the shell's `history.replaceState`. Astro 7.4's dev-server timing makes the miss more frequent. CI uses `astro preview` and is not affected.
- Rejected: routing Vite's HMR socket. Failures stayed at 8 in 50 runs, so the change was reverted.
- Fix: `store-cart.spec.ts` waits through `watchNetworkQuiet` (`e2e/fixtures.ts`). It uses the client-side request tracking that `watchSurfaceWarmup` already relied on for this reason, and `watchSurfaceWarmup` now delegates to it.
- Proof: the test passed 90 of 90 runs (30 each on firefox-desktop, webkit-mobile and chromium-desktop), with no page or console errors. Before the fix it failed 3 of 20 on firefox-desktop.

## Other cart flake (pre-existing)

`store-cart.spec.ts:297` ("Buy on a Store card reopens a three-item cart…") flakes in Firefox and WebKit: a scroll that never settles, a drawer button that never becomes stable, or page errors. Over 15 repeats per project it failed 2 of 30 on the upgraded tree and 1 of 30 on HEAD. It is not attributable to the upgrade.

## Three-item cart flake (`store-cart.spec.ts:297`): root cause and fix

- Root cause: the test does two Store loads and seven drawer round trips. On the local dev server it took 37–66 s at the median and up to 90 s, against Playwright's 90 s default. Runs that crossed 90 s failed at whatever step they had reached (scroll settle, drawer stability, iframe focus, quantity poll), which is why the symptoms varied. About 30 s of each run is the dev server loading the Store page module by module. The pre-upgrade tree showed the same profile (WebKit max 66 s).
- Fix: `test.setTimeout(180_000)` with a one-line reason, following `player-continuity.spec.ts` and `store-formats.spec.ts`. Firefox then passed 30/30 (max 47 s). WebKit passed 28/30, and the 5 runs over 90 s that would have failed before passed.
- Resolved, not caused by the upgrade: the rare WebKit Listen tap that opened no player came from modifier flags on the synthesized click (9/9 misses; the host keyboard was in use), which the shell ignored for buttons as well as links. See `openspec/changes/fix-modified-button-clicks/`. One Firefox run also hit a Playwright protocol error on context close (`_maybeDontRestoreTabs`), a Firefox driver bug.
- Store activation profiling found and fixed about 150–250 ms of redundant main-thread work per Store or Distro load. See `openspec/changes/reduce-store-activation-work/`.
