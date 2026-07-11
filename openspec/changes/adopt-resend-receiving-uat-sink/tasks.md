## 1. Resend Receiving Proof

- [x] 1.1 With the existing authenticated Resend CLI profile, locate or provision a managed `*.resend.app` Receiving domain, select the stable UAT sink address, and confirm `blackboxrecordsathens.com` Receiving remains disabled.
- [x] 1.2 Send one synthetic probe from the verified BlackBox sender to the managed sink, then prove `resend emails receiving list --json` observes it without printing or committing account/profile payloads.
- [x] 1.3 Re-check current Resend Free-tier sent-plus-received allowance and retention against expected UAT volume, counting eight transactional units per canonical run (four sent plus four received); stop and revise the plan if the low-traffic workflow no longer fits free usage.
- [x] 1.4 Read the existing `blackboxrecordsathens+TESTING@gmail.com` Contact and confirm it is synthetic/UAT-only; defer deletion until replacement proof passes.

## 2. UAT Sink Contract

- [x] 2.1 Replace the UAT `RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL` value with the chosen managed Receiving address while preserving Local mocks, PRD direct routing, and the existing sender/reply-to/ops contracts.
- [x] 2.2 Update backend exact-value validation and `runtime:config:verify` classification so UAT requires the managed sink, PRD rejects the override, and no new credential or custom-domain Receiving requirement is introduced.
- [x] 2.3 Update focused email application, paid-order, gateway, runtime-service, and runtime-config tests to prove shopper email, ops email, and newsletter Contact writes route to the managed UAT sink only.

## 3. Non-Interactive Four-Receipt Mode

- [x] 3.1 Add explicit Stripe UAT Smoke options for receipt verification and a bounded receipt timeout; keep both disabled by default and reject invalid values through the existing argument parser.
- [x] 3.2 Add a read-only, non-interactive Resend CLI preflight through the existing finite-process helper with captured stdio and silent/redacted command logging; fail before paid scenarios when CLI availability, authentication, Receiving access, or JSON output is invalid, without invoking login or accepting an API key argument.
- [x] 3.3 Add one focused receipt module that parses list-only JSON, polls within the deadline, filters by exact order-reference subject and sink recipient with a small clock-skew lookback, and rejects duplicate, wrong-recipient, wrong-subject, wrong-audience, malformed, or missing messages.
- [x] 3.4 Require each receipt-aware paid scenario's authoritative UAT D1 order row, reuse `createCheckoutOrderReferenceToken` with its real order ID/session/paid timestamp, and build the exact shopper and ops expectations from existing template subjects; do not derive receipt references from the incomplete public-state fallback.
- [x] 3.5 Integrate receipt verification after the canonical `happy_path_paid,pay_what_you_want_paid` scenarios so the operator-started run requires exactly four messages, rewrites affected scenario evidence safely, updates summary status, and exits pass/fail without further input.
- [x] 3.6 Add focused tests for CLI preflight failure, argument defaults, four successful receipts, timeout, duplicate/stale/cross-run messages, clock-skew boundaries, redaction, and unchanged no-flag behavior.
- [x] 3.7 Extend the GitHub workflow contract test to prove checked-in post-merge smoke omits receipt mode and Resend credentials, still runs unattended, and never claims inbox receipt evidence.

## 4. Documentation, Migration, and Verification

- [x] 4.1 Update `README.md`, `docs/environment-model.md`, `docs/stripe-sandbox-uat.md`, `docs/catalog-promotion.md`, and any affected `AGENTS.md` or handoff guidance with the managed sink, exact operator command, non-interactive behavior, four-message contract, current free-tier assumption, and credential-free GitHub boundary.
- [x] 4.2 Run `pnpm runtime:config:verify --env local`, `--env uat`, and `--env prd`; confirm only UAT accepts the managed Receiving override.
- [x] 4.3 Run `pnpm openspec validate adopt-resend-receiving-uat-sink --type change --strict` and `pnpm openspec validate --all --strict`.
- [x] 4.4 Run `pnpm test:unit`, `pnpm check`, and `pnpm build` after the final implementation tree is complete.
- [x] 4.5 Deploy the UAT Worker, run `pnpm smoke:resend-uat`, then run the documented receipt-aware Stripe smoke and retain ignored/redacted Smoke Evidence proving shopper and ops receipt for both canonical paid scenarios.
- [x] 4.6 After replacement proof passes, delete only the old `blackboxrecordsathens+TESTING@gmail.com` synthetic Contact and confirm subsequent UAT application email and Contact writes target the managed sink without reaching Gmail.
- [x] 4.7 Confirm a credential-free post-merge UAT workflow run finishes unattended with its existing checkout/order evidence while receipt verification remains explicitly operator-started.
- [x] 4.8 Re-run scoped/all strict OpenSpec validation, `pnpm test:unit`, `pnpm check`, and `pnpm build` against the exact final tree immediately before any push or completion claim.
