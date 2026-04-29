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

## Explicit Non-Goals

- No BOX NOW API integration.
- No non-Greece shipping.
- No automated delivery request, voucher, label, or tracking creation.
- No checkout UI, backend route, D1 schema, OpenAPI, generated client, or deployment change.
- No real Stripe validation or production cutover.
