## Why

The current three Artists and three Releases contain missing profile links, single-level sources where full albums now exist, and one stale Tidal Release URL. The approved audit protocol must run once before those provider fields are corrected so evidence and content cannot disagree.

## What Changes

- Run the twelve-slot protocol from `define-music-link-audit` and commit one dated `music-link-audit.md` with every Artist/Release Bandcamp/Tidal slot classified exactly once.
- Manually confirm provider identity, field role, final destination, and Release embed playback before classifying a slot as `Verified`.
- Apply only corrections backed by `Verified` rows: Artist profile roots remain navigation; full Bandcamp/Tidal albums remain Release player sources.
- Leave unresolved providers absent rather than adding blank or speculative URLs.
- Keep release dates, biography copy, merch, schemas, player behavior, and provider parsing outside this correction slice.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `music-link-audit`: Keeps corrections applied from `Verified` rows traceable in the audit that authorized them.

## Impact

- Artist content for Chronoboros, Afterwise, and Ouranopithecus.
- Release provider fields for `Disintegration` and `Anarchotribal`; `Caregivers` is audited without a forced Tidal addition.
- One dated audit report in this change and focused content/player verification.
- No runtime dependency, API, schema, or database change.
