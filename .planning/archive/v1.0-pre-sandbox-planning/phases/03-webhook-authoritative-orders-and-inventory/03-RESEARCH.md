# Phase 3: Webhook-Authoritative Orders And Inventory - Research

**Researched:** 2026-04-19
**Domain:** Stripe Checkout webhooks, D1-backed order state, idempotent inventory decrement, low-volume manual reconciliation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- v1 should use a minimal D1 order-state model: `pending_payment`, `paid`, `closed_unpaid`, and `needs_review`.
- Do not plan a larger accounting-style state machine unless research finds a concrete safety issue for the expected launch volume.
- `needs_review` exists to absorb rare operational exceptions without expanding the normal flow.
- The v1 paid trigger set should stay Checkout-session-centric rather than introducing a broad PaymentIntent event machine.
- Treat `checkout.session.completed` as authoritative only when the Checkout Session is actually paid.
- Treat `checkout.session.async_payment_succeeded` as the paid trigger for delayed payment methods.
- Treat `checkout.session.async_payment_failed` and `checkout.session.expired` as unpaid-closure signals.
- Browser return or cancel pages must never mark an order paid or mutate inventory.
- v1 accepts the small theoretical oversell risk created by having no reservation logic.
- The first paid webhook that successfully decrements stock wins.
- If a later paid webhook finds no stock available, route that order to `needs_review` for manual handling.
- Manual refund handling through Stripe is acceptable for the rare oversell edge case at the expected launch volume.
- Stripe Dashboard only is sufficient for MVP reconciliation and exception handling.
- Do not plan an internal admin surface or dedicated order-ops tool in Phase 3.
- Expected initial order volume is approximately `2-3 sales per month`.

### the agent's Discretion
- Exact D1 table and idempotency-record design
- Exact transition table from Stripe events into order states
- Exact rule for when an event is considered a `needs_review` exception
- Whether unpaid stale sessions need any later operational cleanup beyond explicit Stripe events

### Deferred Ideas (OUT OF SCOPE)
- Reservation logic before payment
- Conservative stock buffers
- Internal order admin tooling
- Rich refund/exception management UI

</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Webhook signature verification | Frontend Server | — | Stripe webhook authenticity must be checked server-side against the raw request body. |
| Paid / unpaid order transition authority | Frontend Server | Database/Storage | Worker code interprets Stripe events and mutates D1 state. |
| Operational order state | Database/Storage | Frontend Server | D1 stores minimal internal state needed for reconciliation and fulfillment handoff. |
| Inventory decrement | Database/Storage | Frontend Server | Inventory must change atomically with the authoritative paid transition. |
| Shopper-visible return/cancel messaging | Frontend Server | Browser/Client | Return pages remain informational and never authoritative. |
| Exception review and refund handling | API/Backend | Operator | Stripe Dashboard is the MVP operator surface, so internal tooling stays thin or absent. |

</architectural_responsibility_map>

<research_summary>
## Summary

Stripe’s current Checkout fulfillment guidance still supports the minimal model chosen in discussion: webhook-authoritative order updates centered on Checkout Session events, not browser redirects. The important nuance is that `checkout.session.completed` is not a blanket synonym for “paid”; it must be interpreted alongside the session’s payment status, while delayed-payment methods require `checkout.session.async_payment_succeeded` and `checkout.session.async_payment_failed`. Stripe also documents that webhook endpoints must verify signatures using the raw request body, handle duplicate deliveries safely, and not assume in-order delivery.

Cloudflare D1’s current worker API and SQL model fit a low-volume MVP if the mutation logic stays small and atomic. D1 batch execution uses a transaction under the hood, which is a good fit for “insert idempotency marker -> update order -> decrement stock” as one bounded unit. Cloudflare also documents that write queries should be retried in application code, so Phase 3 should plan explicit idempotency and conflict handling rather than assuming writes are never retried or replayed.

For this repo, the cleanest approach is to keep Phase 3 narrow: define a minimal order-state model, a Checkout-session-centric webhook contract, and one atomic inventory/reconciliation document. Do not add an operator dashboard, reservation system, or large asynchronous processing architecture at this volume. The endpoint can stay simple as long as it verifies signatures, deduplicates events, records authoritative state in D1, and routes unusual situations into `needs_review`.

