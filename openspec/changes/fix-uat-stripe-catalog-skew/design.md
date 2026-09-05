## Context

UAT catalog promotion already owns the safe order: D1 readiness, Stripe apply, Worker deployment, listing verification, then static deployment. Provider smoke and a stale standalone workflow duplicate parts of that sequence. Public Store Offer and checkout requests also carry an environment-dependent mutation switch.

## Goals / Non-Goals

**Goals:**

- Keep one UAT Worker deployment owner.
- Keep public reconciliation read-only and fail-closed.
- Preserve signed webhook repair and explicit catalog promotion.
- Make smoke failures name the affected Store Item and catalog state.

**Non-Goals:**

- Change public API shapes, D1 schema, Stripe catalog ownership, PRD deployment, or static smoke timing.
- Add release markers, retries, dependencies, or replacement workflows.

## Decisions

- Delete duplicate deployment paths instead of coordinating them. Catalog promotion already has required ordering and credentials.
- Hard-code public reconciliation to `apply: false` and delete caller mutation policy. Webhooks keep bounded repair; promotion keeps Product Projection apply.
- Preserve Product Projection drift as checkout-blocking. Correct sequencing fixes current outage without weakening catalog acceptance.
- Extend existing smoke error text instead of adding a diagnostics endpoint.

## Risks / Trade-offs

- Direct manual Worker deploys can still bypass workflow policy → document them as unsupported and enforce repository workflow ownership with existing validation.
- A second checkout defect may appear after catalog alignment → require paid smoke to pass and diagnose any later failure separately.

## Migration Plan

1. Align current UAT with catalog promotion using `reset_uat_catalog=false`.
2. Land workflow and runtime simplification.
3. Promote the exact final commit through UAT and require paid smoke plus Chrome verification.
