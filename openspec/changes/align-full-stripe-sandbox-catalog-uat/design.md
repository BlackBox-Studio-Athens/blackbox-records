## Context

The field-ownership work already separates Product Projection, Price Authority, Store Offer snapshots, and D1 readiness. This change uses that model to make the whole Astro catalog buyable in UAT without moving payment authority into static Astro content or the browser.

## Decisions

### Derive the catalog from Astro content

The filesystem adapter in `scripts/stripe-catalog-contract.ts` remains the source for the backend Product Projection manifest. It reads Astro content files directly, excludes `___.json`, applies only explicit commerce overrides that cannot be derived, and emits absolute GitHub Pages media URLs.

The generated backend manifest is committed so the Worker has no runtime dependency on `astro:content`. `pnpm stripe:catalog:artifacts:check` fails when the committed manifest or sandbox UAT seed drifts from current Astro content.

### Sandbox prices are policy defaults, not browser authority

Sandbox expected Prices are derived from format labels:

- Cassette/tape: `1200 EUR`
- T-shirt/tee: `2000 EUR`
- Vinyl, LP, releases, and unknown physical goods: `2800 EUR`

These expected Prices guide sandbox catalog apply only. The browser still shows non-authoritative copy and receives checkout-ready Store Offers from the Worker.

### D1 owns checkout readiness

The sandbox UAT seed upserts all current Store Items into `StoreItemOption`, marks `ItemAvailability` as `available` and `canBuy = true`, and seeds `Stock`.

`afterglow-tape` is the only low-stock test item with `quantity = 1` and `onlineQuantity = 1`. Every other item uses `99/99` so repeated UAT checkout testing does not exhaust stock accidentally.

### Reset is sandbox-only deactivation

Stripe sandbox reset only deactivates active Products and Prices that identify as BlackBox sandbox catalog objects through expected metadata or lookup keys. It never hard-deletes Stripe objects and rejects non-sandbox environments.

The intended provider flow is two-phase:

1. Reset deactivates old repo-owned sandbox catalog objects after an explicit `--confirm`.
2. `pnpm stripe:catalog:verify --env sandbox --apply` creates fresh active Products/Prices and updates D1 mappings/snapshots.

## Risks

- GitHub Pages UAT cannot prove the new static availability copy until the frontend artifact is deployed there.
- Sandbox reset mutates external Stripe test-mode state; the command must remain dry-run by default and redacted.
- If unrelated Stripe objects accidentally share BlackBox sandbox metadata, reset will consider them repo-owned; metadata and lookup key matching must stay narrow.
