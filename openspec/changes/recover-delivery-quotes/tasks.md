## 1. Recovery

- [x] 1.1 Reproduce transient failure and distinguish unavailable-cart responses.
- [x] 1.2 Add current-cart retry, progress, duplicate protection and truthful status while preserving payment gates and shopper state.
- [x] 1.3 Verify abandoned requests cannot change the current quote.

## 2. Verification

- [x] 2.1 Add focused lifecycle and presentation regressions.
- [x] 2.2 Verify retry on desktop and 390px mobile with local mocked quote responses; do not submit payment.
- [x] 2.3 Run checkout-web tests, strict OpenSpec validation, Graphify update and pnpm validate; record source-bound evidence and limitations.
