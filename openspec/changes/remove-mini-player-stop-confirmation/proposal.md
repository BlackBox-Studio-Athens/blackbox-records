## Why

The owner requested retaining the mini player's Stop control while removing its Stop? confirmation. Stopping should take one activation.

## What Changes

- Route the existing Stop button directly to the existing session-ending handler.
- Remove the arming state, three-second timer and confirmation announcement.
- Preserve the square icon, accessible name, focus restoration, iframe removal and other player behavior.
- Update player tests, baseline specs and the design rule to match.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell-and-player`: Stop ends the session immediately.
- `public-controls`: Reduced motion retains immediate Stop behavior without a confirmation state.

## Impact

The app-shell player surface and its unit and continuity browser tests change. No backend, provider, routing, layout or dependency changes are required. The owner authorized local commit, integration into local main and removal of this worktree; no push or deployment is included.
