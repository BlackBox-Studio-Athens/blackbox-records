# Phase 13: Stripe Dynamic Payment Methods Policy - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `13-CONTEXT.md`; this log preserves the alternatives considered.

**Date:** 2026-05-21  
**Phase:** 13-stripe-dynamic-payment-methods-policy  
**Areas discussed:** Stripe automation boundary, Configuration evidence format, Missing config behavior, Browser validation
standard

---

## Stripe Automation Boundary

| Option                         | Description                                                                                    | Selected |
| ------------------------------ | ---------------------------------------------------------------------------------------------- | -------- |
| Verify first, mutate with flag | Default run lists/checks configs only; `--apply` creates or updates `BlackBox merch checkout`. | yes      |
| Always create/update           | Faster, but easier to accidentally change account state during a read-only evidence pass.      |          |
| Verify only                    | Safest, but leaves mutation as a manual step and weakens repeatability.                        |          |

**User's choice:** Verify first, mutate with flag.

| Option                                            | Description                                                                                               | Selected |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------- |
| Pass if unavailable/off                           | Verify banned methods are absent, unavailable, or effectively off; record dashboard-only gaps separately. | yes      |
| Fail unless every banned family is explicitly off | Strictest, but may fail on methods the account cannot use or Stripe does not expose.                      |          |
| Warn only                                         | Easier to proceed, but weaker as a launch gate.                                                           |          |

**User's choice:** Pass if unavailable/off.

| Option        | Description                                                                     | Selected |
| ------------- | ------------------------------------------------------------------------------- | -------- |
| Repo script   | Add a small script with dry-run default, `--apply`, redacted output, and tests. | yes      |
| Docs commands | Lower implementation cost, but less repeatable and harder to test.              |          |
| Both          | Script is canonical; docs show the exact command and interpretation.            |          |

**User's choice:** Repo script.

| Option              | Description                                                                                                              | Selected |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------- |
| Redacted summary    | Print config ID redacted enough for planning docs, allowed/banned method status, mutation mode, and dashboard-only gaps. | yes      |
| Local JSON evidence | More structured, but introduces ignored artifact handling.                                                               |          |
| Both                | Summary for humans plus optional ignored JSON with `--json`.                                                             |          |

**User's choice:** Redacted summary.

**Notes:** The user raised whether repeated scripts might justify an in-house CLI. This was deferred as a tooling idea
until multiple scripts duplicate command parsing, environment loading, redaction, and evidence-output behavior.

---

## Configuration Evidence Format

| Option                | Description                                                   | Selected |
| --------------------- | ------------------------------------------------------------- | -------- |
| Planning-safe summary | Output is redacted and can be copied into `13-VALIDATION.md`. | yes      |
| Terminal-only         | Keeps docs cleaner, but forces manual evidence rewriting.     |          |
| Dual output           | Default terminal summary plus stricter `--planning` variant.  |          |

**User's choice:** Planning-safe summary.

| Option                          | Description                                                                     | Selected |
| ------------------------------- | ------------------------------------------------------------------------------- | -------- |
| Fully redacted                  | Show only shape/prefix like `pmc_[redacted]`; never persist exact IDs.          |          |
| Last 4 chars                    | Useful for human cross-checking while still avoiding full account-specific IDs. | yes      |
| Exact in ignored local artifact | More auditable locally, but adds artifact handling.                             |          |

**User's choice:** Last 4 chars.

| Option                             | Description                                                       | Selected |
| ---------------------------------- | ----------------------------------------------------------------- | -------- |
| Returned keys only                 | Record method keys returned by Stripe with allowed/banned status. | yes      |
| Policy families only               | Cleaner docs, but weaker for troubleshooting.                     |          |
| Returned keys plus policy families | More verbose, but best for explaining absent methods.             |          |

**User's choice:** Returned keys only.

