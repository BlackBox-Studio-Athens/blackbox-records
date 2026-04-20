# Phase 7 Research - Worker Checkout And Stripe Sandbox Flow

## Standard Stack

- Worker backend owns Checkout Session creation
- static frontend mounts embedded Checkout using Worker-provided session data
- Stripe sandbox and webhook tooling validate the checkout loop

## Architecture Patterns

- browser -> Worker backend -> Stripe
- browser never calls secret Stripe APIs directly
- frontend return/retry pages remain informative only

## Don't Hand-Roll

- Do not let the browser construct Checkout Sessions.
- Do not use frontend-only pricing authority.
- Do not treat return pages as payment truth.

## Common Pitfalls

- leaking Stripe IDs directly into frontend routing contracts
- coupling checkout initialization to a temporary fixture model
- mixing webhook authority into the Phase 7 browser flow

## Code Examples

- backend item/variant lookup endpoint
- backend checkout-session creation endpoint
- frontend checkout page fetching session state from backend

---
*Research completed: 2026-04-20*

