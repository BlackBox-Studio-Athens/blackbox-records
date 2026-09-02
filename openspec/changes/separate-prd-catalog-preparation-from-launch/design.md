## Context

See `proposal.md` for motivation. Current catalog promotion, direct PRD catalog apply, Worker checkout policy, runtime validation, docs, and tests reuse `PRD_OPEN_GATE`. GitHub Actions and Worker bindings are separate stores, but the shared name represents unrelated operator and runtime decisions. PRD checkout already has a second runtime control, `native_checkout_enabled`.

## Goals / Non-Goals

**Goals:**

- Give live catalog preparation, launch approval, and runtime checkout one truthful control each.
- Let an exact PRD catalog revision be prepared and verified while shopper checkout remains closed.
- Make stale configuration fail closed during the rename.
- Preserve existing Product Environment, Stripe, D1, checkout, and Promotion Evidence boundaries.

**Non-Goals:**

- No new feature-flag service, approval framework, database state, HTTP field, or provider abstraction.
- No live provider, D1, Worker, GitHub, or Cloudflare mutation during this change.
- No rename of `native_checkout_enabled`; it already describes its runtime responsibility.

## Decisions

### Use one-run confirmation for live catalog changes

The manual catalog promotion workflow gains boolean input `confirm_live_catalog_changes`, defaulting to false. The PRD job may plan without it, but every mutating PRD step requires it. Direct PRD apply uses the matching `--confirm-live-catalog-changes` option.

This confirmation is operation-scoped rather than configuration-scoped: it applies to one workflow run and one exact artifact commit, then disappears. The existing serialized workflow, exact SHA, credential environment, and promotion scope remain unchanged.

A permanent GitHub variable or feature flag was rejected because stale authorization could survive after preparation. Reusing shopper launch approval was rejected because provider mutation and serving shoppers are different side effects.

### Reserve launch approval for Worker checkout

Rename the Worker binding to `PRD_LAUNCH_APPROVED`. Only exact normalized value `true` approves PRD launch. Local and UAT keep their existing environment behavior. PRD checkout remains unavailable unless launch approval passes before the existing runtime checkout evaluation.

The old binding is not accepted as an alias. A stale old value is ignored, which leaves checkout closed. This hard migration is safer and smaller than dual-reading a security-sensitive control.

### Keep runtime enablement as the emergency switch

`native_checkout_enabled` remains the reversible operational control. PRD checkout requires both launch approval and runtime enablement. Either false branch blocks capability exposure and Checkout Session creation before provider work.

| Live catalog confirmation | Launch approved | Runtime switch | Catalog apply | Shopper checkout |
| --- | --- | --- | --- | --- |
| false | false | false or true | blocked | blocked |
| true | false | false or true | allowed for that exact run | blocked |
| false | true | false | blocked | blocked |
| false | true | true | blocked | enabled |

### Delete mixed-responsibility policy helpers

Catalog apply parses its own explicit operation confirmation. Worker checkout parses launch approval through a checkout-specific environment policy. Shared helpers no longer claim one value controls both catalog mutation and checkout.

Read-only verification and plan output do not require confirmation. Only code paths that can apply PRD provider or D1 catalog changes require it.

## Risks / Trade-offs

- **External configuration still uses the old name** -> Ignore it and remain closed; migration checks search every active repo surface before archive.
- **Workflow confirmation is set accidentally** -> Keep false default, require explicit PRD target and exact artifact SHA, and retain existing credential scope and repository gates.
- **Direct CLI apply bypasses workflow confirmation** -> Require the explicit confirmation option in PRD apply parsing and test failure before gateway construction.
- **Launch approval is mistaken for runtime enablement** -> Test the complete truth table and document emergency disable through the runtime switch.

## Migration Plan

1. Add delta specs and focused tests for independent controls.
2. Add one-run workflow input and direct CLI confirmation; remove catalog use of `PRD_OPEN_GATE`.
3. Rename Worker binding and checkout policy to `PRD_LAUNCH_APPROVED`; do not add an alias.
4. Update runtime verification, workflow assertions, docs, current OpenSpec artifacts, and active literals.
5. Run focused tests, full repository gates, strict OpenSpec validation, and a scoped retired-name search.
6. Archive after active repo code and docs contain no `PRD_OPEN_GATE`; historical archives remain unchanged.

External rollout later removes any obsolete GitHub or Worker value named `PRD_OPEN_GATE`. `PRD_LAUNCH_APPROVED` remains absent until the sole launch owner approves production checkout.
