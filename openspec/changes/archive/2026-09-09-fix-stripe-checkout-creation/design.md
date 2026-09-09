## Context

See `proposal.md` for scope. Rechecked on 2026-09-09 against the current worktree at HEAD `4423fbd0b8a8b4d1f1638207095fe18966d79955`, which also contains unrelated uncommitted work.

| Finding                        | Sanity check                                                                                                                                                                                                                 | Result and limit                                                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Expiry starts too early        | `start-checkout.ts` computes `createdAt + 30 minutes` before awaiting the hold; `stripe-checkout-gateway.ts` floors that timestamp into `expires_at`. A local gateway capture with two seconds elapsed leaves 1,798 seconds. | Confirmed payload violates Stripe's documented 1,800-second minimum under that delay. No real-provider rejection was observed. |
| Invalid pay-what-you-want cart | Actual checkout validation and gateway capture accept a custom Price with another fixed-price line, and accept custom-Price quantity two.                                                                                    | Both reach Session creation. Stripe permits only one line with quantity one for this Price kind.                               |

Evidence: the audit probe was rerun successfully with `pnpm exec tsx .codex-artifacts/stripe-readiness-2026-09-09/reproduce.mjs`. That ignored audit file asserts current failures; committed regression tests must assert the corrected behavior and work without the file. External contracts were rechecked in [Session creation](https://docs.stripe.com/api/checkout/sessions/create) and [pay-what-you-want Checkout](https://docs.stripe.com/payments/checkout/pay-what-you-want).

## Goals / Non-Goals

**Goals:** Correct both faults at shared checkout boundaries and retain the existing hold, price, and browser-authority rules.

**Non-Goals:** A new cart service, custom amount collection, new reservation model, configurable checkout duration, or provider acceptance inferred from stripe-mock.

## Decisions

### Keep a short hold with explicit provider margin

Create the pending hold with a provisional 35-minute deadline. After the hold commits, calculate the requested `expires_at` once in the gateway immediately before the Stripe SDK call, using current time plus 35 minutes. This removes D1 latency from the provider window. Reuse the installed SDK's request/retry behavior; do not add a freshness state machine, custom retry loop, or shared-client timeout changes for this fix. The five-minute margin covers ordinary transport delay and rounding, not arbitrary outages or clock error; provider rejection remains a handled failure.

Return Stripe's accepted `expires_at` through the existing gateway result and persist it with normal or metadata-recovered session binding. The provisional deadline is not release authority. Pass an order-derived creation idempotency key to the SDK and freeze all parameters, including expiry, across its retries. Do not replay creation later with recomputed parameters or treat an idempotency key as permanent deduplication; use session lookup, expiry, and metadata/operator recovery for uncertain outcomes. Stripe requires identical retry parameters and can prune keys after 24 hours ([idempotency reference](https://docs.stripe.com/api/idempotent_requests)).

Release a sessionless hold only when creation is definitively known not to have happened. Timeouts, network failures, provider 5xx responses, and an accepted Session missing its usable URL are uncertain outcomes; retain the hold unless provider-confirmed terminal non-payable state permits release. A received error alone is not proof that no Session exists ([Stripe error handling](https://docs.stripe.com/error-low-level)). Keep any known Session identity available for binding/expiry recovery.

This keeps the short checkout window with a small bounded margin. Removing `expires_at` would silently adopt Stripe's 24-hour default and hold scarce records much longer. Reusing a timestamp at the provider minimum remains invalid after ordinary latency. The existing reservation delta is updated to remove its contradictory exact-duration promise.

### Validate custom Prices after authoritative resolution, before reservation

After duplicate CartLines are merged and every current Price is resolved, any pay-what-you-want line requires the entire cart to contain one line of quantity one. Reject mixed carts, multiple custom Prices, and duplicate lines merged to quantity two before hold insertion or Session creation. Reuse the established browser-safe validation/error path; add a specific error discriminator only if needed to explain the recovery action.

The existing cart UI can use its display snapshot to prevent incompatible quantity changes and explain why an item must be purchased separately. Stale or tampered browser data is still checked by the Worker. Do not silently remove lines, split payments, or auto-change quantity. Fixed-price multi-line checkout stays supported.

## Risks / Trade-offs

- Extra five-minute reservation window → small intentional stock hold cost; measure actual accepted expiry in test mode.
- Unknown provider outcome → retain the hold and use existing recovery; availability loss is preferable to releasing a payable order.
- Stale cart snapshots → Worker validation remains decisive and the cart preserves user choices on rejection.
- Mock accepts invalid provider input → require new-account hosted acceptance separately from local tests.

## Migration Plan

1. Implement both corrections over the existing reservation code; update gateway/repository types, local mock compatibility, and focused tests together. No destructive data migration is required for expiry, because `checkoutExpiresAt` already exists.
2. Run repository checks and local mock launcher/readiness checks. Keep existing sessions valid under their recorded deadlines.
3. Prove fixed-price and single pay-what-you-want checkout in the new account's test mode; capture redacted accepted creation/expiry and invalid-cart rejection evidence.
4. Close this correction before accepting/archiving reservation UAT evidence. PRD deployment and activation remain owned by `production-go-live-readiness`; rollback disables new checkout without releasing uncertain existing holds.
