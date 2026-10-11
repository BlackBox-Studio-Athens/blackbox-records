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

`f7b019ca` adds the logo export, its ESLint ignore and the `eqeqeq` fix.

**Final `pnpm validate`:** passed, `mode: local`, on a clean tree at `76d9acfa`. The before and after fingerprints match (`e3b0c442…`, 0 changed files). Summary: `.codex-artifacts/validation/2026-10-11T02-28-45-946Z-40648-af2d7a/summary.json`. Nx flagged `web-pages:test` as flaky on this run, and it passed. Two earlier runs failed only on `cms-runtime:test` workerd timeouts while other sessions loaded the machine. This change does not touch that module.

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

**Not run:** the before/after `desktop-load`, `mobile-load`, `wide-scroll` and `mobile-scroll` comparison. It needs a baseline build of the pre-change commit, and a separate worktree requires the user's request. LCP, CLS and scroll on the Grid are therefore not compared.

## Remaining gaps

- **Tape rack:** dormant, because Distro has 4 tapes. It is covered by unit tests only, with no browser check.
- **Wheel stress at 4× CPU:** long tasks over 50 ms. Possible follow-ups are coalescing rapid notches into one thumb, and fewer transition restarts per flip.
- **Not established:** UAT and PRD behaviour, real-device touch feel, Safari trackpad wheel and Back history limits.
- **Workflow:** `simplify-main-site-modules` sections 9 and 12 should run after this change. `replace-sveltia-with-emdash-operations` keeps an outdated Coverflow scenario in its module-boundaries delta.
