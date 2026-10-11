# Proposal

## Why

The staff editor can discard unsaved browser changes, but it cannot remove a
saved private draft without publishing over it or editing it back manually.
That makes accidental saved edits harder to recover from and leaves the
public version unnecessarily separated from the editor's intended state.

## What Changes

- Add a confirmed staff-editor action to discard the current saved draft and
  return the record to its live revision.
- Allow the native EmDash `discard-draft` operation through the CMS request
  guard with the existing revision and authorization checks.
- Keep unsaved-change discard, News/social-link trash, publication, and
  read-only publication history as separate operations.
- Cover the behavior in backend and browser smoke checks and document the
  distinction between unsaved changes, saved drafts, trash, and history.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `emdash-editorial-operations`: staff members can discard the current saved
  draft for any editable content record when a live and draft revision exist.
- `content-publishing`: discarding a saved draft restores the current live
  content without publishing or restoring an arbitrary historical revision.

## Impact

The change is limited to the staff editor, the CMS mutation allowlist, smoke
fixtures, and editorial documentation/spec deltas. It adds no database
migration, public API, commerce behavior, or hosted bulk operation.
