# Proposal

## Why

PRD CMS backup currently rejects a valid D1 capture when an editor changes content during media copying. Release preparation should protect a recoverable point-in-time state without requiring editors to pause.

## What Changes

- Capture one transactional D1 snapshot and its media storage keys.
- Reconcile media inventories around that snapshot, preserving all assets referenced by the captured D1 state while allowing ordinary edits and uploads during capture.
- Keep checksum, size/object limits, private backup storage, retention, and restore protections.
- Update backup tests and the recovery runbook for the concurrent-edit capture contract.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `emdash-editorial-operations`: hosted backups remain recoverable while editors continue working during capture.

## Impact

`apps/backend/scripts/cms-backup.mjs`, its tests, `docs/cms-backup.md`, and the EmDash editorial-operations specification. No CMS records, media, commerce data, or release workflow inputs are changed by this work.
