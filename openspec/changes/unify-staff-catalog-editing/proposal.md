# Proposal

## Why

Label members cannot reliably preview a saved image change and must leave catalogue editing to manage stock. Uploading photos individually and searching only titles slows routine catalogue updates.

## What Changes

- Diagnose and fix image readiness failures without modifying pending drafts.
- Append multiple uploaded photos to one release or distro item, preserving existing images and partial successes.
- Put price and stock controls alongside catalogue details using existing commerce commands.
- Find catalogue entries by band name as well as title across paginated results.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `staff-workspace`: reliable preview, band-name search and per-entry bulk photo upload.
- `staff-item-management`: one-page details, price and stock editing.

## Impact

Staff catalogue, media upload, preview readiness, workspace search and existing stock controls. Preserve EmDash revisions, commerce authority, idempotency and PRD pending data. No data migration or automatic publication.
