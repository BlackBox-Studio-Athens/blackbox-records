## Why

The shared static deployment workflow currently rebuilds and redeploys both UAT and PRD after every `main` push, even when only repository documentation or OpenSpec planning changed. This spends CI and provider capacity without changing either deployed artifact and also starts the downstream UAT provider smoke.

## What Changes

- Skip the shared static deployment workflow when a `main` push changes only an audited, non-build documentation path.
- Continue deploying when any changed path can affect the site, build, workflow, or runtime; this includes Markdown under Astro content collections and mixed documentation/code pushes.
- Base the decision on changed paths, not a Conventional Commit `docs(...)` header or a commit-message skip token.
- Preserve `workflow_dispatch` as the explicit force-deploy path.
- Add repository validation for the narrow ignore policy and its fail-open boundaries.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `static-site-and-deployment`: Define when the shared UAT/PRD static workflow may skip a `main` push without weakening deploy gates or suppressing deploy-relevant Markdown changes.

## Impact

- `.github/workflows/pages.yml` push trigger behavior.
- `scripts/verify-environment-model.ts` source validation for the workflow contract.
- `apps/backend/test/scripts/environment-model.test.ts` focused regression coverage.
- The downstream `.github/workflows/uat-smoke.yml` no longer starts for documentation-only pushes because no upstream deployment workflow run exists.
- No runtime API, dependency, hosting target, or manual deployment change.