**Primary recommendation:** Plan Phase 3 around a D1-backed minimal state machine plus an idempotent Stripe webhook contract that atomically records paid state and decrements inventory once, with Stripe Dashboard handling the rare manual exception.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `stripe` | implementation-time stable release | Webhook signature verification and Checkout Session retrieval | Official SDK for authoritative Checkout event handling. |
| Cloudflare Workers runtime | current platform | Webhook endpoint execution | Required runtime already chosen in Phase 1. |
| `D1` | managed platform service | Order state, inventory counts, idempotency records | Relational fit for stock updates and low-volume reconciliation. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@astrojs/cloudflare` | implementation-time compatible release | Worker-backed Astro server route support | Needed when the webhook and order APIs are implemented later. |
| Stripe Dashboard | hosted product | Manual refund and exception handling | Use for MVP operator workflows instead of building internal tooling. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Checkout-session-centric events | Mixed Checkout + PaymentIntent state machine | More comprehensive, but adds unnecessary complexity for low volume. |
| D1 minimal state | Large OMS-style order schema | More expressive, but overbuilt for `2-3` monthly sales. |
| Manual Stripe-Dashboard exception handling | Internal admin panel | Adds recurring maintenance without real MVP benefit. |

**Installation:**
```bash
pnpm add stripe
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### System Architecture Diagram

```text
Stripe Checkout Session
  -> webhook delivery to Worker endpoint
    -> verify signature against raw body
      -> dedupe event / session processing
        -> map event to order transition
          -> D1 batch:
             1. record idempotency marker
             2. update order state
             3. decrement stock only for authoritative paid transition
          -> return 2xx

Shopper return/cancel page
  -> informational only
    -> never mutates paid status or stock
```

### Recommended Project Structure
```text
.planning/phases/03-webhook-authoritative-orders-and-inventory/
├── 03-ORDER-STATE-MODEL.md
├── 03-WEBHOOK-CONTRACT.md
├── 03-INVENTORY-RECONCILIATION.md
└── 03-VALIDATION.md
```

### Pattern 1: Minimal operational state model
**What:** Store only the states needed for the MVP operational flow: waiting, paid, closed unpaid, and manual review.
**When to use:** Low-volume commerce where the operator can absorb rare exceptions manually.
**Example:**
```text
pending_payment
  -> paid
  -> closed_unpaid
  -> needs_review
```

### Pattern 2: Session-centric webhook authority
**What:** Make Checkout Session events the main webhook vocabulary, and only treat the browser as an informational surface.
**When to use:** Embedded Checkout flows where the system already creates Checkout Sessions server-side.
**Example:**
```text
checkout.session.completed (when paid) -> paid
checkout.session.async_payment_succeeded -> paid
checkout.session.async_payment_failed -> closed_unpaid
checkout.session.expired -> closed_unpaid
```

### Pattern 3: Atomic D1 mutation for paid transitions
**What:** Persist the idempotency marker, order-state mutation, and stock decrement in one bounded D1 batch/transaction.
**When to use:** Single-item low-volume orders where the main safety requirement is “decrement once, and only once.”
**Example:**
```text
event accepted
  -> write event/session marker
  -> mark order paid
  -> decrement inventory if stock available
  -> otherwise route to needs_review
```

### Anti-Patterns to Avoid
- **Treating the return page as authority:** Stripe explicitly warns that redirects/landing pages are not sufficient for fulfillment authority.
- **Assuming event ordering:** Stripe does not guarantee webhook delivery order, so the handler must be idempotent and state-aware.
- **Using every possible Stripe event:** That broadens the state machine without helping the MVP.
- **Splitting stock decrement from paid-state mutation:** That creates race windows and double-processing risk.
- **Building an internal admin tool for MVP reconciliation:** Stripe Dashboard already covers the required operator workflow at this volume.

