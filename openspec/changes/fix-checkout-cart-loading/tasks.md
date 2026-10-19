# Tasks

## 1. Truthful cart loading

- [x] 1.1 Distinguish unread cart state in both checkout islands, reuse loading feedback and withhold editing/payment; verify focused SSR and checkout tests.
- [x] 1.2 Preserve single-item fallback, saved-cart priority and cart update behavior; verify hydrated-state component regressions and browser quantity updates.

## 2. Browser acceptance

- [x] 2.1 Add the dedicated delayed-hydration regression at desktop and 390px, covering saved nonempty and genuinely empty carts, quote pending/failure/retry, unsupported delivery and compatibility entry, without payment submission.
- [x] 2.2 Record source-bound browser evidence and actual Local/provider/device limits in validation.md; inspect the pending and recovered screenshots.

## 3. Final integration checks

- [x] 3.1 Pass checkout-web tests, strict OpenSpec validation, Graphify refresh, git diff checks and pnpm validate on the stable final tree.

## Workflow follow-up

- Create one hydration-only Conventional Commit based on the reviewed delivery commit and return its full SHA, files and evidence to the coordinator; integration to main remains coordinator-owned.
