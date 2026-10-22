# Validation note

## Source and repository gates

- Worktree `.claude/worktrees/ux-laws-review-fixes`, branch `worktree-ux-laws-review-fixes`, base `d4d98b40241c1a74b59a067eef9be842f57cb7ac` (release 626), uncommitted.
- `pnpm validate`: **passed**, `mode: local`, one pass, 3 slots.
  - Source fingerprint before and after: `146ed3ae5eda68da5295820aead97551724e95a0cdb984601173079b3518dd30` (42 changed files).
  - Summary: `.codex-artifacts/validation/2026-10-22T11-43-23-220Z-39656-b542a2/summary.json`.
  - Two earlier runs failed and were fixed: two lint idioms in test files, and a partial Stripe gateway mock type in `delivery-quote.worker.test.ts`.
- `pnpm build:web` passed, including cache policy, Veneer delivery, image markup and sitemap checks. The News lead image slot check moved to the 660px reading card.
- `pnpm performance:bundles` (Codex): initial shell closure 41,149 Brotli bytes against 104,448 allowed; evidence in `.codex-artifacts/ux-laws-group5/bundle-graphs.json`.

## Product Environment and acceptance rows

Product Environment: Local only (Playwright web server built from this worktree). Selected behaviour:

| Behaviour | Evidence |
| --- | --- |
| Phone item buy bar (present at load, leaves on reach, one-way, fling, same action, cart opens) | `e2e/store-buy-bar.spec.ts`, chromium-mobile |
| Buy bar motion: zero layouts during transition, reduced motion instant | `e2e/store-buy-bar.spec.ts` (Chromium LayoutCount) |
| Mini player lifts above the bar and returns; no bar or lift after shell navigation | `e2e/store-buy-bar.spec.ts` |
| No bar from 40rem | `e2e/store-buy-bar.spec.ts`, chromium-desktop |
| Pre-order cart Checkout readable on Sea Green | `e2e/store-buy-bar.spec.ts` colour check, `touch-ergonomics-css.test.ts` |
| News 60 to 75 and About 55 to 75 characters per line on desktop; phone layout unchanged; About contact list fits | `e2e/reading-measure.spec.ts` |
| Newsletter order and consent error placement, Services General, cart copy, drawer pending rows | component tests plus phone screenshots |
| Regression: store cart, checkout loading and delivery recovery, About contact, shell navigation, player continuity, item pre-orders, international cart | 164 passed in the first combined run, failures fixed and rerun green (see below) |

Excluded rows, with reasons:
- CMS, Content Publication and provider (Stripe or Resend) acceptance: no content or provider change ships here. The Caregivers slug rename is a separate, owner-approved publication.
- Hosted UAT and PRD behaviour and live timing: not deployed.

## Browser runs and results

- First combined regression run: 164 passed, 25 skipped by their own project tags, 12 failed.
  - **Cart description:** existing expectation for the old drawer description. Updated to "Review your items before checkout."
  - **Duplicate locators:** two `.preorder-badge` and two "Pre-order" buttons inside the purchase group (bar and inline). The bar status got its own class, and the item pre-order spec now targets the inline action.
  - **Firefox mixed-cart:** a console error from `PortalErrorBoundary` in `store-cart.spec.ts:672` at 440px. It did not reproduce on the rerun and is treated as a flake; its cause was not identified.
- Reruns: `store-cart`, `store-item-preorders` and `store-buy-bar` passed across projects (84 passed, then 7 of 7 for item pre-orders).
- Screenshots: `.codex-artifacts/design-review/ux-laws-2026-10-22/after/`. Files: phone buy bar, phone cart pending with Sea Checkout, phone Services General, phone newsletter consent error, desktop News and About.

## Not verified

- Buy bar smoothness on a real phone (measured only in headless Chromium).
- Hosted latency savings from group 5 (expected, not measured).
- The Caregivers redirect against the published `/news/caregivers/` page (it needs the CMS rename).
- The Firefox mixed-cart flake's root cause.
- Graphify was not updated: this worktree has no graph. Run `graphify update .` after merging.
