## Why

The Artists route currently mounts search for a three-item roster, where scanning is faster than filtering. The approved rule is to expose search only after the roster grows beyond five artists.

## What Changes

- Derive search availability directly from the server-rendered Artist collection count.
- Emit no Artists search outlet for zero through five artists, preventing its reserved gap, portal, and lazy filter mount.
- Preserve the existing Artists search unchanged for six or more artists.
- Add one focused regression check for the five-to-six boundary.

## Capabilities

### New Capabilities

- `artists-search`: Defines when roster search is available while preserving its existing shell lifecycle.

### Modified Capabilities

None.

## Impact

- Artists route markup and its existing roster layout regression test.
- Existing app-shell portal behavior is reused without modification.
- No content, schema, matcher, filter UI, CSS, dependency, API, or database change.