</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Payment-success truth | Browser return page logic | Stripe webhooks | Redirect completion is not authoritative. |
| Exception dashboard | Custom OMS/admin UI | Stripe Dashboard + D1 inspection | Lower maintenance and enough for low volume. |
| Reservation buffer logic | Pre-payment stock holding system | Manual `needs_review` handling for rare collisions | Fits the user’s explicit simplicity goal. |
| Multi-event reconciliation engine | Broad event bus | Minimal Checkout-session event set | Keeps the logic understandable and testable. |

**Key insight:** The safest simple design is not “more states and more events”; it is fewer states, fewer authoritative events, and one atomic paid-transition write path.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Treating `checkout.session.completed` as always paid
**What goes wrong:** The system marks orders paid too early for delayed-payment methods.
**Why it happens:** Teams read “completed” as final payment success.
**How to avoid:** Only treat `checkout.session.completed` as paid when the Checkout Session is actually paid, and rely on async success/failure events where needed.
**Warning signs:** Specs do not mention session payment status or async session events.

### Pitfall 2: Assuming webhook order is deterministic
**What goes wrong:** A late or duplicate event corrupts state or decrements stock twice.
**Why it happens:** Developers assume Stripe will deliver one clean sequence.
**How to avoid:** Plan explicit idempotency keys and make transitions tolerant of duplicates and out-of-order delivery.
**Warning signs:** Docs say “on the next event” without handling replay or duplicate paths.

### Pitfall 3: Using non-atomic stock decrement logic
**What goes wrong:** Order state flips to paid but inventory update fails, or inventory decrements twice across retries.
**Why it happens:** State mutation and stock mutation happen in separate operations.
**How to avoid:** Keep paid transition and stock decrement in one D1 transaction/batch.
**Warning signs:** Plans mention one table update followed by a later independent stock write.

### Pitfall 4: Overbuilding operator tooling
**What goes wrong:** The team spends MVP effort on dashboards instead of the authoritative payment flow.
**Why it happens:** Reconciliation concerns get conflated with product needs.
**How to avoid:** Keep Stripe Dashboard as the operator surface and only persist the minimum D1 data needed to support manual review.
**Warning signs:** Phase 3 plans start describing search UI, filters, refund tools, or operator screens.

</common_pitfalls>

<code_examples>
## Code Examples

Verified patterns from official sources:

### Checkout-session-centric webhook routing
```ts
// Planning-oriented event routing shape
switch (event.type) {
  case "checkout.session.completed":
  case "checkout.session.async_payment_succeeded":
  case "checkout.session.async_payment_failed":
  case "checkout.session.expired":
    // route into the order-state transition table
    break;
}
```

### D1 batch-style atomic mutation
```ts
// Planning shape only:
await env.DB.batch([
  env.DB.prepare("INSERT INTO webhook_events (event_id, session_id) VALUES (?, ?)"),
  env.DB.prepare("UPDATE orders SET status = ? WHERE checkout_session_id = ?"),
  env.DB.prepare("UPDATE inventory SET available = available - 1 WHERE sku = ? AND available > 0"),
]);
```

### Minimal order-state interpretation
```text
pending_payment -> paid
pending_payment -> closed_unpaid
any unexpected duplicate/conflict -> needs_review
```

</code_examples>

## Validation Architecture

- Phase 3 plans should produce planning artifacts only, not code implementation.
- Validate the future execution artifacts with grep checks against state names, authoritative event names, idempotency language, and D1 terminology.
- Use `pnpm check` as the quick smoke command and `pnpm test:unit && pnpm check && pnpm build` as the full suite after execution waves.
- Treat any lingering `Supabase` wording in active Phase 3 requirements, any browser-authoritative paid transition, or any non-atomic stock decrement plan as a validation failure.

