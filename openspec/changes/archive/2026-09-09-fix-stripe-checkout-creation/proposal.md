## Why

Checkout currently calculates Stripe's minimum expiry before D1 and network work, and permits pay-what-you-want carts that Stripe cannot accept. Both findings were reproduced locally on 2026-09-09 and checked against current Stripe documentation; they must close before new-account acceptance.

## What Changes

- Give hosted Checkout expiry a bounded latency margin while preserving the existing pending-order hold and provider-confirmed release rules.
- Validate authoritative pay-what-you-want carts as exactly one line with quantity one before creating a hold or Checkout Session.
- Explain incompatible carts in the existing cart/checkout UI without dropping items or moving price authority into the browser.
- Correct the still-active reservation plan's exact 30-minute assumption and prove these changes in new-account test mode.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `commerce-checkout`: Provider-valid expiry and authoritative pay-what-you-want cart constraints.

## Impact

Checkout application validation, Stripe gateway and hold binding/recovery, existing StoreCart controls and checkout error presentation, focused D1/gateway/browser tests, and the reservation/launch plans. Reuse existing modules and dependencies. No live configuration or checkout activation is included.
