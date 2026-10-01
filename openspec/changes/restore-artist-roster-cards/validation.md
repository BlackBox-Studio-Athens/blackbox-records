# Validation

Source: branch `claude/restore-artist-photos-aeca04`, uncommitted working tree on base `5a713e71` (`main`). Evidence was recorded on 2026-10-01. This file and `tasks.md` were finished before the final `pnpm validate`. That run's pointer lives in `.codex-artifacts/restore-artist-cards/final-validate.txt`, which is ignored.

Product Environment: Local.

Acceptance rows:

- **Shell/player/routing:** the cards sit on shell routes and the artist overlay.
- **Staff/editor:** the artist picker frame and its guidance changed.
- **Boundaries/tooling/instructions:** the `artists` module exports and the agent docs changed.
- **Not applicable:** CMS/schema/publication, commerce and release. Nothing in this change touches them.

## Commands

| Command                                                                                         | Result                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test apps/web/src/pages/_artist-roster-layout.test.ts`                                    | Passed. `web-pages`: 10 files, 30 tests.                                                                                                                                                                                                                                                                                                                                                                |
| `pnpm --filter @blackbox/web build`                                                             | 349 pages built. The static cache policy, brand font and `image-markup:check` passed.                                                                                                                                                                                                                                                                                                                   |
| `pnpm test:e2e`                                                                                 | 35 passed, 5 skipped, against this worktree's `astro dev` on port 4321. Each skipped test targets the other viewport project.                                                                                                                                                                                                                                                                           |
| `pnpm validate:editor`                                                                          | Passed, run `2026-10-01T09-39-49-634Z-87828`: staff build, preview policy, and the Chromium and Firefox workspace runs.                                                                                                                                                                                                                                                                                 |
| `pnpm openspec -- --allow-worktree validate restore-artist-roster-cards --type change --strict` | Valid.                                                                                                                                                                                                                                                                                                                                                                                                  |
| `pnpm agent:check`                                                                              | Agent guidance OK (4 documents).                                                                                                                                                                                                                                                                                                                                                                        |
| `node --import tsx scripts/check-module-projects.mjs && pnpm check:boundaries`                  | Passed: module test ownership, the module boundary audit, dependency-cruiser (621 modules) and the commerce boundary audit.                                                                                                                                                                                                                                                                             |
| `pnpm validate`                                                                                 | First two runs: an Nx plugin worker timed out ("did not receive a load message within 10 seconds"), once while `astro dev` was starting and once in `workspace:architecture`. Under that load, `check-module-projects.test.mjs` also failed after 52 s, and the bail stopped the remaining tasks. Both architecture checks pass when run directly (row above). For the final run, see the pointer file. |

## Browser observations

Local `astro dev`, viewport emulation in the built-in browser pane. The pane was hidden, so evidence is DOM measurement and one partial screenshot.

**1440 × 900, Artists:**

- The Afterwise, Chronoboros and Ouranopithecus frames are each 345 × 460.
- Each main photo is loaded, uses `object-fit: contain` and sits above its fill. The fill renders `blur(24px) brightness(0.45)`.
- Genre and name start below the frame. No card contains a gradient class.
- The screenshot shows the whole Afterwise landscape photo with blurred bands above and below it, and the whole white Chronoboros logo with a grey blurred fill above it.
- Hovering Chronoboros sets the photo's `scale` to 1.03 with a 0.5 s transition. The frame clips it, and the fill keeps its static 1.15 transform. The classes match the News card image (`transition-transform duration-500 group-hover:scale-[1.03]`); the artist cards add `motion-safe:` gating.

**390 × 844, Artists and Home:**

- Every frame is 356 × 475, with the name below it and no gradients.
- `scrollWidth` equals `innerWidth` (390), so there is no horizontal overflow.
- On Home, each fill has `alt=""`, `aria-hidden="true"` and no `fetchpriority`. The page has one high-priority image, the hero.

**Artist detail (Chronoboros):**

- Direct load at 1440: the frame is 553 × 469, with the fill first and then the photo. The photo uses `contain` with `fetchpriority="high"`, and it is the page's only high-priority image.
- Overlay opened from the Artists card: the frame is 562 × 476 and the fill is loaded.

**Rendered fill:** one 160 px WebP at quality 40 (Chronoboros: `w=160&h=160&q=40&f=webp`), loading the same way as its card.

## Not verified

- Full-viewport screenshots. The built-in pane was hidden and its renders timed out, Claude in Chrome had no connected browser, and another session held the DevTools MCP profile.
- Reduced motion. The `motion-safe:` classes cover it, but it was not emulated.
- UAT and PRD rendering, which need a release.
