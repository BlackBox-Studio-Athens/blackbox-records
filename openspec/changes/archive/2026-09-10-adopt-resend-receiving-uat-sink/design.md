## Context

The UAT Product Environment currently rewrites every transactional email recipient and every newsletter Contact email to `blackboxrecordsathens+TESTING@gmail.com`. The normal post-merge Provider Smoke runs `happy_path_paid` and `pay_what_you_want_paid`; each paid reconciliation sends one shopper email and one ops email, so four messages reach the human Gmail inbox per run.

The Stripe UAT Smoke Suite already runs unattended in GitHub Actions and can also be started locally. It proves hosted Checkout behavior, webhook-authoritative paid order state, and D1 state. The separate Resend UAT Smoke Suite proves newsletter Contact registration. Neither suite reads an inbox. The GitHub Actions environment has Cloudflare and Stripe credentials but no Resend credential, while the operator workstation already has an authenticated Resend CLI profile.

Resend now provides managed Receiving domains, a Receiving API, and a JSON CLI command for listing received mail. The current custom sending domain has Receiving disabled; enabling it would change MX behavior on a production-owned domain and is unnecessary for a UAT sink.

## Goals / Non-Goals

**Goals:**

- Stop automated UAT messages from reaching a human Gmail inbox.
- Keep Local mocks and direct PRD routing unchanged.
- Preserve the unattended post-merge GitHub Actions smoke with no new credential.
- Give an operator one explicit command that runs the canonical two paid scenarios, waits for all four messages, writes redacted Smoke Evidence, and exits pass/fail without manual inbox work.
- Reuse the existing Resend account, CLI profile, Smoke Harness, order-reference formatter, and process helper.

**Non-Goals:**

- No new email provider, package, API key, GitHub secret, Worker secret, webhook, HTTP endpoint, database table, or queue.
- No Receiving or MX change for `blackboxrecordsathens.com`.
- No PRD delivery receipt gate, deliverability/SLA measurement, email-client rendering test, or replacement for the existing newsletter Contact smoke.
- No requirement that the credential-free GitHub workflow query Resend.

## Decisions

### Use a fixed address on a Resend-managed Receiving domain

The existing account's managed Receiving domain is `ambkime.resend.app`; use the stable catch-all address `uat-sink@ambkime.resend.app`. Resend treats the managed domain as catch-all, so no mailbox provisioning or per-run address mutation is required.

Update only the UAT recipient override and its exact-value validation. Local continues using provider mocks, PRD continues ignoring the UAT override, and `blackboxrecordsathens.com` remains sending-only in Resend. After replacement proof succeeds, delete the synthetic `blackboxrecordsathens+TESTING@gmail.com` Contact so a later UAT Broadcast cannot revive Gmail noise.

Alternatives rejected:

- `testmail.app` gives independent receipt proof but adds another account and credential with a smaller free allowance.
- Cloudflare Email Routing plus Worker/D1 requires a new ingestion and query service.
- Enabling Receiving on `blackboxrecordsathens.com` risks changing real inbound routing.
- Mailpit, Mailtrap Free, and Ethereal do not prove the deployed Resend-to-internet path under the required free setup.

### Keep GitHub smoke credential-free; make receipt proof an explicit mode

Add an opt-in flag such as `--verify-email-receipts` to the existing `pnpm smoke:stripe-uat` runner. The checked-in GitHub workflow does not pass the flag, so it keeps its current unattended behavior and never needs a Resend profile or key. The documented operator command selects `happy_path_paid,pay_what_you_want_paid` and passes the flag.

Once started, receipt mode is fully non-interactive. It performs a read-only Resend CLI preflight before creating paid provider state, runs the paid scenarios, polls Receiving, validates the four messages, writes evidence, and exits. Missing CLI, missing authentication, disabled Receiving, malformed JSON, timeout, duplicate matches, or missing receipts fail the command with a redacted diagnostic; the runner never invokes `resend login` or pauses for operator input.

Alternatives rejected:

- Adding a full-access Resend key to GitHub conflicts with the explicit no-new-key constraint and Resend has no receive-only key scope.
- Reusing the Cloudflare Worker secret is not possible from GitHub because Worker secret values are write-only.
- A Worker-side receipt proxy or polling state would add runtime code, authentication, and persistence solely for CI.
- Manual Dashboard or inbox inspection cannot produce deterministic Smoke Evidence.

### Invoke the existing CLI through existing process tooling

Use the repo's finite-process helper to run one JSON, non-interactive CLI command:

- `resend emails receiving list --limit 100 --json`

