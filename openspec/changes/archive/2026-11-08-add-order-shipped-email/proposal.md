# Proposal

## Why

Staff can mark an order shipped, but the customer receives no shipping update. Send a short confirmation from that existing action, using the approved shopper email design.

## What Changes

- Prepare the copy and a rendered draft for owner approval before implementation.
- After approval, queue one customer shipping email when an authenticated operator successfully marks a complete paid order shipped.
- Reuse the existing shopper email frame, configured sender/reply address, environment routing, durable delivery handling and bounded retries.
- Show the shipping email separately in the existing Staff Notifications area. Explain the email effect beside Mark shipped and in its existing undo confirmation.
- Keep undo and repeat requests safe: no second automatic email, no automatic correction email, and no retrospective mailing of already-shipped orders.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `paid-order-delivery`: Add a dispatch-triggered shopper shipping notification with durable, duplicate-safe delivery and the existing shopper presentation.
- `staff-order-workspace`: Explain the shipping-email side effect and display its status separately from the dispatch mark.

## Impact

The implementation will reach the backend email application, orders application, commerce domain/persistence, additive D1 migration, internal order contract and generated client, and Staff order detail/tests. Reuse the current delivery schedule and provider integration; add no dependency or carrier integration. Update the commerce runbook and focused delivery/dispatch tests.

The owner approved the draft layout and behavior on 2026-10-17 and authorized implementation, a local commit and merge into local `main`. The owner explicitly requested this worktree and Codex ownership, with no Claude delegation. Hosted delivery verification and deployment require separate authorization.
