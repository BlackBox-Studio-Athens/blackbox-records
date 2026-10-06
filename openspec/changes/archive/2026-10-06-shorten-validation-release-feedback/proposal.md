## Why

Package-only edits repeat the full local suite, and release preparation waits for checks and previous deployments. Make targeted local checks the default, keep complete validation in CI, overlap independent builds, and narrow lock ownership to hosted mutations and acceptance.

## What Changes

- September 29 follow-up: use pinned Nx 23.2.1 for affected selection, task scheduling and local caching, capped at three concurrent tasks with no Nx Cloud. Define source roots and test inputs in Nx projects, retain the existing test runners and integration checks, and keep the boundary manifest's allowed-dependency policy separate from the actual import graph.

- Use native Nx affected tests and test-watch targets; retain source-fingerprinted local evidence and complete CI acceptance.
- Measure local and hosted feedback milestones; move advisory unused-code reporting off candidate acceptance.
- Prepare UAT and PRD artifacts independently, assemble the existing immutable bundle, and report read-only UAT feedback early.
- Cancel superseded preparation while serializing hosted mutations through final acceptance.
- Require targeted local validation before completion/push; retain optional full local validation, complete CI acceptance, credential separation, live-catalog confirmation, and checkout launch gates.
- Extend the edit loop with native affected-test selection and reuse Astro's background server. Overlap complete checks with target preparation, restore image transforms for both targets, and validate the single staff build that is packaged. Record post-migration feedback measurements after the final tree is accepted.

## Capabilities

### Modified Capabilities

- `tooling-validation`: scoped iteration, safe phase evidence reuse, and feedback timing without reducing final acceptance.
- `static-site-and-deployment`: independent target preparation and early UAT feedback using verified artifact identities.
- `software-release-promotion`: preserve the immutable promotion contract and mutation lock coverage through acceptance.

## Impact

Validation scripts and tests, package scripts, GitHub Actions workflows, release artifact tooling and tests, repository operating instructions, measurement output, and OpenSpec requirements. Implementation is local to this worktree; hosted deployments and provider mutations are outside scope.
