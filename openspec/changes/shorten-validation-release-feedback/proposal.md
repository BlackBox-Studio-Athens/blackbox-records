## Why

Package-only edits wait on unrelated contracts, and release preparation serializes independent UAT and PRD builds. Make feedback arrive sooner while preserving complete validation, immutable candidate promotion, and hosted mutation controls.

## What Changes

- Make local package checks truly scoped, add package test watch, and add conservative opt-in reuse of successful validation phases.
- Measure local and hosted feedback milestones; move advisory unused-code reporting off candidate acceptance.
- Prepare UAT and PRD artifacts independently, assemble the existing immutable bundle, and report read-only UAT feedback early.
- Cancel superseded preparation while serializing hosted mutations through final acceptance.
- Keep full local validation before push, complete CI acceptance, credential separation, live-catalog confirmation, and checkout launch gates.

## Capabilities

### Modified Capabilities

- `tooling-validation`: scoped iteration, safe phase evidence reuse, and feedback timing without reducing final acceptance.
- `static-site-and-deployment`: independent target preparation and early UAT feedback using verified artifact identities.
- `software-release-promotion`: preserve the immutable promotion contract and mutation lock coverage through acceptance.

## Impact

Validation scripts and tests, package scripts, GitHub Actions workflows, release artifact tooling and tests, repository operating instructions, measurement output, and OpenSpec requirements. Implementation is local to this worktree; hosted deployments and provider mutations are outside scope.
