## Why

PRD catalog preparation and shopper launch currently reuse `PRD_OPEN_GATE`, even though one authorizes an operator-controlled provider mutation and the other permits runtime checkout. The shared name obscures two different decisions and makes safe live Stripe preparation harder to reason about.

## What Changes

- Replace persistent PRD catalog-mutation gating with an explicit, false-by-default confirmation on each exact-commit promotion run and direct apply command.
- Rename the Worker launch authorization from `PRD_OPEN_GATE` to `PRD_LAUNCH_APPROVED`, using the plain boolean value `true`.
- Keep `native_checkout_enabled` as the separate reversible runtime switch and emergency disable.
- Require PRD shopper checkout to satisfy both launch approval and runtime enablement while allowing confirmed live catalog preparation to happen with checkout closed.
- Remove the old name without a compatibility alias so stale configuration fails closed.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `catalog-promotion-automation`: PRD live catalog mutation requires one-run, exact-commit confirmation instead of shopper launch approval.
- `commerce-checkout`: PRD checkout requires explicit launch approval plus the existing runtime checkout switch.
- `environment-model`: PRD preparation, launch approval, and runtime enablement become separate named controls.
- `tooling-validation`: validation must reject unconfirmed PRD mutation, retired control names, and any path that lets preparation enable checkout.

## Impact

- Catalog promotion workflow inputs and contract tests.
- Stripe catalog verification CLI parsing and PRD apply safeguards.
- Worker bindings, environment policy helpers, feature-gate composition, runtime configuration checks, docs, and tests.
- GitHub and Cloudflare configuration require a fail-closed hard rename; no database, HTTP, generated-client, or Stripe webhook payload contract changes.
