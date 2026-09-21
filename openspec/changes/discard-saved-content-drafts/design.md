# Design

## Context

The staff editor already uses EmDash native content requests, revision tokens,
autosave, conflict handling, and separate dialogs for unsaved discard and
trash. The CMS middleware currently allowlists content create/save/lifecycle
operations but rejects the native `discard-draft` action.

## Goals / Non-Goals

**Goals:**

- Expose the native saved-draft discard operation for every editable content
  collection.
- Preserve optimistic locking, private staff authorization, and the existing
  editor state on failure.
- Make the distinction between browser-local discard, saved-draft discard,
  trash, and publication history visible in the UI and tests.

**Non-Goals:**

- Restoring arbitrary historical revisions.
- Adding a public endpoint, database table, migration, commerce action, or
  bulk discard workflow.

## Decisions

- Use EmDash's native `POST content/{collection}/{id}/discard-draft` route
  instead of copying live data through a new backend endpoint. This keeps
  revision semantics and authorization in the existing CMS implementation.
- Gate the menu action on both revision identifiers and on a clean editor. A
  dirty editor continues to use the existing unsaved-discard flow, preventing
  accidental loss of text that has not been persisted.
- Confirm the destructive action separately from trash and unsaved discard,
  then reload the native record and workspace summary. This avoids displaying
  stale draft metadata after the server accepts the discard.
- Extend the existing backend and browser smoke fixtures only far enough to
  prove the route, revision guard, public-content invariant, and editor
  reload. No new test harness or dependency is justified.

## Risks / Trade-offs

- **A concurrent save can win before discard.** The submitted revision is
  required, so the server rejects stale discard requests and the editor keeps
  the user's text for conflict recovery.
- **The action is unavailable while dirty.** This adds one confirmation step
  for a member who wants to discard both kinds of changes, but prevents the
  saved-draft action from silently deleting newer local edits.

## Migration Plan

Deploy the middleware and staff bundle together. Existing records need no
migration; the action appears only when the native record already exposes a
live/draft revision pair. Rollback is a normal code rollback and leaves CMS
records untouched.
