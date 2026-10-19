## Why

The owner approved click/tap pause and resume for pre-order background films on 19 October 2026, without a visible icon or control. This supersedes the earlier noninteractive film-band rule for native pre-order footage only.

## What Changes

- Add an empty, named native button over the film layer, behind existing copy and actions, with Enter/Space support and keyboard-only focus.
- Keep manual pause per chapter/clip separate from automatic visibility, music-session, reduced-motion and data-saving eligibility.
- Preserve the displayed film frame during manual pause; suppress toggles after pointer movement or cancellation.
- Preserve hero and full-video controls, purchase/listening/navigation, and photo/cover-only panels.

## Impact

Owners: `web-store` component and markup tests; `storefront-catalog` pre-order styles; dedicated deterministic browser test. No new dependency, API, export, backend, hero, checkout, or publication change. Coordinator owns integration into main; this worktree may make one focused local commit only.
