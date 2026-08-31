## Why

Decap publication previously left generated catalog artifacts, UAT D1/provider state, Worker deployment, static deployment, and evidence as separate manual steps. The completed automation connects those steps while keeping Decap editorial-only and PRD live mutation behind the existing launch gate.

## What Changes

- Generate deterministic catalog artifacts from current Store Item content and explicit repository policy.
- Commit generated drift through a bot commit and run all later work from that exact commit.
- Promote through UAT: repository gates, runtime/webhook preflight, D1 readiness, provider dry-run/apply, hosted listing readiness, Worker deployment, static deployment dispatch, smoke, and redacted evidence.
- Keep PRD limited to dry-run/readiness with a not_configured result while the PRD-open gate is closed.
- Fail closed on repository gates, ambiguity, missing configuration, or readiness gaps.
- Keep price semantics, inventory authority, environment names, and webhook endpoint rules owned by their dedicated specs.
- Do not add live PRD provider mutation, launch secrets, production smoke, or go-live policy here; production-go-live-readiness owns them.

## Capabilities

### New Capabilities

- catalog-promotion-automation: Deterministic content-to-UAT catalog orchestration and redacted promotion evidence.

### Modified Capabilities

- static-site-and-deployment: Catalog-affecting deployment follows the verified artifact commit and hosted readiness.
- tooling-validation: Promotion gates and evidence are deterministic, redacted, and fail closed.

## Impact

- Generated catalog scripts/artifacts, bot commit workflow, UAT promotion workflow, D1/provider verification, Worker/static deployment sequencing, smoke evidence, and maintainer docs.
- No Decap commerce fields, browser authority, live PRD mutation, or new infrastructure service.
