# Proposal

## Why

A single transient R2 request or media-body failure aborts the CMS backup. PRD run `39564989600` failed before its D1 snapshot after almost nineteen minutes because `Network connection lost.` was not retried.

## What Changes

- Retry recognized transient R2 failures within fixed operation and run limits, with backoff.
- Repeat a failed media download from a fresh `get`, and retain completed objects in the current capture.
- Preserve existing snapshot, checksum, media-reference, retention, privacy and budget checks.
- Add deterministic fault-injection coverage and update the backup runbook with retry costs and failure handling.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `emdash-editorial-operations`: Bound automatic recovery from transient backup storage failures while preserving complete recovery points.

## Impact

`apps/backend/scripts/cms-backup.mjs`, its existing Node tests and `docs/cms-backup.md`. No new dependency, credential, hosted resource, schema, backup manifest version or workflow setting. Restore imports and D1 snapshot execution retain their current behavior. Delivery ends at local validation; no commit, push or hosted run is requested.
