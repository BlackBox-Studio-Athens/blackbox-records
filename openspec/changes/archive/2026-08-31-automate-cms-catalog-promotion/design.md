## Context

The repository already contains the implemented artifact generator, promotion workflow, UAT D1/provider commands, hosted listing-readiness check, deployment dispatch, smoke runner, pause path, and redacted evidence. The old plan remained large because it also described future live PRD launch work.

## Goals / Non-Goals

**Goals:**

- Preserve one deterministic path from editorial content to a verified UAT catalog.
- Make the committed artifact revision the identity for provider work and deployment.
- Keep PRD closed and report that state truthfully.
- Remove duplicated price, stock, webhook, and environment rules.

**Non-Goals:**

- Live PRD provider apply, PRD secrets, launch approval, paid smoke, or shopper opening.
- Bidirectional Stripe/content sync, a PIM, a generic workflow engine, or CMS commerce controls.
- Redefining Store Offer, Price Authority, inventory, or webhook recovery.

## Decisions

### Generate one committed artifact set

Current Store Item content plus repository-owned catalog policy produces deterministic Product Projection, Desired Catalog State, and environment readiness artifacts. Decap edits only editorial fields.

When artifacts drift, automation creates one conventional bot commit on the same branch. Repository gates, UAT apply, deployment, and evidence use that commit, not the original content-only commit. Bot-only reruns stop when the artifact check is already clean.

### Run one UAT promotion sequence

For the artifact commit:

1. run repository gates;
2. verify UAT runtime and persistent webhook configuration;
3. apply required UAT D1 migrations/readiness data;
4. run provider/D1 dry-run;
5. apply only unambiguous app-owned UAT catalog changes;
6. reread provider/D1 state;
7. deploy the UAT Worker;
8. require complete hosted listing readiness;
9. dispatch the UAT static deployment for the same commit;
10. run smoke and upload redacted Promotion Evidence.

The workflow is serialized by target and commit. A newer artifact commit supersedes an older pending run. A failed step stops all later mutation/deployment.

### Keep concerns single-owned

- stabilize-store-listing-prices owns Price Authority, Desired Price bootstrap-only behavior, and listing readiness semantics.
- full-distro-catalog-source-of-truth owns the distro manifest.
- align-cloudflare-environment-names owns Local/UAT/PRD naming.
- verify-stripe-sandbox-webhook-endpoint owns persistent UAT webhook verification.
- D1/operator stock remains authoritative after first publication.

This workflow calls those contracts; it does not restate or fork them.

### Treat PRD as dry-run only

While the PRD-open gate is closed, the workflow may generate artifacts and run redacted PRD readiness/dry-run checks. It reports not_configured and performs no live provider apply, PRD D1 catalog apply, PRD Worker/static launch, or live Checkout smoke.

production-go-live-readiness owns the later decision and evidence for those actions.

### Keep evidence small and redacted

Promotion Evidence records commit IDs, changed app identities, step status, action counts, deploy references, smoke outcomes, and rerun guidance. It excludes secrets, full provider IDs, raw API payloads, customer data, and payment details.

## Risks / Trade-offs

- [Bot commit races later content] → Serialize by branch/target and supersede stale pending runs.
- [Provider state is ambiguous] → Fail before apply or deployment and report app-owned identities only.
- [PRD closure is mistaken for failure] → Emit explicit not_configured evidence tied to the PRD-open gate.
- [Workflow absorbs domain rules] → Reference owner specs and keep orchestration checks thin.

## Migration Plan

Implementation is complete. Strict validation and archive sync should preserve the UAT orchestration contract and remove this completed change from the active queue. Future live PRD work continues only in production-go-live-readiness.
