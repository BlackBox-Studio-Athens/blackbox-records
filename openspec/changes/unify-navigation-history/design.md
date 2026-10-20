# Design

## Context

See [proposal.md](proposal.md) for the approved outcome and [the public](specs/app-shell-and-player/spec.md) and [Staff](specs/staff-workspace/spec.md) deltas for observable behavior. The owner separately approved the behavior brief, including 500 ms search grouping, internal modal steps and grouped explicit dismissal. This is a production behavior repair within existing layouts; visual probes add no useful evidence.

At preparation, primary `main` is `59f20954c1ea5b6c33024777e9a80368e4aac85b`. Existing unrelated dirty work includes agent-guidance refactoring and release records. The ignored preservation receipt is `.codex-artifacts/unify-navigation-history/preservation-before.json`.

The completed `back-closes-shell-surfaces` change provides marked same-URL entries and scroll fixes, but its narrower acceptance does not prove this change. Current public `surface-history.ts` tracks independent markers, and the popstate router checks player, sheet and page-surface handlers in fixed priority. Section navigation collapses an overlay to its background and replaces a phone Menu entry. Store/Artists choices mostly remain local state. Staff `staff-navigation.ts` has validated destinations, position/cursor context and guarded traversal, but some workspaces replace deliberate choices and several panels have only component state.

## Goals / Non-Goals

**Goals:** restore an entry's complete browsing context, preserve current player and operation lifetimes, and keep a canceled navigation coherent across URL, focus and input.

**Non-Goals:** a visual redesign, global Back button, navigation dependency, backend/schema change, domain undo, or a new draft/recovery store. Browser-controlled keyboard dismissal and third-party iframe internals remain outside first-party navigation interception.

## Decisions

### 1. Extend each app's existing history owner

Keep public primitives in web-platform and orchestration in app-shell; keep Staff primitives in staff-platform. Do not import public-app internals into Staff or create a new cross-app package. This preserves closed ownership and avoids a second router.

Store serializable restoration metadata in an app-owned history namespace: a distinct entry ID, owned entry position, existing route identity, page browsing state, ordered surface frames, scroll context and stable focus target. Surface frames identify their owner, selected content/view, immediate opener and the owned position at which the group opened. Use the existing browsing values and identities rather than duplicate domain data. Preserve every other owner's history fields, including EmDash's. Persist no DOM nodes, draft buffers, credentials, operation payloads or stale authoritative commerce values.

Seed direct entries from the rendered view. Read legacy markers compatibly during transition and remove only superseded app-owned markers when writing a new snapshot. Unknown/unowned entries retain native navigation; never derive a safe return from `history.length` or traverse beyond a validated owned opener.

### 2. Give traversal and user changes different paths

Use explicit push for a new user browsing choice, replace for current-entry position updates/initialization/refresh, and apply-only for history restoration. Compare semantic browsing state before pushing; identifiers, scroll and focus changes do not manufacture a new browsing step.

Keep existing route/query/hash conventions. Additional public choices stay in history state; Staff keeps its current validated URL parameters and adds existing missing allowlist values, including Orders `dispatch=not_shipped`. Keep named task returns and cursor trails separate from generic single-step traversal. A copied URL without entry metadata gets the existing direct-entry behavior rather than a fabricated cursor trail.

### 3. Restore a destination in dependency order

Save the outgoing entry before URL mutation. Abort obsolete work, restore the underlying page by its route, apply page choices, then restore the ordered surface frames. Apply positions and focus only after required controls mount. Page-content caches remain keyed by their existing content identity; interactive state belongs to each entry ID, even for repeated URLs.

Each page/surface owner registers a small read/apply adapter with its existing history helper and unregisters on disposal. Registration immediately applies relevant pending saved state, which covers lazy islands and restored full documents. Keep an activation token/entry ID across asynchronous work so stale loads, search timers, transition completions and focus callbacks cannot settle over a newer destination. Reuse existing cancellation mechanisms and do not add polling or eager loads for dormant views.

### 4. Preserve the source modal when navigating away

Save the current background and modal stack before following its link. Close presentation for the destination without rewriting the source entry to its background. A page opened from the phone Menu similarly gets a new destination entry, leaving its Menu source restorable. This intentionally replaces the baseline's Menu-replaces-entry rule.

Returning first reconstructs the recorded background, then its choices and source modal. Preserve direct detail documents and native checkout/provider boundaries. Save/restore first-party browsing metadata through the existing full-document lifecycle; never retry a form or provider operation just because history returned.

### 5. Consume only the explicitly dismissed surface group

Back/Forward applies the target snapshot, including an earlier selection inside the same open modal. Surface order comes from recorded interaction, not handler priority.

Close/Escape/backdrop computes the distance to that frame's validated owned opener and traverses there once. After traversal, replace the opener's relevant browsing choices with the final applicable choices from the dismissed group, retaining its parent surface stack. This preserves the approved distinction between retracing changes and closing the surface. A nested close consumes only the nested group. With no validated owned opener, close locally without consuming an unrelated native entry.