<sota_updates>
## State of the Art (2025-2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Return/success page as practical payment confirmation | Stripe fulfillment docs still require webhook-authoritative fulfillment | checked 2026-04-19 | Phase 3 must keep return/cancel pages informational only. |
| Broad event handling without dedupe assumptions | Stripe docs explicitly discuss duplicate deliveries, retries, and unordered events | checked 2026-04-19 | Phase 3 needs idempotency and replay-safe transitions. |
| Ad hoc SQL updates for state and stock | D1 batch execution runs statements transactionally | current D1 docs observed 2026-04-19 | A bounded atomic mutation path is realistic for this MVP. |
| Generic cloud DB wording | D1 is the chosen low-ops operational state store | project decision locked 2026-04-19 | Phase 3 planning should normalize stale `Supabase` requirement text. |

**New tools/patterns to consider:**
- Stripe event replay and duplicate-handling guidance
- D1 batch-based atomic mutation
- Minimal exception routing through `needs_review`

**Deprecated/outdated:**
- Treating `Supabase` as the active order-state store in Phase 3 requirements
- Assuming the checkout landing page can prove payment success
</sota_updates>

<open_questions>
## Open Questions

1. **Should the implementation key idempotency by Stripe event ID only, or also track Checkout Session ID transitions?**
   - What we know: Stripe can retry and duplicate events, and the workflow is Checkout-session-centric.
   - What's unclear: Whether the later implementation should dedupe purely at the event layer or also defend against multi-event session conflicts.
   - Recommendation: Plan for both an event marker and session-aware state transition checks.

2. **Should the webhook do its bounded D1 writes inline or via a background continuation?**
   - What we know: Stripe wants a reliable 2xx response and the MVP workload is very small.
   - What's unclear: Whether inline D1 writes are sufficient within Worker timing constraints or whether later implementation should use a background continuation pattern.
   - Recommendation: Keep the Phase 3 plan implementation-agnostic, but require that the handler remain bounded and not call shipping or other slow external services.

3. **How much delayed-payment-method scope should the sandbox milestone expose?**
   - What we know: The authoritative event set includes async success/failure handling.
   - What's unclear: Whether the sandbox milestone will actually enable payment methods that exercise those async events.
   - Recommendation: Keep async-event support in the contract even if the first sandbox slice starts card-first.

</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- [Stripe fulfill orders](https://docs.stripe.com/checkout/fulfillment) — checked Checkout-session event guidance and the recommendation that fulfillment be safe for re-entry
- [Stripe webhooks](https://docs.stripe.com/webhooks) — checked signature verification, raw-body handling, duplicate delivery, retries, and event-order caveats
- [Stripe process undelivered webhook events](https://docs.stripe.com/webhooks/process-undelivered-events) — checked practical duplicate/replay guidance and idempotent processing expectations
- [Stripe Checkout Session object](https://docs.stripe.com/api/checkout/sessions/object) — checked current `payment_status` field semantics
- [Cloudflare D1 Worker API](https://developers.cloudflare.com/d1/worker-api/d1-database/) — checked batch execution and worker-bound database access
- [Cloudflare D1 best practices](https://developers.cloudflare.com/d1/best-practices/query-d1/) — checked retry guidance for write queries

### Secondary (MEDIUM confidence)
- `.planning/phases/01-runtime-and-guardrails/01-RESEARCH.md` — runtime and trust-boundary research already aligned to Worker + D1 execution
- `.planning/phases/02-native-catalog-and-embedded-checkout-slice/02-RESEARCH.md` — embedded Checkout behavior and session-creation contract assumptions
- `.planning/phases/02-native-catalog-and-embedded-checkout-slice/02-02-PLAN.md` — planned Checkout Session contract and Phase 3 handoff

### Tertiary (LOW confidence - needs validation)
- None
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Stripe webhooks + Checkout Sessions + D1 order state
- Ecosystem: Cloudflare Workers, D1, Stripe Dashboard operations
- Patterns: idempotent event handling, atomic stock decrement, manual exception handling
- Pitfalls: stale `Supabase` wording, return-page authority, unordered events, non-atomic writes

**Confidence breakdown:**
- Standard stack: HIGH - based on official Stripe and Cloudflare docs
- Architecture: HIGH - strongly aligned with user constraints and current planning decisions
- Pitfalls: HIGH - directly supported by official webhook and D1 docs
- Code examples: MEDIUM - simplified planning-oriented pseudocode
</metadata>
