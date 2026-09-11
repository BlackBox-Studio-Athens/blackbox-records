## 1. Confirm integration and presentation

- [x] 1.1 Run `pnpm openspec:guard`, inspect the current generated internal order contract and staff Access wiring, and record the accepted API fields and main-worktree status in change evidence.
- [x] 1.2 Complete the applicable Impeccable context and shape review for the staff list/detail flow; verify a reviewed layout covers recent-subset labeling, private detail, access failure, and narrow-screen use before UI mutation.

## 2. Implement read-only order inspection

- [x] 2.1 Add a staff adapter using the existing internal client for bounded status-filtered reads and exact Checkout Session lookup; verify focused adapter checks for encoded lookup, no-store requests, 401/403, 404, and safe server-error handling.
- [x] 2.2 Add `/orders/` and stock/orders navigation with recent-list status filters, subset notification filters, manual refresh, and session lookup; verify synthetic fixtures cover all payment states, a no-session row, empty subsets, and lookup outside the recent list.
- [x] 2.3 Render selected-order facts, incomplete/review guidance, and independent notification summaries; verify complete multi-line orders, historical null amounts, known/unknown review reasons, and delivered-email wording without any dispatch claim.
- [x] 2.4 Handle superseded requests, stale refresh, and expired access; verify a late success after 401/403 cannot restore cleared list/detail data, and a failed new filter/lookup cannot present previous data as its result. Verify same-query refresh failures show accessible retry/stale feedback with the last successful read time.

## 3. Verify operational handoff

- [x] 3.1 Update `docs/commerce-operations.md` with workspace entry/lookup instructions and the recent-list limit; verify existing private dispatch, refund, resend, and returned-stock procedures remain explicit and no new mutation workflow is claimed.
- [x] 3.2 Run `pnpm test:unit`, `pnpm check`, `pnpm build`, and `pnpm build:staff` against the final implementation tree; record passing results and confirm the built staff artifact contains no order payloads.
- [x] 3.3 Use native Browser Use for local synthetic list/detail/keyboard/mobile/race checks; record synthetic access-denial and read-only network evidence. Record protected PRD Access allow/deny and network acceptance as a deployment follow-up, outside the approved local completion scope.
- [x] 3.4 Run `pnpm openspec -- validate add-staff-order-workspace --type change --strict` and `git diff --check`; link completed local evidence and explicitly document pending hosted acceptance without claiming deployment verification.

All 10 local implementation and handoff tasks are complete. The user approved the result and requested local closure on 2026-09-11. Deployment and hosted acceptance remain a separate follow-up: [evidence.md](evidence.md).
