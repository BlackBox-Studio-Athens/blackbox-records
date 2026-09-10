## Context

Artist `profile_links` are public navigation. Release `bandcamp_embed_url` and `tidal_url` are the only player sources. `buildEmbeddedPlayerData` currently returns a redundant `hasProvider` boolean plus possibly empty URLs, provider layout is derived later, and player selection is cached by display title. These shapes permit contradictions and unstable identity even though the current six records validate.

| Artist / Release                 | Artist profile links                  | Release player sources         |
| -------------------------------- | ------------------------------------- | ------------------------------ |
| Chronoboros / `Caregivers`       | None                                  | Bandcamp album embed           |
| Afterwise / `Disintegration`     | Bandcamp track and Tidal artist links | Bandcamp track and Tidal album |
| Ouranopithecus / `Anarchotribal` | None                                  | None                           |

This gives Artist profile coverage of one of three per provider and Release player coverage of two Bandcamp, one Tidal, one both, and one neither. The Afterwise track-versus-profile/album choices remain audit questions, not parser errors.

## Goals / Non-Goals

**Goals:**

- Represent unavailable and playable Release data as distinct states.
- Tie provider identity, embed URL, and layout together.
- Fully validate supported provider URL shapes.
- Use stable Release identity for shell sessions while keeping title as display copy.

**Non-Goals:**

- Artist-authored player fields, content corrections, a provider registry, or a new dependency.
- More providers or changes to modal/minimize/stop behavior.

## Decisions

1. Change the builder contract to `null` for no valid sources or a value containing `releaseId`, nonblank display title, and a non-empty provider tuple. Remove `hasProvider`; callers narrow on `null`. This makes an available player with zero providers unrepresentable.
2. Use a discriminated `PlayerProvider` union. Bandcamp branches permit only `bandcamp-album` or `bandcamp-track`; Tidal permits only `tidal`. Each branch contains its validated embed URL. The builder remains the sole owner of provider derivation and priority.
3. Parse the complete supported URL path. Bandcamp must be an official HTTPS `bandcamp.com/EmbeddedPlayer/` album or track embed whose remaining segments are recognized. Tidal must be an HTTPS public album, track, playlist, or video path with no ignored trailing path. Unsupported or partially consumed paths fail content validation.
4. Emit stable Release identity separately from the title in player trigger data. `ActivePlayerSession`, modal-open resolution, and provider preference use Release identity; UI labels continue to use title. This replaces title-keyed selection without changing iframe cache ownership.
5. Artist details continue to use their latest Release's derived player data. Artist profile links and Release `merch_url` never enter the builder.

## Risks / Trade-offs

- [Tighter parsing rejects a provider URL previously ignored in part] → Add accepted/rejected fixtures before switching content validation and report the exact unsupported shape.
- [Changing session identity touches several shell seams] → Keep the same state machine and iframe lifecycle; replace only the key and carry display title separately.
- [Non-empty tuples are awkward at DOM boundaries] → Validate reconstructed trigger data before opening; a trigger without providers remains inert.

## Migration Plan

1. Add provider parser and builder tests, then change the builder/result union.
2. Migrate all Astro consumers from `hasProvider` to null narrowing and emit Release identity.
3. Migrate the shell's title-keyed provider preference/session comparisons to Release identity.
4. Run content, unit, build, and player Browser Use checks. No persisted data migration is required.

## Open Questions

None.
