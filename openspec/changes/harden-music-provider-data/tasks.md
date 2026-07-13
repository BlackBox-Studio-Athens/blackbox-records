## 1. Provider data boundary

- [ ] 1.1 Tighten Bandcamp and Tidal parsers to consume only complete supported URL shapes and add accepted/rejected path fixtures.
- [ ] 1.2 Replace `hasProvider` plus empty URLs with `null` or player data containing stable Release identity, nonblank display title, and a non-empty discriminated provider tuple.
- [ ] 1.3 Migrate Release cards/details, Artist latest-Release playback, and listen triggers to null narrowing while keeping Artist profile and merch links outside player data.

## 2. Stable shell sessions

- [ ] 2.1 Emit/read Release identity separately from display title and key provider preference, modal reuse, and active-session comparison by that identity.
- [ ] 2.2 Constrain Bandcamp/Tidal provider IDs to valid embed layouts without changing iframe cache, modal, minimize, reopen, or stop semantics.

## 3. Verification

- [ ] 3.1 Add focused parser, builder, provider-layout, same-title/different-Release, trigger, and shell-session tests for zero, one, and both providers.
- [ ] 3.2 Run `pnpm test:unit`, `pnpm check`, and `pnpm build`; use Browser Use to verify open, provider switch, minimize, route persistence, reopen, and stop for current Bandcamp/Tidal Releases.