The command uses the existing default CLI profile, including `RESEND_PROFILE` when the operator has selected one. Run it with captured stdio and a silent or redacting process logger so received-email IDs and provider output are not echoed. No API key is accepted as a new smoke argument, printed, copied into evidence, or forwarded to child-process command text.

Keep receipt parsing and matching in one focused Stripe-smoke module. Do not add a provider abstraction to backend runtime code: this is operator tooling around a provider-specific CLI boundary.

### Correlate four receipts with app-owned facts

Receipt mode records the run start time before paid scenarios begin. For each successful canonical paid scenario, require the authoritative UAT D1 order row and reuse `createCheckoutOrderReferenceToken` with its order ID, Checkout Session ID, and paid timestamp. Do not derive a reference from the public checkout-state fallback, which lacks the real order ID and paid timestamp. Expect exactly two inbound messages at the configured sink after the run start:

- shopper: `Payment received - <order-reference>`
- ops: `Fulfill <order-reference> - paid checkout`

List metadata is filtered by sink recipient and exact subject, with the order reference as the primary correlation key. Accept `created_at` from a small fixed lookback before the local run start to tolerate workstation/provider clock skew, then require exactly one match for each expectation. Another run's message, a duplicate, or one audience standing in for the other cannot satisfy the check.

Use a bounded receipt timeout with a documented default and CLI override. Polling stops immediately when all four messages are proven or when the deadline is reached.

### Extend existing scenario evidence without persisting message bodies

Add the computed order reference and a compact receipt observation to each paid scenario's existing `evidence.json`; include aggregate receipt status in `summary.json`. Safe receipt evidence contains only scenario, audience, order reference, received timestamp, match count, and pass/fail issues.

Do not write Resend profile/account details, API responses, received-email IDs, raw headers, recipient payloads, signed download URLs, HTML, text bodies, postal addresses, phone numbers, or full shopper email addresses. Run existing secret scanning/redaction over diagnostics and evidence. When receipt mode is absent, retain the current evidence shape or use an explicit `not_run` value only if needed to keep the type simple; do not make the credential-free workflow look receipt-verified.

### Keep newsletter Contact verification separate

`pnpm smoke:resend-uat` continues to post one synthetic consented registration and prove `status: registered`. The UAT Worker routes that Contact to the new managed sink address, but Contact registration is not an email receipt and does not count toward the four-message assertion.

## Risks / Trade-offs

- Resend Receiving or CLI outage causes operator receipt mode to fail even when checkout succeeds → keep receipt mode explicit and preserve the credential-free GitHub smoke as a separate signal.
- Same-provider sending and receiving does not prove delivery to Gmail or another mailbox provider → accept this because the requirement is containment plus deterministic receipt, not independent deliverability benchmarking.
- CLI output could leak provider data → request list-only JSON quietly, parse in memory, persist only the allowlisted observation fields, and apply existing redaction/secret scanning.
- Concurrent UAT runs share one sink → require run start time plus exact app-owned order references and reject duplicate matches.
- Local and provider clocks can differ → use a small fixed `created_at` lookback while keeping the exact order reference as the primary correlation key.
- Public checkout state omits fields needed to reproduce the email reference → require the authoritative D1 row in receipt mode and fail safely if it cannot be read.
- A canonical run consumes eight Resend transactional units: four sent and four received → document the current allowance, keep traffic low, and re-check provider limits during implementation/provider proof; no paid feature is required by design.
- Rolling back the UAT override restores Gmail noise → prefer fixing the managed sink; if rollback is required for UAT continuity, state explicitly that the previous Gmail behavior returns.

## Migration Plan

1. With the existing Resend CLI profile, locate or provision a managed Receiving domain and prove one synthetic send appears in the received-message list; do not enable custom-domain Receiving.
2. Record the chosen non-secret sink address in UAT Worker config and exact-value validation, then update focused tests and runtime-config verification.
3. Add the explicit receipt mode, preflight, four-message matcher, evidence fields, and tests without changing the checked-in GitHub invocation.
4. Deploy the UAT Worker and run the operator receipt command. Require both shopper and ops receipts for both canonical paid scenarios.
5. After proof, delete the old `blackboxrecordsathens+TESTING@gmail.com` synthetic Contact and confirm later UAT sends target only the managed sink.
6. Update docs and run the required repository gates plus the credential-free workflow-contract tests.

Rollback is a code/config revert to the previous UAT override. It does not affect PRD or order authority, but it intentionally reintroduces Gmail delivery until the managed sink issue is corrected.

## Open Questions

None. Provider independence, credential placement, automation boundary, and receipt count were resolved during proposal research.
