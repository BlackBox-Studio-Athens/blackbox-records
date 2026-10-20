# Proposal

## Why

Back and Forward currently restore only some public surfaces and Staff navigation states. Component-local browsing choices, fixed surface-handling priority and rewritten overlay entries can lose the previous view, its choices or its position.

The owner approved restoring each deliberate browsing change across the public site and Staff, including changes made inside modals, while retaining current layouts and operation safeguards.

## What Changes

- Record distinct history entries for deliberate page, content, filter, tab, pagination and view changes; suppress unchanged selections.
- Group live search history at a 500 ms typing pause, Enter or blur without changing existing result timing.
- Restore the underlying page, browsing choices, ordered open surfaces, scroll and focus, including repeated visits to the same URL and lazy-mounted views.
- Retrace modal changes through Back/Forward; explicit Close, Escape or backdrop dismissal exits that modal group and retains final browsing choices.
- Preserve the originating modal when navigating from it to another page, including phone Menu navigation, rather than replacing its history entry.
- Extend the same behavior to Staff without losing drafts, weakening leave guards or replaying completed operations.
- Preserve the persistent player session and native checkout/provider document boundaries.

## Capabilities

### New Capabilities

None. Extend the existing public shell and Staff workspace contracts.

### Modified Capabilities

- `app-shell-and-player`: per-entry public browsing state, ordered surface restoration, modal grouping, source-modal navigation and scroll/focus continuity.
- `staff-workspace`: deliberate browsing history and grouped Staff surfaces with existing contextual return, autosave and operation protections.

## Impact

Implementation reaches web-platform history helpers, app-shell navigation/overlays/player/sheets, public Artists and Store browsing components, staff-platform navigation and the affected Staff workspaces, plus their existing unit and browser fixtures. Public and Staff adapters remain in their current closed module owners. No backend API, persistence schema, provider integration, new router or dependency is required.

UI interactions and UI tests retain the approved standing Claude ownership. Codex prepares the canonical records and concrete [implementation handoff](handoff.md), then reviews returned source/evidence before coordination or integration. Work stays on primary `main` in `C:/Users/SVall/WebstormProjects/blackbox-records`; this request does not authorize a commit, push, deployment or Content Publication.
