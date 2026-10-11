# Validation

Product Environment: Local. UAT and PRD acceptance are not established.

## Source

Commits on `main`, all local and none pushed:

| Commit     | What                                                       |
| ---------- | ---------------------------------------------------------- |
| `146ee528` | OpenSpec baseline: thirteen completed changes archived     |
| `3334e16a` | This change's proposal, design, specs and tasks            |
| `52817b65` | Crate model, poses and input                               |
| `86309d1b` | Coverflow replaced by the Crate                            |
| `54844bd2` | Browser-pass fixes                                         |
| `dd43467c` | e2e coverage; sticky bar; a press during a flight lands it |
| `b536f73a` | Flip restyle fix; Crate performance profiles               |
| `c97fb060` | Docs                                                       |
| `061eb087` | Each sleeve image is assigned once                         |

`f7b019ca` adds the logo export, its ESLint ignore and the `eqeqeq` fix.

**Final `pnpm validate`:** passed, `mode: local`, at `061eb087`, with this note as the only uncommitted file. The before and after fingerprints match (`6cd1714c…`, 1 changed file). Summary: `.codex-artifacts/validation/2026-10-11T03-16-03-829Z-2756-ad73fd/summary.json`. An earlier pass on a clean tree at `76d9acfa` is at `2026-10-11T02-28-45-946Z-40648-af2d7a/`. Two earlier runs failed only on `cms-runtime:test` workerd timeouts while other sessions loaded the machine. This change does not touch that module.

## Acceptance rows

- **Applies:**
  - Shell/player/routing: Store routes, shell snapshots, Back and the player Listen path changed.
  - Boundaries/tooling/instructions: `web-store` exports, the `storefront-catalog` logo export, and the ESLint ignore.
- **Not applicable:**
  - Commerce: no Worker, API, D1 or StoreCart authority changed, and Buy stays the card's own button.
  - Staff, CMS/publication and Release: nothing in those areas changed.

## Checks and results

**Unit and type checks**

- Crate unit tests pass: 36, plus the snapshot and layout tests.
- `vitest` over `src/components/store`, `src/layouts`, `src/styles`, `src/pages`, `src/components/app-shell` and `test`: 149 files, 1206 tests passed.
- `astro check`: 0 errors.
- `pnpm check:boundaries`: passed, and the final `pnpm validate` passed with the logo export.
- `pnpm openspec -- validate replace-coverflow-with-crate --type change --strict`: valid.

**Build and bundles** (`pnpm build:web` passed)

- Store eager graph: 89,957 B Brotli, under the 102 KiB budget.
- Home: 107,634 B Brotli, under 106 KiB.
- The Crate view loads lazily in its own chunk: 32.8 KB raw, 10.3 KB Brotli.

**Built HTML** (checked directly)

- Store home and Distro render `class="store-crate"` with `data-store-crate="grid"`, bins `vinyl cd`, both switch buttons disabled, and no hand marker.
- BlackBox Releases (3 items) and Merch render no Crate.

**`pnpm store:categories:check`**

- Passed: All 101, BlackBox Releases 3, Distro 98, empty Merch redirect.
- Its card counts had been stale since `67361817` withdrew three Distro vinyl releases. They now match the catalog.

## End-to-end

**Why a side port.** 4321 first served the full stack's stale build, so a plain `pnpm test:e2e` would have tested old code. Specs ran instead with a throwaway config (`.codex-artifacts/e2e-crate/crate.config.ts`) against `astro dev` on 4391 for this checkout.

**`e2e/store-crate.spec.ts`**

- chromium-desktop: 8 passed.
- chromium-mobile: 2 passed.
- webkit-mobile: 1 passed, and the CDP touch case skips as designed.

**`e2e/store-formats.spec.ts`** (chromium-desktop and chromium-mobile): 11 passed.

**Regression specs:** `store-cart`, `store-preorders`, `player-continuity`, `shell-navigation` and `routes`, on chromium-desktop and chromium-mobile.

- 106 passed, 16 skipped, 1 failed.
- The failure was `shell-navigation` "closing a detail overlay by Close or Back…" on Releases, code this change does not touch. It passed on both reruns, so it is flaky under two-worker dev load.

**Not run:**

- Firefox projects. They do not include the Store specs.
- The CI preview suite (`BLACKBOX_E2E_PREVIEW=1`).

## Browser observations

These come from the in-app browser on the side port, at 1440 × 900 and 375 × 812:

- Distro opens on the first card on screen. Walking between bins with the format links keeps each bin's place.
- The back board and its end panel, Back to the start, and Lift the last one all work.
- Back from an item page reopens the Crate at the same sleeve.
- Store home's bin row works.
- On the phone, the bin scrolls under the header with the item in hand's Buy on screen.

## Performance

Measured with `pnpm preview` serving the build, using `crate-wheel` and `crate-touch` with 3 runs each.

**At 4× CPU slowdown**

- The first open lands in 740–950 ms.
- Every gesture turns exactly one sleeve, and the page never scrolls.
- Each flip restyles at most 61 elements. Before `b536f73a` it was 867: rewriting the counter and status text nodes made Chromium re-check the header cart's `:has(:focus-visible)` rule across `body`.
- `crate-touch`: frame interval p95 16.8 ms, longest task 61–97 ms.
- `crate-wheel` (24 notches 160 ms apart, each starting 540 ms transitions): frame p95 50–83 ms, longest task 110–165 ms. **This misses the 50 ms long-task target under the stress run.**

**Unthrottled `crate-wheel`:** no long tasks, frame p95 16.7 ms, open lands in about 660 ms.

**Evidence:** `.codex-artifacts/runtime-performance/crate-contain/`, with the earlier runs in `crate-settext/` and `crate-<sha>/`.

