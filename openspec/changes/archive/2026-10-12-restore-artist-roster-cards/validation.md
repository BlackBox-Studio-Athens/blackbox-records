# Validation

Source: branch `claude/restore-artist-photos-aeca04`, with `5051a3da` rebased onto `main` at `622e0173`. A follow-up commit adds these notes. Evidence was recorded on 2026-10-01. The first round ran on base `5a713e71`. The second ran after a rebase onto `f07cb698`; that is the rebased tree the notes below refer to. This file and `tasks.md` were finished before the final `pnpm validate`. That run's pointer lives in `.codex-artifacts/restore-artist-cards/final-validate.txt`, which is ignored.

Product Environment: Local.

Acceptance rows:

- **Shell/player/routing:** the cards sit on shell routes and the artist overlay.
- **Staff/editor:** the artist picker frame and its guidance changed.
- **Boundaries/tooling/instructions:** the `artists` module exports and the agent docs changed.
- **Not applicable:** CMS/schema/publication, commerce and release. Nothing in this change touches them.

## Rebase onto `main`

`main` gained the public button family (`unify-public-buttons`).

- **`ArtistRosterIndex.astro`:** it stays deleted. `main`'s only change there was the View artist link class.
- **`ArtistsRosterFilters.tsx`:** the restored filter takes `main`'s Clear button style, a plain `Button variant="ghost"`. `main`'s genre and sort chips leave with the crate index.
- **`global.css`:** the conflict held only crate-index rules, which are dropped.
- **Unstyled classes:** every custom class in the restored markup has a rule, except `prose-link-card`, `artist-roster-card__image`, `artist-detail-listen-trigger` and `artist-detail-route-link--back`. Those four are unstyled hook classes both before the redesign and on `main`.
- **Editor inputs:** up to `f07cb698`, `main` changed no staff or editor-test inputs (`apps/staff`, `packages`, `scripts/test-content-workspace.mjs`, `scripts/test-preview-policy.mjs`).
- **Last rebase:** the move to `622e0173` added two independent commits and applied cleanly. `fbe63247` links release artist names, adding one helper to `catalog-data.ts` and release styles to `global.css`. `622e0173` renames the staff About label. The editor acceptance run predates that staff label change, which its own change validated. No code uses an identifier this change removes.

## Commands

| Command                                                                                         | Result                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test apps/web/src/pages/_artist-roster-layout.test.ts`                                    | Passed before and after the rebase (`web-pages`: 10 files, 30 tests before).                                                                                                                                                                                                                                                 |
| `pnpm --filter @blackbox/web build`                                                             | Passed after the rebase: 349 pages, plus the static cache policy, brand font and `image-markup:check`.                                                                                                                                                                                                                       |
| `pnpm test:e2e`                                                                                 | After the rebase: 37 passed, 5 skipped, 0 flaky, against this worktree's `astro dev` on port 4321. Each skipped test targets the other viewport project. Before the rebase: 35 passed, 5 skipped.                                                                                                                            |
| `pnpm validate:editor`                                                                          | Passed before the rebase, run `2026-10-01T09-39-49-634Z-87828`: staff build, preview policy, and the Chromium and Firefox workspace runs. The rebase changed none of its inputs.                                                                                                                                             |
| `pnpm openspec -- --allow-worktree validate restore-artist-roster-cards --type change --strict` | Valid.                                                                                                                                                                                                                                                                                                                       |
| `pnpm agent:check`                                                                              | Agent guidance OK (4 documents).                                                                                                                                                                                                                                                                                             |
| `node --import tsx scripts/check-module-projects.mjs && pnpm check:boundaries`                  | Passed before the rebase: module test ownership, the module boundary audit, dependency-cruiser (621 modules) and the commerce boundary audit.                                                                                                                                                                                |
| `pnpm validate`                                                                                 | Before the rebase, two runs hit an Nx plugin worker timeout ("did not receive a load message within 10 seconds") under machine load. A third run with `NX_PLUGIN_NO_TIMEOUTS=true`, which disables only that timeout, passed: `2026-10-01T10-00-43-692Z-73268`. For the final run on the rebased tree, see the pointer file. |

## Browser observations

Local `astro dev`, in the built-in browser pane.

**Screenshots after the rebase:**

- **Artists at 1280 × 800:** three columns. The Afterwise, Chronoboros and Ouranopithecus frames are each 345 × 460, every photo is whole, and the names sit below.
- **Artists at the pane's 709 px:** two columns. Afterwise shows blurred bands above and below. Chronoboros shows the whole white logo over a grey blurred fill, with no band near the name.
- **Home featured roster:** the same three cards. The small fill loads first, then the photo appears over it.
- **Afterwise artist page:** the whole photo, thin blurred bands, and genre, country and name below.
- **Hover on Chronoboros:** the photo's `scale` reaches 1.03 and the fill does not scale. The classes match the News card image (`transition-transform duration-500 group-hover:scale-[1.03]`); the artist cards add `motion-safe:` gating.

**DOM checks before the rebase:**

- **1440 × 900:** frames are 345 × 460. Main photos use `object-fit: contain` above a `blur(24px) brightness(0.45)` fill, and no card contains a gradient class.
- **390 × 844:** every frame is 356 × 475, with the name below it. `scrollWidth` equals `innerWidth`.
- **Home fills:** each has `alt=""`, `aria-hidden="true"` and no `fetchpriority`. Home has one high-priority image, the hero.
- **Artist detail:** on direct load the photo is the only high-priority image. The overlay renders the fill.
- **Rendered fill:** one 160 px WebP at quality 40 (Chronoboros: `w=160&h=160&q=40&f=webp`), loading the same way as its card.

## Not verified

- Reduced motion. The `motion-safe:` classes cover it, but it was not emulated.
- UAT and PRD rendering, which need a release.
