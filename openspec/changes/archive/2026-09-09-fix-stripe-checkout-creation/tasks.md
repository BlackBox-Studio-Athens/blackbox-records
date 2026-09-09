## 1. Provider-Valid Expiry

- [x] 1.1 Run `pnpm openspec:guard`, trace the shared checkout/gateway/hold callers, and convert the delayed-expiry observation into a committed regression using an advancing provider clock; verify it fails on current behavior without relying on ignored audit files.
- [x] 1.2 Calculate the 35-minute provider deadline after hold creation, immediately before the SDK call; supply an order-derived idempotency key and verify delayed D1 work, rounding, and identical parameters across SDK retries without adding custom retry/timing machinery.
- [x] 1.3 Carry accepted provider expiry through session creation and normal/metadata-recovered binding; verify D1 stores the accepted expiry and the browser gains no authority fields.
- [x] 1.4 Distinguish definitive non-creation from uncertainty; verify expiry rejection releases, timeout/5xx/missing-URL/binding failures retain the hold and any known Session identity, and provider-confirmed expiry releases once without another create request.

## 2. Pay-What-You-Want Cart Validation

- [x] 2.1 Validate current Price kind after CartLine aggregation and before hold creation; verify one custom-Price line of quantity one succeeds while mixed carts, two custom Prices, quantity two, and duplicates merged to two reject with zero hold/Session writes.
- [x] 2.2 Add understandable cart/checkout guidance and guard custom-Price quantity controls using existing UI patterns; verify stale/tampered snapshots are still rejected by the Worker, cart contents remain intact, and fixed-price multi-line quantities continue to work.

## 3. Local and Provider Acceptance

- [x] 3.1 Update only necessary local mock proxy/fixtures for expiry response compatibility; verify `pnpm dev:stack:stripe-mock` and `pnpm --filter @blackbox/backend d1:check:stripe-mock:local` remain usable, without production mock special cases.
- [x] 3.2 Use native Codex Browser Use to check fixed/custom-Price cart correction and checkout handoff on desktop/mobile; record reachable actions, accessible error guidance, and preserved cart state.
- [x] 3.3 Run `pnpm test:unit`, `pnpm check`, `pnpm build`, and `pnpm audit:commerce-boundaries` against the final implementation tree; verify generated API artifacts if contracts changed and strict-validate this change.
- [x] 3.4 After new-account test-mode access exists, prove actual hosted fixed-price and custom-Price checkout, delayed creation, accepted Session expiry, and invalid-cart rejection; record redacted evidence for one accepted commit while PRD remains closed.
- [x] 3.5 Reconcile the reservation expiry/recovery tasks with the accepted result, run strict validation, sync specs, and archive this correction before reservation UAT archival; do not mark provider acceptance from local mocks.

## Validation notes (2026-09-09)

- The committed gateway regression was first run against the original implementation: two seconds of elapsed time left 1,798 seconds instead of the required 2,100-second request window.
- The corrected tests cover SDK retry parameter/idempotency stability, definitive rejection versus uncertainty, accepted expiry persistence, metadata recovery, retained Session identity, custom-Price cart rejection, and cart quantity guidance.
- `pnpm test:unit` passed 1,259 tests. `pnpm build` and `pnpm audit:commerce-boundaries` passed. Public API contracts did not change in this correction.
- Local D1 readiness passed. The mock proxy started successfully after warm-up and now returns the requested expiry instead of the static fixture deadline.
- Task 3.1 passed on resume: `pnpm dev:stack:stripe-mock` started the mock proxy, Worker, and static site without launcher changes; local D1 readiness again reported 3/3 ready. A browser-created fixed-price Session returned HTTP 200 with quantity two and the requested expiry. Earlier startup timeouts did not reproduce.
- Initial mock browser acceptance: desktop fixed quantity two and mobile quantity correction passed; provider acceptance was completed separately below.
- The missing local payment configuration was resolved using the existing active BlackBox merch checkout configuration belonging to the local key's sandbox. `pnpm checkout:preflight:stripe-test` now passes. The dashboard initially showed the parent account's test mode, so its different configuration was not copied into the sandbox configuration. Secret values were not printed or changed.
- Local test catalog repair passed: the old ten-Price seed referenced removed objects. UAT Prices were also rejected by the Local identity guard, so a separate `blackbox:local` test catalog was prepared through the existing Stripe gateway without changing the UAT catalog. The ignored local seed now covers 104 current Store Items (97 fixed Prices and seven custom Prices), reconciles old local identities, and refreshes mappings plus offer snapshots. No runtime identity guard was weakened.
- Real Stripe API acceptance against checkout implementation commit `f84358446c4ebb000c55d00db1b54502e392799c` passed on 2026-09-09 at 09:34 UTC: fixed-price quantity two and custom-Price quantity one both returned HTTP 200 and open test Sessions on `checkout.stripe.com`. Both provider-accepted expiry windows were 2,099 seconds; both D1 expiries exactly matched Stripe. Custom quantity two, duplicate custom lines, and a mixed custom/fixed cart returned HTTP 409 with purchase-alone guidance and zero new holds. No payment was submitted.
- Tasks 3.2 and 3.4 passed through the approved Chrome DevTools fallback after native extension timeouts. Real desktop fixed checkout, desktop/mobile mixed-cart rejection with preserved contents and accessible guidance, mobile custom-cart correction and hosted amount entry, and a deliberately delayed real gateway request all passed. See `acceptance.md` for redacted evidence and scope. No payment was submitted or PRD state changed.

- Final verification: build, check, and commerce boundaries passed again. The full unit run passed checkout and application suites but hit six unrelated architecture/launcher timing failures under concurrent load. All six passed in focused reruns; one different architecture case then timed out and passed alone in 9.46 seconds. Root contract tests passed (6/6). No test assertions or time limits were changed.
- Checkout change and commerce-checkout spec passed strict validation; all 37 main specs passed normal validation. Global strict validation additionally reports 18 existing placeholder-purpose warnings outside this correction. The two checkout requirements were compared with the delta after sync and matched completely. Reservation tasks 3.1–3.4 now reflect the accepted correction; reservation UAT tasks remain open.
