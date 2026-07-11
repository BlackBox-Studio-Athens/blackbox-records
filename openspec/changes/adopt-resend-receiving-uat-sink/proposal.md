## Why

Every normal post-merge UAT Provider Smoke run sends four synthetic paid-order emails to the label's human Gmail inbox, creating avoidable noise. The current smoke proves checkout, order reconciliation, and Resend request acceptance, but it provides no automated receipt proof when an operator needs to validate email delivery.

## What Changes

- Replace the UAT Gmail recipient override with a non-human address on a Resend-managed Receiving domain; do not enable Receiving or change MX records on `blackboxrecordsathens.com`.
- Preserve direct PRD recipient routing and the existing Local mock behavior.
- Keep the post-merge GitHub Actions Provider Smoke unattended and free of new Resend credentials.
- Add an explicit receipt-verification mode to the existing Stripe UAT Smoke Suite. An operator starts it with the already-authenticated Resend CLI profile; the runner then polls, validates, records evidence, and exits without further operator input.
- Require receipt verification for all four emails already emitted by the normal two paid scenarios: shopper and ops email for `happy_path_paid`, plus shopper and ops email for `pay_what_you_want_paid`.
- Correlate receipts with run start time, paid-order references, expected audience, and sink recipient so concurrent or stale UAT mail cannot satisfy a run.
- Keep newsletter Contact verification separate: `pnpm smoke:resend-uat` continues proving UAT Contact registration while routing the sink Contact away from Gmail.
- Update runtime configuration validation, focused tests, operator documentation, and redacted Smoke Evidence without adding a new package, API key, GitHub secret, Worker endpoint, webhook, or persistence model.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `environment-model`: Define the UAT email sink as a Resend-managed Receiving address isolated from human inboxes, custom-domain inbound routing, Local, and PRD.
- `tooling-validation`: Add non-interactive, operator-started receipt verification for all four paid-scenario emails while preserving unattended credential-free post-merge UAT smoke.

## Impact

- Affected Worker configuration and validation: `apps/backend/wrangler.jsonc`, backend email runtime config, runtime-config verification, and focused tests.
- Affected smoke tooling: the Stripe UAT Smoke Suite, shared redaction/evidence helpers where reusable, smoke tests, and the existing GitHub workflow contract.
- Affected provider state: one Resend-managed Receiving domain/address and one-time retirement of the old Gmail UAT sink Contact after the replacement is proven.
- Affected documentation: `README.md`, environment and UAT smoke guidance, and related OpenSpec deltas.
- No shopper API, database schema, production email routing, custom-domain MX, or dependency change.
