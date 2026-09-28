# Upgrade EmDash to 1.0.1

## Why

BlackBox uses patched EmDash 0.41.0. Upgrade to 1.0.1 for upstream fixes while preserving revision safety, private drafts, accepted publications and Free-tier Access authentication.

## What Changes

- Pin core, Cloudflare integration and staff admin to 1.0.1; refresh the lockfile and exact release-age exceptions.
- Rebase the two still-required revision-safety corrections onto the published package.
- Rebuild migration manifests and test migrations 088 and 089 against copied existing state and fresh initialization.
- Disable the new background update checker; retain the existing release workflow.
- Validate changed URL, relation and Portable Text behavior through existing contracts and smoke suites.
- Prepare staged Local, UAT and separately approved PRD acceptance and recovery evidence.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `emdash-editorial-operations`: dependency upgrades must preserve retained state through migration and restart, including one-shot scheduling instants and seed completion.

## Impact

Backend and staff dependencies, the existing dependency patch, CMS configuration and upgrade tests, migration guidance and release evidence. BlackBox public API and content snapshot shapes remain unchanged. No new hosted resources, sessions, permissions or paid capacity.
