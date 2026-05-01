# Phase 10 Feature Gates

## Purpose

Feature gates are runtime capability switches owned by the Worker. They let operators pause a risky capability without
redeploying after the Cloudflare Flagship binding is configured.

Feature gates do not replace environment isolation. Worker environments still protect D1 data, runtime secrets, webhook
endpoints, checkout return origins, and release evidence.

## First Gate

| Gate | Flag key | Owner | Default without provider |
| ---- | -------- | ----- | ------------------------ |
| Native Checkout Gate | `native_checkout_enabled` | Worker Backend | Enabled in local/mock; disabled in sandbox/production |

## Cloudflare Contract

- Maintained provider target: Cloudflare Flagship through the OpenFeature-compatible SDK.
- Worker binding name: `FLAGS`.
- Flag key: `native_checkout_enabled`.
- The Flagship app ID is account-specific. Do not commit it to `wrangler.jsonc` until the app exists and the
  non-secret ID is explicitly approved.
- Sandbox and production may use separate Flagship apps or targeting rules, but code must read through the same
  `FLAGS` binding name.

## Browser Contract

The browser may read sanitized capability state from the Worker. It must not receive provider names, flag keys, Stripe
IDs, D1 binding data, secret names, targeting rules, or internal evaluation errors.

## Failure Mode

If evaluation fails or the provider binding is missing:

- local/mock keeps native checkout enabled so `pnpm dev:stack:stripe-mock` remains useful without accounts
- sandbox and production disable native checkout and return shopper-safe unavailable copy

This is deliberately fail-closed for hosted checkout.
