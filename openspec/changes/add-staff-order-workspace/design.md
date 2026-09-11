## Context

See [proposal.md](proposal.md) for motivation. `apps/staff` currently contains the stock workspace. `register-internal-order-routes.ts` already provides a no-store recent-order list, optional order-status filter, limit up to 100, and lookup by Checkout Session. Responses include notification summaries, review reasons, and discriminated fulfillment completeness. They do not provide dispatch status or a general order-reference lookup.

## Goals / Non-Goals

**Goals:** Give an authenticated operator a clear, truthful view of existing persisted orders using current API contracts.

**Non-Goals:** Assignment, dispatch recording, refunds, resend controls, automatic alerts, exports, live provider reads, new roles, or a complete historical reporting tool. This first slice does not replace the private dispatch record.

## Decisions

1. **Use the existing staff surface.** Add `/orders/` with navigation to `/stock/`; keep the existing staff landing behavior. Reuse the stock layout, controls, loading states, internal client transport, and same-origin hosted API policy. A second admin application would duplicate Access and deployment work.
2. **Bound and label the list honestly.** Request the latest 100 orders by creation time, defaulting to all payment states. The four payment-state filters run server-side. Notification filters run over the returned subset and say so; a zero result is never a global all-clear. Recently updated older orders are not necessarily included. Show the bound and provide manual Checkout Session lookup for older orders instead of adding pagination or a new search endpoint.
3. **Use API identity without inventing fields.** Selection uses the returned order in memory. Session-bound orders support `/orders/?checkoutSessionId=<encoded-value>` and the existing detail GET; list rows without a session remain inspectable but have no durable detail link. Show a shortened session reference where present, with full correlation values only in the protected detail view. Do not claim a human order reference exists in this response.
4. **Separate three facts.** Payment state, fulfillment-data completeness, and notification delivery each have their own label. `current` means complete paid data is available, not that a parcel remains unshipped. Show immutable lines and monetary fields; null historical values are unknown. Translate known review reasons into operational guidance and preserve unknown reasons safely. Rendering uses escaped text.
5. **Keep access failures and races explicit.** A 401/403 clears list and detail data, invalidates all in-flight reads, and shows reauthentication/access guidance without automatic retry loops; a late success cannot restore private data after denial. Abort or ignore superseded filter/detail reads. A failed refresh may retain only data for the same query/selection, labeled stale with its last successful read time. A failed new filter or lookup must not relabel old results as the requested data. Store no order payload in localStorage, sessionStorage, build artifacts, analytics, or logs; selection identity is the only URL state.
6. **Keep manual actions manual.** Contextual guidance refers to the runbook for provider resend/refund and dispatch checks. There are no action-shaped controls that imply these operations occur in the app. Multi-operator assignment and dispatch writes need a separately agreed workflow.

## Risks / Trade-offs

- A bounded list can miss old failed notifications → label the recent subset and retain the full daily operational checks and direct session lookup.
- Paid data can be mistaken for shipment authorization → show completeness independently and remind staff to check the private dispatch record before packing.
- Protected responses contain personal data → keep all reads behind current Access/JWT checks, use no-store transport, and redact browser evidence.
- VAT and reconciliation work is active → consume the current generated discriminated response, preserve unknown historical values, and verify against the accepted API tree before implementation.

## Migration Plan

The user approved local completion on 2026-09-11. This change closes at locally verified implementation and handoff; deployment and hosted acceptance remain a separate follow-up coordinated with `production-go-live-readiness`.

No database migration. Implement on the main worktree, validate locally with synthetic orders, and deploy through the existing staff pipeline only when execution is authorized. Hosted Access allow/deny and read-only inspection belong to the protected PRD staff surface; UAT public Pages is not staff acceptance. Roll back the staff artifact to remove the workspace without touching order history. Complete the relevant Impeccable context/shape checks before UI implementation; these planning artifacts do not approve a visual mockup.
