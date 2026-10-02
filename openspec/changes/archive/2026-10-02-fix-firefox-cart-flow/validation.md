# Validation

## Scope and identity

Prepared from main `71e3ccec876b4023bf0902c476e9dbc190758a36` in the managed `firefox-cart-flow` worktree on `codex/fix-firefox-cart-flow`. Product Environment: Local with browser-safe API fixtures. Acceptance rows: public cart presentation and shell/player continuity. Worker/provider authority and release acceptance are excluded because those seams are unchanged and promotion is not part of this request.

## Regression evidence

Before changing the drawer, `pnpm test:e2e e2e/store-cart.spec.ts --project=firefox-compact --grep 390x667 --workers=1` failed because Close cart did not exist. The summary, screenshot and trace are retained in `.codex-artifacts/e2e-before-close/`.

The first expanded run exposed test assumptions: Firefox programmatic focus did not imply a focus-visible ring, its headless mocked iframe click did not emit the parent blur signal, and Chromium's mixed raw-CDP-swipe/mouse-removal/tap sequence did not dismiss the empty cart. Coverage now explicitly tests keyboard navigation for the ring, supplies the mocked provider blur only in Firefox, retains Chromium CDP swipes and click dismissal in the overflow test, and tests trusted Close/Continue/BUY taps in the separate compact lifecycle check. No production BUY, shared scroll lock or player lifecycle code changed.

The subsequent desktop Chromium persistence test reported `ERR_NO_BUFFER_SPACE` after its assertions. Its failure remains recorded in `.codex-artifacts/e2e-cart-expanded/`; the final one-worker run passed that test without filtering console errors.

## Checks

- Cart unit tests: 40 passed across four files.
- Shell unit tests: 217 passed across 43 files; `.codex-artifacts/cart-shell-unit.log`.
- Workflow contract and affected tooling checks passed; `.codex-artifacts/cart-workflow-unit.log`.
- Strict OpenSpec validation passed.
- Graphify refreshed after the code batch; `.codex-artifacts/cart-graph-update.log`. CodeGraph supplied the current drawer source and callers.
- Firefox and Chromium compact overflow checks passed at 320×568, 390×667 and 390×844, covering loading, delivery errors, long titles, empty carts, reload persistence, pinned controls and stationary background scrolling.
- Visually inspected the Firefox 390×667 scrolled screenshot; heading, Close and footer controls remain legible and reachable.

- Final browser command: `pnpm test:e2e e2e/store-cart.spec.ts e2e/player-continuity.spec.ts e2e/shell-navigation.spec.ts --grep 'cart content|add to cart opens|three-item|player survives|Back closes|header section link|detail link|Escape closes the Menu' --workers=1`: 20 passed, eight intentional project skips. `.codex-artifacts/e2e/summary.json` records the selected cases, including all four dismissal paths followed by BUY in every cart project. Separate player browser checks use mocked providers and do not establish hosted playback acceptance.
- `pnpm validate`: passed in Local mode; initial passing summary `.codex-artifacts/validation/2026-10-02T15-32-25-803Z-82820-6aaa33/summary.json`, matching before/after fingerprint `0c035ea9a86645b5dd42bcaa8171f16b69b9e4931dc69df15cd30d626c28affa`. Validation formatted the tests and reran affected checks when source changed. The final browser run used the formatted source.
- After this documentation update, the final validation summary and matching source fingerprints are indexed by `.codex-artifacts/cart-final-evidence.json`. Successful code checks are reused only through the validator's source-bound cache.

## Pending hosted acceptance

After local integration, worktree artifacts are preserved under `C:/Users/SVall/WebstormProjects/blackbox-records/.codex-artifacts/merged-firefox-cart-flow/`. Paths above remain relative to that preserved artifact tree. Archiving and merging locally do not close the Android incident or authorize PRD promotion.

Earlier isolated UAT desktop Firefox probes passed scrolling, dismissal and a fourth item on release `e818b709a2364aa29dfd54cadcd0433779a1f263`; they do not cover this new source or real Android. The reported Android Firefox UAT incident remains open. Require a real Android Firefox UAT check of all dismissal paths, scrolling and subsequent BUY before PRD promotion. Verify PRD through the existing release gates after promotion. No hosted deployment or checkout was performed for this implementation.