| Option                     | Description                                                                              | Selected |
| -------------------------- | ---------------------------------------------------------------------------------------- | -------- |
| `13-VALIDATION.md`         | Keep test/config evidence with the phase validation surface.                             | yes      |
| `LAUNCH-READINESS.md` only | Good for final checklist, but too coarse for implementation evidence.                    |          |
| Both                       | Detailed evidence in `13-VALIDATION.md`; checklist status/link in `LAUNCH-READINESS.md`. |          |

**User's choice:** `13-VALIDATION.md`.

---

## Missing Config Behavior

| Option                              | Description                                                                                  | Selected |
| ----------------------------------- | -------------------------------------------------------------------------------------------- | -------- |
| Dynamic default                     | Omit both `payment_method_types` and `payment_method_configuration`; Stripe uses defaults.   |          |
| Fail outside local                  | Strong policy gate, but leaves local branching.                                              |          |
| Keep card fallback                  | Least disruptive, but contradicts the Phase 13 shift away from hardcoded card-only checkout. |          |
| Make invalid states unrepresentable | Missing `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID` is not a valid application state.           | yes      |

**User's choice:** The application should not run if this is not configured.

| Option                     | Description                                                                                          | Selected |
| -------------------------- | ---------------------------------------------------------------------------------------------------- | -------- |
| Gateway construction       | `createStripeCheckoutGateway()` throws before Checkout Session creation when the binding is missing. | yes      |
| App startup/env validation | Stronger conceptually, but Workers do not have a conventional startup phase.                         |          |
| Both                       | Add a small env/assert helper and enforce it at gateway construction.                                |          |

**User's choice:** Gateway construction.

| Option                        | Description                                                                       | Selected |
| ----------------------------- | --------------------------------------------------------------------------------- | -------- |
| Yes, all modes                | Local mock config must be updated too, but invalid-state discipline is preserved. | yes      |
| No, local mock exempt         | Easier dev loop, but creates a special path.                                      |          |
| Only stripe-test/sandbox/prod | Balanced, but more branching.                                                     |          |

**User's choice:** Yes, all modes.

| Option                   | Description                                                                                                      | Selected |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- | -------- |
| Constructor/factory test | Factory throws when binding is absent and checkout payload includes `payment_method_configuration` when present. | yes      |
| Route-level only         | Proves user-facing failure, but weaker on the core invariant.                                                    |          |
| Both                     | Factory tests for invariant; route test only if existing coverage can do it cheaply.                             |          |

**User's choice:** Constructor/factory test.

---

## Browser Validation Standard

| Option                                                         | Description                                                                                          | Selected |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------- |
| Browser Use hosted Checkout                                    | Start a real test Checkout and visually confirm only eligible methods appear.                        |          |
| API/CLI only                                                   | Deterministic but initially underspecified for CI.                                                   |          |
| Automated smoke plus Browser Use                               | Strongest visually, but brittle because wallet visibility depends on browser/account/device context. |          |
| CI API verification plus optional go-live browser sanity check | Use Stripe API/config verification and unit invariants as the CI gate.                               | yes      |

**User's choice:** CI should verify Stripe configuration through the Stripe API, not through hosted Checkout browser
inspection.

**Notes:** Browser-hosted Checkout visual checks are useful as go-live sanity evidence but should not be the core CI gate.
Wallet/payment visibility can depend on browser, device, country, currency, amount, domain verification, and account
eligibility. Live-mode API verification repeats later as a go-live gate after live Stripe access, live Products/Prices,
final domain, production webhook wiring, production Worker/D1 configuration, and final approval exist.

## the agent's Discretion

- Pick concise script/helper/package-script names that follow the existing repo style.

## Deferred Ideas

- Consider an in-house CLI for commerce operations scripts only after multiple scripts duplicate command parsing, env
  loading, redaction, and evidence-output behavior.
- Production live-mode checkout evidence waits for Go-Live / Launch Hardening.
- Production cutover and final domain switch remain outside Phase 13.
- BOX NOW automation remains reopen-only.
- Any future decision to allow PayPal, Klarna, BNPL, or bank-debit methods requires a new explicit product decision.
