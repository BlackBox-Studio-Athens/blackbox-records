# Phase 9 Validation

## 09-01 Lock BOX NOW Shipping Data And Secret Contracts

- Result: passed.
- Evidence: Phase 9 now has explicit context and BOX NOW contract docs.
- Evidence: The approved v1 locker snapshot is locked to `locker_id`, `country_code`, and `locker_name_or_label`.
- Evidence: Greece-only scope is explicit and `country_code` is fixed to `GR` for v1.
- Evidence: Payment is documented as fail-closed until a valid Greek locker is selected.
- Evidence: BOX NOW credentials are documented as Worker runtime secrets or out-of-band operator credentials, never Astro `PUBLIC_*` env.
- Evidence: Manual BOX NOW partner-portal fulfillment remains the v1 operational model.
- No locker UI, API calls, D1 migration, generated client, checkout behavior, Stripe configuration, BOX NOW credentials, or fulfillment automation changed.
- Validation: `rg` contract check; `git diff --check`; `pnpm check`.

## Required Checks

- `rg -n "locker_id|country_code|locker_name_or_label|Greece only|Worker runtime secret|manual" README.md AGENTS.md .planning/phases/09-greece-only-box-now-shipping .planning/STATE.md .planning/ROADMAP.md`
- `git diff --check`
- `pnpm check`

## 09-02 Add Greece-Only Locker Selection UI Before Checkout

- Result: passed.
- Evidence: Checkout now renders a shipping-first BOX NOW gate before the payment action.
- Evidence: Local mock checkout mode selects the BOX NOW FAQ test locker with `locker_id = 4`, `country_code = GR`, and `locker_name_or_label = ΛΕΩΦΟΡΟΣ ΠΕΝΤΕΛΗΣ 125, 15234` held only in browser component state.
- Evidence: Non-mock checkout mode fails closed with the approved “Locker selection unavailable” copy until the real BOX NOW picker integration exists.
- Evidence: `StartCheckout` request payload remains unchanged and still sends only `storeItemSlug` and `variantId`.
- Evidence: Tests cover missing locker, non-Greece locker rejection, valid Greek locker enablement, non-mock fail-closed behavior, and no BOX NOW credentials in browser-rendered markup.
- Evidence: Browser Use against `pnpm dev:stack:stripe-mock` on `/blackbox-records/store/disintegration-black-vinyl-lp/checkout/` verified payment is blocked before locker selection, the local Greek locker unlocks payment, the mock checkout panel mounts, and `Change Locker` returns to the shipping gate and hides the mounted checkout.
- Note: the Browser Use dev log buffer retained two first-load Astro hydration errors from the initial Vite dependency optimization reload; the successful interaction pass produced no new checkout UI errors.
- No BOX NOW API calls, backend checkout preflight, D1 migration, OpenAPI/generated client change, order persistence, Stripe account values, or fulfillment automation changed.
- Validation: targeted web tests; `git diff --check`; `pnpm test:unit`; `pnpm check`; `pnpm build`.

Manual UI validation:

- Result: passed with the Vite first-load caveat above.
- Command: `pnpm dev:stack:stripe-mock`.
- Browser Use route: `/blackbox-records/store/disintegration-black-vinyl-lp/checkout/`.
- Verified: payment blocked before locker selection; local Greek locker selection unlocks payment; mock checkout panel mounts; `Change Locker` returns to shipping and destroys/hides the mounted checkout.

## Explicit Non-Goals

- No BOX NOW API integration.
- No non-Greece shipping.
- No automated delivery request, voucher, label, or tracking creation.
- No checkout UI, backend route, D1 schema, OpenAPI, generated client, or deployment change.
- No real Stripe validation or production cutover.
