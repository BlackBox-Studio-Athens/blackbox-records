## Why

Release fields correctly supply Bandcamp and Tidal player sources, but derived player data can still represent redundant or contradictory state. Provider URL parsing and session identity also need tighter boundaries before link corrections are applied.

## What Changes

- Keep Artist `profile_links` as outbound navigation and Release provider fields as the only authored player sources.
- Represent derived player data as unavailable or as a non-empty provider collection, removing redundant availability state that can disagree with it.
- Tie each provider ID to its valid embed layout and require supported provider URLs to be consumed completely.
- Use stable Release identity for player sessions while keeping display titles separate.
- Preserve zero, one, or both Release providers without adding Artist player fields, a provider registry, or another dependency.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell-and-player`: Tightens authored provider ownership, derived player-data states, URL validation, provider layout, and session identity.

## Impact

- Release content validation and `buildEmbeddedPlayerData`.
- Player trigger data attributes, provider types, and shell session state.
- Focused provider parser, builder, and session regression tests.
