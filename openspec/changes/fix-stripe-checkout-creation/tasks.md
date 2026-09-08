## 1. Provider-Valid Expiry

- [x] 1.1 Run `pnpm openspec:guard`, trace the shared checkout/gateway/hold callers, and convert the delayed-expiry observation into a committed regression using an advancing provider clock; verify it fails on current behavior without relying on ignored audit files.
- [x] 1.2 Calculate the 35-minute provider deadline after hold creation, immediately before the SDK call; supply an order-derived idempotency key and verify delayed D1 work, rounding, and identical parameters across SDK retries without adding custom retry/timing machinery.
- [x] 1.3 Carry accepted provider expiry through session creation and normal/metadata-recovered binding; verify D1 stores the accepted expiry and the browser gains no authority fields.
- [x] 1.4 Distinguish definitive non-creation from uncertainty; verify expiry rejection releases, timeout/5xx/missing-URL/binding failures retain the hold and any known Session identity, and provider-confirmed expiry releases once without another create request.

## 2. Pay-What-You-Want Cart Validation

- [x] 2.1 Validate current Price kind after CartLine aggregation and before hold creation; verify one custom-Price line of quantity one succeeds while mixed carts, two custom Prices, quantity two, and duplicates merged to two reject with zero hold/Session writes.
- [x] 2.2 Add understandable cart/checkout guidance and guard custom-Price quantity controls using existing UI patterns; verify stale/tampered snapshots are still rejected by the Worker, cart contents remain intact, and fixed-price multi-line quantities continue to work.

## 3. Local and Provider Acceptance

- [ ] 3.1 Update only necessary local mock proxy/fixtures for expiry response compatibility; verify `pnpm dev:stack:stripe-mock` and `pnpm --filter @blackbox/backend d1:check:stripe-mock:local` remain usable, without production mock special cases.
- [ ] 3.2 Use native Codex Browser Use to check fixed/custom-Price cart correction and checkout handoff on desktop/mobile; record reachable actions, accessible error guidance, and preserved cart state.
- [x] 3.3 Run `pnpm test:unit`, `pnpm check`, `pnpm build`, and `pnpm audit:commerce-boundaries` against the final implementation tree; verify generated API artifacts if contracts changed and strict-validate this change.
- [ ] 3.4 After new-account test-mode access exists, prove actual hosted fixed-price and custom-Price checkout, delayed creation, accepted Session expiry, and invalid-cart rejection; record redacted evidence for one accepted commit while PRD remains closed.
- [ ] 3.5 Reconcile the reservation expiry/recovery tasks with the accepted result, run strict validation, sync specs, and archive this correction before reservation UAT archival; do not mark provider acceptance from local mocks.

## Validation notes (2026-09-09)

- The committed gateway regression was first run against the original implementation: two seconds of elapsed time left 1,798 seconds instead of the required 2,100-second request window.
- The corrected tests cover SDK retry parameter/idempotency stability, definitive rejection versus uncertainty, accepted expiry persistence, metadata recovery, retained Session identity, custom-Price cart rejection, and cart quantity guidance.
- `pnpm test:unit` passed 1,259 tests. `pnpm build` and `pnpm audit:commerce-boundaries` passed. Public API contracts did not change in this correction.
- Local D1 readiness passed. The mock proxy started successfully after warm-up and now returns the requested expiry instead of the static fixture deadline.
- Task 3.1 remains open: the canonical stack first timed out on mock startup, then on static-site startup after the mock warmed up. The foreground site command also reported `Dev server failed to start within 30s`. The background command reported startup but its subsequent status reported no running server.
- Task 3.2 remains open: native Codex Browser Use was reachable, but local navigation returned `ERR_CONNECTION_REFUSED`. No desktop/mobile checkout handoff acceptance is claimed.
- Tasks 3.4 and 3.5 remain open pending confirmed new-account test-mode access and actual hosted provider acceptance. No PRD configuration, deployment, activation, spec sync, or archive was performed.
