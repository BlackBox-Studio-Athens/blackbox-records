# Design

## Context

The backup exporter already reads CMS table rows in one transactional D1 batch. The current backup then compares a second D1 export and an unchanged R2 inventory, so normal edits abort an otherwise recoverable capture.

## Goals / Non-Goals

**Goals:** Keep one D1 point-in-time export, preserve every media storage key in it, and allow ordinary edits and uploads during capture.

**Non-Goals:** Change CMS content, media, commerce data, backup retention, restore behavior, or PRD release inputs.

## Decisions

- Read media storage keys in the same D1 batch as exported rows. Use those keys to verify the finished media set against the captured database state.
- Capture and copy the source media inventory before and after the D1 snapshot. Merge by object key, read unchanged objects once, and allow unreferenced additions or deletions in the capture window.
- Keep checksum and budget checks. Skip an object that disappears or changes during a pass, then require all snapshot-referenced keys to be present before writing a recovery-point manifest. Conflicting versions of a referenced key fail closed.
- Preserve the current backup blob and manifest format so restore remains compatible.

## Risks / Trade-offs

- A media object created and then deleted across the snapshot boundary may be unavailable in both inventories while still referenced by the D1 snapshot → do not publish an incomplete recovery point; the backup fails with a referenced-media error.
- Media additions after the D1 snapshot may be retained as unreferenced extras → recovery remains complete for the captured CMS state, with the existing object and byte limits still enforced.

## Migration Plan

Update the local capture implementation, its focused tests, and the backup runbook. Existing manifests remain readable. The next successful hosted pre-upgrade run becomes the recovery point for the next PRD schema promotion.
