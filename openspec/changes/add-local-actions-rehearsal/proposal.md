# Proposal

## Why

The maintainer wants the ability to test GitHub Actions locally in the future, with no application or testing-infrastructure code changes. This clarification supersedes the original custom-harness plan.

## What Changes

- Install the official act executable and verify the existing Linux Docker engine.
- Document manual selection of jobs from the existing release workflow and known compatibility limits.
- Remove this change's custom runner, compatibility bridge, package aliases, policy integration and workflow edits.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tooling-validation`: Document optional manual local Actions rehearsal and its evidence limits.

## Impact

Developer-machine tool installation and operational documentation only. Application code, package scripts, feedback policy and GitHub workflows remain as before this change. The original full job-matrix acceptance is no longer required by the clarified scope.
