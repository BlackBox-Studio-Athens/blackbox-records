# Design

## Context

See [proposal.md](proposal.md) for the problem and scope. `createInternalOrderServices().setDispatch` currently validates paid fulfillment, changes `OrderDispatch`, and reads the result back. No email is sent. Staff's `DispatchControl` already has an undo confirmation and a separate Notifications area.

The email application already owns a 476px shopper frame, wordmark, Veneer/Inter hierarchy, facts table, outlined reply action, plain-text alternative, environment routing and provider idempotency. The orders application owns durable leased delivery with five attempts, a 24-hour bound and the existing shared five-row scheduled budget. Reuse those owners.

## Goals / Non-Goals

**Goals:** A brief, recognizable customer update; one durable notification per order; truthful separate shipment/email state; approval of this draft before product code changes.

**Non-Goals:** Carrier integration, tracking links, arrival estimates, locker-ready notices, a second order receipt, new payment/stock behavior, resend controls, a new service, or historical sends.

## Draft for approval

Status: **Approved by the owner on 2026-10-17.** The owner approved the layout and behavior and authorized implementation, a local commit and merge into local `main`. English follows the existing shopper emails. Codex owns the complete task without Claude delegation. Hosted delivery and rollout remain separate acceptance steps.

**Subject:** Your order has been shipped · {{orderReference}}

**Inbox preview:** Your order is on its way with BOX NOW.

**Eyebrow:** Shipping update

**Heading:** Your order has been shipped

**Facts:** Order reference | {{orderReference}}

**Body:**

> Your order is on its way with BOX NOW.
>
> Thank you for supporting BlackBox Records. If you need anything, just reply to this email.

**Action:** Reply to BlackBox Records

The action and Reply-To use the existing configured support address. The local preview uses the existing preview support address and a synthetic `BBR-PREVIEW-001` reference; these are not customer data.

## Decisions

### Reuse the current shopper composition

Keep the existing dark 476px frame, wordmark, Sea Green top rule, condensed heading, one bordered reference row, two short paragraphs and outlined reply control. Omit item and payment tables because the receipt already provides them. Preserve email-safe inline essentials, font fallbacks and narrow-screen wrapping.

This is a restrained product message in the BlackBox brand. A buyer reading an order update on a phone sees the same familiar dark treatment as their payment confirmation. The concrete anchors are the existing payment-confirmation and pre-order-estimate emails, together with the BlackBox wordmark. The current email reference explicitly retains its Sea Green rule; this draft does not retheme other email or website surfaces. No visual probes or new imagery are needed for this reuse.

The implementation reuses those render helpers. The review artifact now calls the production shipping renderer, whose HTML matches the approved draft byte for byte for the same synthetic data and brand URLs. Subject and preheader stay outside the email body on the review page. Browser review remains separate from real email-client delivery acceptance.

### Extend existing durable paid-order delivery

Add `shopper_shipping` to the existing closed delivery kinds and their public internal summaries. Reuse `PaidOrderDelivery`'s unique order/kind identity, claim/retry handling and environment-aware email transport. The dispatch repository commits the successful compare-and-set mark and a first shipping-delivery row in one D1 transaction. Payment reconciliation continues to create only its existing payment-time rows.

The existing delivery-ID helper is shared through the domain repository SPI so persistence and application code use the same identity; its established orders export remains available to callers. Prisma regeneration also includes the existing EmailConsent and EmailConsentSendDay schema models in the generated client, with their generated files retained so the imports are complete.

After that commit, use the existing leased processing path for an immediate attempt, with the existing schedule recovering pending work under its current budget. This avoids a new queue or an unreliable browser-only send. Provider errors affect delivery state without reverting a real shipment. Repeated/conflicting requests create no second row. Re-marking leaves delivered/needs-review records intact and preserves a pending record's original bounds.

Before a provider call, recheck that the persisted order remains complete, paid and shipped. If undo is observed, mark the pending email needs review with a safe dispatch-undone reason and do not call the provider. An email already accepted or in flight cannot be recalled; the existing undo dialog explains this. No automatic correction email is added.

### Keep Staff changes small

Use the existing button and inline helper text: “Marks this order shipped and emails the customer.” Keep successful shipment feedback about the saved mark, and show the actual Shipping email state through the existing Notifications list and attention filters. Add “A shipping email already sent cannot be recalled” to the existing undo confirmation. Add no new confirmation flow or resend action.

## Scope and checks after approval

The change reaches email rendering/exports/previews, the dispatch write and scheduled delivery processor, domain delivery kinds, persistence and an additive migration, internal response schemas/generated client, Staff notification labels/fixtures/tests, and the commerce runbook. Existing money/stock updates, payment receipts and Access/same-origin guards must remain intact.

Run focused email, orders, persistence, API and Staff checks for the implemented paths. Cover atomic rollback, concurrent marks, response loss, same provider identity on retry, provider failure, undo/re-mark behavior, no historical backfill, narrow-screen wrapping and font fallback. Run repository validation and strict OpenSpec validation. UAT provider delivery is a later authorized acceptance check, using the existing sink.

## Risks / Trade-offs

- A mistaken mark may already have emailed the buyer. The existing undo confirmation explains that messages cannot be recalled; no duplicate or automatic correction follows.
- An undo racing a provider request cannot retract an in-flight message. Recheck before each attempt and preserve provider idempotency and manual-review handling.
- Browser previews do not establish Gmail, Outlook, other email-client behavior or provider acceptance. Record those limits and verify delivery after implementation.
- The shared delivery budget also serves existing order messages. Keep its present bound and priority rules; add no extra schedule or hosted service.

## Migration Plan

Only after draft approval, add the smallest additive D1/enum changes required for the fourth delivery kind. Do not seed historical shipping notifications. Regenerate the existing internal client and Prisma artifacts when their source contracts change. A later rollout follows the ordinary authorized UAT/PRD process. Preserve shipment and notification history on rollback; stop incompatible pending shipping work before running older code that cannot interpret the new kind.