Forward remains the browser's forward branch and can revisit a recorded surface snapshot; explicit dismissal creates no extra empty Back step. Guard against repeated close requests while traversal is pending. Passive resize-driven closure uses the same dismissal path.

### 6. Group search commits independently of result updates

Keep live filtering and existing read debounce intact. Start/reset a 500 ms history timer for typing; Enter or blur flushes it and duplicate commits are ignored. Before a user navigates away, flush pending source search state before recording the destination. Before history restoration, cancel the source timer so it cannot push into the target entry. Do not add one history entry per keystroke or connect data refresh effects to user push logic.

### 7. Keep operations and playback with their existing owners

Staff restoration uses `followStaffHistory` and current autosave/leave/recovery paths. Changes within one editor do not unnecessarily leave/reload its document; preserve the current buffer when switching tabs or closing an auxiliary picker. A navigation that really leaves waits for the latest serialized autosave and existing stock/setup guards. Canceled/failed navigation restores the original entry without a push loop; repeated requests settle one permitted transition.

Review/setup/confirmation views revalidate their current authoritative state and existing operation identity. Opening/restoring them performs reads only, never a write. Completed transactions are not reversed or re-executed.

Public history controls player presentation, not historical playback. Keep the connected current-session iframe and existing minimize/reopen/Stop semantics. An entry for a stopped or replaced session must not recreate that old session or claim it is still active. Restore only currently valid presentation through the player controller.

## Integration map

| Owner             | Existing edit points and complete behavior slice                                                                                                                                                                                                                                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public navigation | web-platform `lib/surface-history.ts`; app-shell root, popstate and section navigation, overlay-history/navigation, player history and sheet callbacks. Replace marker priority and destructive source-entry rewriting together.                                                                                                                     |
| Public browsing   | ArtistsRosterFilters; StoreDistroSearch and Filter sheet; crate-view; StoreImageGallery; StorePreorderShowcase and its video/chapter handlers. Capture choices before page disposal and hydrate them on return.                                                                                                                                      |
| Staff navigation  | staff-platform `staff-navigation.ts` and StaffBack; StaffShell Menu/history, preserving EmDash metadata, contextual returns and existing leave guards.                                                                                                                                                                                               |
| Staff browsing    | ContentApp and ItemSetupApp; StockOperationsApp; OrderWorkspace; StatsWorkspace; WebsiteChanges, PublicationReviewFlow and Calendar/History panels; MediaLibrary picker/detail and editorial relationship selection where it changes browsing. Cover tabs, steps, filters, selected records and owned panes without serializing edited field values. |
| Verification      | Existing co-located public/Staff module tests, public `e2e` navigation/player/Artists/Store specs and `scripts/test-content-workspace.mjs`. Add focused scenario selection through the guarded runner where needed; do not bypass release-tier feedback policy.                                                                                      |

All UI interaction implementation and its tests belong to Claude under the approved plan. No independent backend slice is required. Codex coordinates records, preservation and returned-diff review; shared files have one writer at a time. Read each changed module's current guide and boundary metadata before edits; update executable policy and its spec only if an actual public export/dependency changes.

## Risks / Trade-offs

- More detailed browsing history means more Back steps, especially Crate/content selection. This is explicitly approved; unchanged and passive events are excluded.
- Closing a changed modal rewrites its opener's applicable browsing choices. Preserve unrelated parent state and test nested close, native Forward and rapid repeated dismissal.
- Lazy content and changing catalog records can invalidate saved identities. Use existing unavailable/error feedback and safe focus fallbacks; do not fabricate a valid view or replay an old operation.
- Cross-origin iframe internals, native keyboard dismissal and physical Back gestures differ by browser. Keep native boundaries and report unverified device behavior separately from simulated browser traversal.

## Delivery and acceptance

Work locally on primary `main`, leaving all protected dirty/source hashes intact except the eventual explicitly owned implementation files. No new branch/worktree, commit, push, hosted write, Content Publication or deployment is authorized.

The tasks and [handoff](handoff.md) own implementation and acceptance. Use scoped module tests while editing, extend the existing browser fixtures, run strict change validation and final affected `pnpm validate`, and refresh Graphify once after the meaningful code batch. Do not refresh the graph merely for these planning records. Browser/provider/device evidence remains separate from local repository validation. A later Software Release is a separate authorization.

## Evidence basis

Read-only preparation used Graphify focused explanations and CodeGraph source/callers, followed by exact relevant contracts. Browser history follows the [HTML history model](https://html.spec.whatwg.org/dev/nav-history-apis.html); modal focus recovery follows the [W3C dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/). These support the implementation approach, not a claim of product acceptance. No new UI behavior has been implemented or browser-tested in this preparation.
