## Context

This change follows `harden-music-provider-data` and `define-music-link-audit`. The first change stabilizes Artist-versus-Release provider ownership and parser behavior; the second defines the twelve-slot manual audit. OpenSpec has no dependency primitive, so this order is recorded here and in `tasks.md`.

Approved candidates for the first run are:

| Record                   | Bandcamp                                                       | Tidal                                       |
| ------------------------ | -------------------------------------------------------------- | ------------------------------------------- |
| Artist Chronoboros       | Add `https://chronoboros.bandcamp.com/`                        | Leave absent unless a candidate is verified |
| Artist Afterwise         | Replace the track link with `https://afterwise.bandcamp.com/`  | Keep Artist `75705460`                      |
| Artist Ouranopithecus    | Add `https://ouranopithecus.bandcamp.com/`                     | Add Artist `79935313`                       |
| Release `Caregivers`     | Audit the existing album embed                                 | Leave absent unless a candidate is verified |
| Release `Disintegration` | Replace track embed `2461449138` with album embed `3481803854` | Replace album `505727858` with `521945607`  |
| Release `Anarchotribal`  | Add album embed `2894598366`                                   | Add album `526716850`                       |

User confirmation establishes editorial intent for the listed destinations. The audit still must confirm final destination and, for Release rows, working embed playback before a correction is `Verified`.

## Goals / Non-Goals

**Goals:**

- Produce the first complete audit using the approved protocol.
- Apply only manually verified provider-link corrections.
- Keep Artist navigation and Release player sources in their existing fields.
- Preserve absence when no provider destination is verified.

**Non-Goals:**

- Release-date, biography, merch, schema, parser, or player-behavior changes.
- A crawler, provider API, report generator, validator script, or second report format.
- Completing every provider slot.

## Decisions

1. Apply `harden-music-provider-data` and `define-music-link-audit` first. This change consumes their provider-role and audit-state contracts instead of restating them.
2. Create one dated `music-link-audit.md` and classify all twelve current slots through Browser Use. `Missing` and `Questionable` rows never authorize content mutation; a run with zero `Verified` corrections is valid.
3. For every applied correction, record the source content path, field, old value or absence, replacement, and decisive evidence in the corresponding `Verified` row. This keeps report and mutation reviewable together without a machine-readable mirror.
4. Artist destinations remain in `profile_links`. Release Bandcamp destinations use provider-backed album embeds in `bandcamp_embed_url`; Release Tidal destinations use album pages in `tidal_url`. An unresolved optional field remains absent, never a blank placeholder.
5. Verify only changed destinations and existing player seams. Reuse current content parsing, provider builders, and Browser Use checks; add no runtime abstraction or dependency.

## Risks / Trade-offs

- [Provider access or playback is inconclusive] → Keep the row `Questionable` and skip its correction.
- [A plausible destination has the wrong role] → Require the audit row and target field to agree on Artist navigation versus Release playback.
- [Report and content drift apart] → Record old and replacement values beside the evidence and commit them in the same implementation change.
