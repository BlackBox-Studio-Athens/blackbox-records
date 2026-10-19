## Why

The UX audit found that mobile checkout puts payment before item identity and quantity editing. A shopper should review and correct the order before continuing to payment.

## What Changes

- Move the existing order summary before the payment panel in document and keyboard order.
- Stack summary then payment below 48rem; retain the desktop payment-left, summary-right composition.
- Add a dedicated responsive browser regression for multiple items, long titles, quantity-driven quotes, overflow and focus order.

## Capabilities

### New Capabilities

- `checkout-review-order`: Responsive item review before payment.

### Modified Capabilities

None.

## Impact

Only the cart checkout Astro page, checkout grid rules and a dedicated layout spec change. Existing components, quote authority, shipping disclosure, consent and payment submission behavior remain owned by their existing modules. The user authorized direct Codex implementation and an isolated worktree with one local commit; integration belongs to the coordinator.
