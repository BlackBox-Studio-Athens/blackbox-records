# Design

## Context

See proposal.md for motivation. Both checkout islands currently use an empty array before their storage-reading effect. Delivery recovery is the baseline dependency; layout ordering belongs to a separate change.

## Goals / Non-Goals

Keep the existing cart convenience state, component ownership and visual language. Change only the distinction between unread and read cart state; do not introduce a shared cart store, storage migration or new loading component.

## Decisions

- Use undefined cart lines before the existing effect reads storage, then an array including a genuine empty array. This avoids another boolean that could disagree with the lines. Browser storage stays in effects and event handlers.
- Hide quantity editing and fallback selection until the saved cart is read, so a saved cart wins over fallback intent. An item-specific offer that is still resolving also stays neutral when there are no saved lines.
- Reuse LoadingInline and delivery's reserved amount rows while loading. Payment continues to require capability, cart, shipping and quote validity. Keep quote retry untouched.
- Add an unmocked SSR regression alongside the existing hydrated-state rendering fixtures, plus controlled delayed-script and quote browser tests. Do not infer provider acceptance from mocked reads.

## Risks / Trade-offs

- Loading persists without JavaScript, accurately reflecting that the saved cart cannot be read; the page's Continue Shopping link remains available.
- Independent islands may finish at different times; each must be truthful independently. Existing cart events remain the synchronization seam.
- Existing single-item fallback remains a compatibility behavior after the saved-cart read; its browser snapshot never authorizes checkout amounts.
