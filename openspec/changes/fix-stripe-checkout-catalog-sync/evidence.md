## Sandbox Dynamic Payment Surface Contract

Status: verified against live UAT sandbox on 2026-05-23.

Accepted browser context:

- Browser: Chromium through Playwright.
- Viewport: 1280 x 900.
- Locale: `en-US`.
- Checkout shipping country: Greece.
- Store Item: `disintegration-black-vinyl-lp`.
- Variant: `variant_barren-point_standard`.
- Amount and currency authority: Worker Store Offer from `/api/store/items/disintegration-black-vinyl-lp`; the smoke runner must not use a hardcoded Astro price.
- Expected hosted dynamic surface label: `Link`, passed with `STRIPE_SANDBOX_EXPECTED_PAYMENT_LABELS` or `--expected-payment-label`.

Current hosted Checkout evidence:

- `checkout_surface` run `20260523143002` passed without submitting payment.
- Evidence: `.codex-artifacts/stripe-sandbox-smoke/20260523143002/checkout_surface/evidence.json`.
- Screenshot: `.codex-artifacts/stripe-sandbox-smoke/20260523143002/checkout_surface/final.png`.
- Hosted amount evidence included the Worker Store Offer amount `€28.00`.
- Strict payment-method section labels were `Card`.
- Dynamic hosted surface labels included `Link` through Stripe Checkout's visible saved-info surface text.

Dynamic payment interpretation:

- `pnpm stripe:payment-methods:verify` verified the selected sandbox Payment Method Configuration with `card`, `apple_pay`, `google_pay`, and `link` effectively allowed, while banned methods remained off.
- The deployed sandbox Worker has `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` configured, and checkout sessions created after the binding update use the selected redacted Payment Method Configuration.
- In the accepted Chromium context, Stripe presents `Link` as hosted saved-info/payment-surface text rather than as a separate selectable payment-method row. This is not a card-only configuration regression because the API/config layer verifies `link` as enabled and the hosted browser evidence visibly includes `Link`.
- Browser wallets such as Apple Pay or Google Pay remain valid evidence only when the browser, account, and domain context are proven eligible. They should not be the only required dynamic label unless that eligibility is confirmed for the UAT run.

## Catalog And Mapping Evidence

Status: verified against live UAT sandbox on 2026-05-23.

- Sandbox D1 migration `0007_add_store_offer_snapshot.sql` was applied before catalog verification.
- The stale Disintegration sandbox mapping pointed at an active redacted `€10.00` Price; Stripe Product/Price metadata used legacy keys and did not match the canonical variant contract.
- Catalog apply selected the corrected active redacted Price for `disintegration-black-vinyl-lp` / `variant_barren-point_standard` at `2800 eur`, with lookup key `blackbox:sandbox:disintegration-black-vinyl-lp:variant_barren-point_standard`.
- Sandbox D1 `VariantStripeMapping`, Store Offer snapshot, and the ignored local Stripe test seed state were updated to the corrected redacted Price.
- `pnpm stripe:catalog:verify --env sandbox` now reports `Stripe catalog verification OK`, one checked variant, zero issues, and no actions.

## Paid Smoke Evidence

Status: verified against live UAT sandbox on 2026-05-23.

- A matching `stripe listen --forward-to <sandbox-worker>/api/stripe/webhooks` listener was started through `scripts/start-stripe-sandbox-listener.ts`, and the sandbox Worker webhook secret was synced from the active listener.
- `pnpm smoke:stripe-sandbox -- --scenario happy_path_paid --screenshots always --timeout-ms 120000` run `20260523143209` passed.
- Evidence: `.codex-artifacts/stripe-sandbox-smoke/20260523143209/happy_path_paid/evidence.json`.
- Screenshot: `.codex-artifacts/stripe-sandbox-smoke/20260523143209/happy_path_paid/final.png`.
- Remote D1 order status reached `paid`, and the listener observed Stripe webhook deliveries returning `200`.