**Sleeve image fix (`061eb087`).** A CPU profile showed `load()` re-pointing every drawn sleeve's image on every render. It marked a sleeve with an empty `data-loaded` and then tested that for truthiness. Eight wheel flips made about 600 `src`/`srcset`/`sizes` assignments; they now make 24.

- `crate-wheel` at 4× CPU, 3 runs (`crate-loadguard/`): frame p95 33 ms in runs 1 and 2, against 50–83 ms before the fix.
- Run 3 (p95 100 ms, longest task 246 ms) ran while other sessions loaded the machine.
- Long tasks still reach 85–141 ms in the clean runs.

**What remains in a wheel flip.** Each flip lays out the whole document, 1,256 objects, because the item in hand, the counter, the rail and the status all change in normal flow. Size containment on the panel was tried and reverted: the counter and rail text still made the document the layout root. **The task's "no long task of 50 ms or more at 4× CPU" is not met.** Unthrottled, there are no long tasks.

**Lighter flips.** These trade some fidelity for speed:

- Within a bin, the panel (item in hand, counter, rail, status) now follows 180 ms after the hand pauses, so a run of flips redraws it once.
- Fewer sleeves are drawn behind the hand: desktop vinyl 3 (was 4), desktop CD 4 (was 6), phone CD 3 (was 5).
- Opening and walking between bins still redraw the panel at once.

Result: a frame that turns a sleeve no longer lays out the page. One wheel CPU profile at 4× CPU, 24 notches 160 ms apart, recorded no long tasks. `e2e/store-crate.spec.ts` passed 11, with 1 skip as designed. The full `crate-wheel` profiles were not rerun.

**Before/after comparison** (`3334e16a` against `061eb087`, both production builds served by `astro preview`, routes `store` and `store/distro`). Medians are in `.codex-artifacts/runtime-performance/crate-compare/summary.txt`.

| Profile                          | Before                 | After                  |
| -------------------------------- | ---------------------- | ---------------------- |
| `desktop-load` LCP, Store/Distro | 244 / 256 ms           | 244 / 252 ms           |
| `desktop-load` CLS               | 0.0001                 | 0.0000                 |
| `mobile-load` LCP, Store/Distro  | 1748 / 1680 ms         | 1616 / 1672 ms         |
| Transfer, desktop Store/Distro   | 754 / 732 KB           | 751 / 729 KB           |
| `wide-scroll` frame p95          | Store 17, Distro 33 ms | Store 34, Distro 17 ms |
| `mobile-scroll` frame p95        | 17 ms on both          | 17 ms on both          |

- Store `wide-scroll` was repeated twice per arm (`recheck-1/`, `recheck-2/`). The median frame p95 was 17 ms for both, first pass and repeat. Each arm had one outlier run, so the single slower first sample was noise.
- Load is unchanged or slightly better. Scrolling the Grid shows no regression within this machine's noise.
- Other sessions shared the machine during every run, so differences under about 30 ms of frame time are not meaningful.

## Remaining gaps

- **Tape rack:** dormant, because Distro has 4 tapes. It is covered by unit tests only, with no browser check.
- **Wheel stress at 4× CPU:** the deferred panel removed the long tasks in one profile. The three-run `crate-wheel` profile has not been repeated since that change.
- **Not established:** UAT and PRD behaviour, real-device touch feel, Safari trackpad wheel and Back history limits.
- **Workflow:** `simplify-main-site-modules` sections 9 and 12 should run after this change. `replace-sveltia-with-emdash-operations` keeps an outdated Coverflow scenario in its module-boundaries delta.

## Release recovery — 11 October 2026

The owner's UAT/PRD release request pushed the clean, fully committed `3f6973759e1344a4a3ff4cc87dfbc5e3371f0174` tree. Local validation passed 63 tasks and `pnpm build:web` passed. Push run [38109084237](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/38109084237) deployed UAT but failed its browser and checkout-state gates; it was not promoted to PRD.

The production-fixture failures exposed an 8px overflow from the Crate switch at a 195px layout viewport and gallery thumbnails declaring a 72px slot despite their smaller, contained phone image. The switch now reduces spacing only below 240px; thumbnail `sizes` follows the actual 62px desktop and 46px phone content boxes and the source aspect ratio. The existing portrait unit test checks both cover and thumbnail sizes.

Browser harness corrections preserve the asserted behavior: pending policy content contributes no privacy link to the production fixture; a native checkbox's associated label counts toward its clickable target; repeated WebKit cart scrolling reuses the settled-view helper with immediate scrolling; and the zoom test explicitly centers Pay before requiring full viewport visibility. No forced clicks, skipped cases or reduced acceptance thresholds were added.

The first focused production-preview run passed 32 cases. Its remaining zoom alignment and WebKit scroll cases drove the final immediate-scroll corrections. The corrected zoom and Chromium cart cases passed. A subsequent Windows WebKit trace showed the initial Listen tap consuming about 65 seconds of the unchanged 90-second test timeout while the catalog settled. Settling that control before tapping made the original WebKit cart case pass with the existing timeout. The new push must establish the complete original CI browser gates. Evidence is retained under `.codex-artifacts/release-monitor/2026-10-11/`, including the original CI logs, browser artifacts, build output and focused rerun logs. Final source-bound validation, commit and hosted identities are recorded in the release-monitor receipt.

UAT checkout was already enabled for the owner's manual tests. Release verification requires it closed, so one temporary settings update changed only `NATIVE_CHECKOUT_ENABLED` to `false`, preserving Worker code and all other settings. A later public capabilities read confirmed closure after propagation. Restore its prior manual-testing state after release verification. PRD controls, publication pointers, catalog, stock and DNS remain independently owned. Crate task 8.3 and the simplification change's private CMS Local-browser gate remain open.
