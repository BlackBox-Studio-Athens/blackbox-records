# Mobile cart validation

## Reproduction

Native Chrome in the blackbox profile reproduced unscrollable overflow on UAT at 390x844 and PRD at 390x667. UAT's Checkout began at y846 and Continue Shopping at y906; PRD's Continue Shopping began at y766 with a 667px viewport. Cart quantity increases and a second product add worked after closing the drawer. UAT probe items were removed; the existing PRD cart was inspected without changing its lines.

The focused pre-fix command `pnpm test:e2e e2e/store-cart.spec.ts --project=chromium-mobile -g "cart content scrolls above reachable actions at 390x667"` failed because Checkout's viewport intersection ratio was zero. Its report and screenshot are retained in `.codex-artifacts/e2e/mobile-cart-before-fix/`. The original cart component SHA-256 was `979621ca15e91f43906c0e41709bca36d849a30a41ca71d3d8e20f8058478322`.

## Local checks

- `pnpm test store-cart`: passed after the final cart edit, 4 files and 40 tests (2.99s).
- `pnpm test:app-shell`: passed fresh after the final cart edit, 43 files and 217 tests (17.40s).
- `pnpm openspec -- validate fix-mobile-cart-scrolling --type change --strict`: passed.
- The 390x667 post-fix regression passed (8.0s test / 9.4s run), using trusted touch start/move/end events. Content moved without scrolling the page, Checkout and Continue Shopping remained fully visible through delivery loading/ready/unavailable states and three/two/one/zero lines, quantities persisted, focus returned, and a Store swipe worked after closing.
- Native Chrome Local at 390x667 also showed the delivery information scrolling above the fixed actions.
- The final command `pnpm test:e2e e2e/store-cart.spec.ts e2e/shell-navigation.spec.ts e2e/player-continuity.spec.ts --output .codex-artifacts/e2e/mobile-cart-final-results` passed 22 checks in 102s, with eight expected responsive-project skips and no failures or retries. Report: `.codex-artifacts/e2e/mobile-cart-final-summary.json`. Screenshot: `mobile-cart-final-results/store-cart-cart-content-sc-68bae-eachable-actions-at-390x667-chromium-mobile/cart-scrolled.png` within the same artifact directory.
- Both desktop and mobile repeated-BUY checks passed with the minimized player active: Continue Shopping remained clickable, a second product could be added, quantity and reload persistence worked, and the original iframe remained connected. Existing shell navigation/history/player checks also passed.
- The first integration run passed 20 checks, including all three phone overflow cases, but both repeated-BUY checks found the minimized player covering Continue Shopping. The cart surface now uses the existing content-overlay layer above the mini-player; the final run above verifies the correction.
- `pnpm validate` passed after the final cart edit with a stable source fingerprint in `.codex-artifacts/validation/2026-10-02T11-56-57-532Z-44540-0d475c/summary.json` (158.9s). The final evidence/task-note validation is retained at `.codex-artifacts/validation/mobile-cart-final-summary.json`.

Final browser source SHA-256 values:

- `StoreCartDrawer.tsx`: `7ff3a2bccb001e5ab000fe12fbfff98eabccd7f15af1fbab81d1c43389389bc8`
- `e2e/store-cart.spec.ts`: `a70669fdac6c0745573e2160eb32b84df900e0625c22cde5dbe39f9e93072aee`
- `playwright.config.ts`: `8375ff7f251158343a538f1a16de0fb7ce920575dc793aa8cfe793cf1c6c8dad`

One post-fix browser attempt could not load the lazy cart module during replacement of the shared Local server. Other chats observed the same Astro `504 Outdated Optimize Dep` failure in search/player checks. This attempt does not establish cart acceptance. The chats coordinated a single return to the normal Local mock stack, preserving CMS/D1 state.

An initial synthetic CDP scroll gesture did not move content; explicit trusted touch events passed. Concurrent browser runs also deleted shared trace staging files, so the successful cart runs use dedicated output/report paths.

## Release

UAT candidate, hosted mobile acceptance and PRD promotion are pending. Local checks do not establish provider or release acceptance.
