## Why

A transport or server failure currently becomes the same null quote as a genuinely unsupported cart. Checkout has no retry action, leaving shoppers to reload or change their cart after a temporary failure.

## What Changes

- Distinguish temporary quote failures from authoritative cart restrictions.
- Offer Try delivery again with duplicate-request protection and visible progress, preserving cart quantities and newsletter choice.
- Keep payment blocked until a successful authoritative quote matches the current cart; ignore abandoned requests after cart changes or unmount.

## Capabilities

### Modified Capabilities

- `commerce-checkout`: recover a failed delivery read without changing the cart or reloading checkout.

## Impact

checkout-web delivery hook, summary and checkout status badge; dedicated unit and browser regression tests. No backend, schema, payment-provider, layout, Home film or Store filter changes. UI implementation and isolated-worktree commit are explicitly user-authorized for this task.
