# Design

## Context

See proposal.md for motivation. The existing Store projection already combines canonical release and distro sources, while Distro membership, markup and client format filtering currently assume source-backed format sections. Grid-first browsing, artist filters and the shared Coverflow controller are implemented in the completed but unsynced Store browsing change.

## Goals / Non-Goals

Keep one canonical ordered card list and the current Store UI. Preserve source-owned physical formats and commerce state. Pre-order eligibility, labels and flow remain Claude's separate later delivery.

## Decisions

- Give release-sourced Store items both BlackBox Releases and Distro presentation membership. Retain the existing canonical source/slug and explicit editorial-only exclusions.
- Carry optional release date/stage into the browser-safe Store item projection. Sort only the Distro presentation, using a fixed render reference date, a native English case-insensitive collator, title and slug tie-breakers. Recent released items lead newest-first; all other items follow band A–Z. Reject future, undated and explicitly upcoming entries from recent promotion.
- Subtract six calendar months at UTC-day granularity and clamp the cutoff day to the destination month's final day. Calculate on rendering; static output changes at its next build, without a scheduler.
- Reuse accepted Distro groups unchanged. Derive a release item's filter group from its existing primary physical option: explicit 7/10-inch vinyl retains its size, Vinyl/LP defaults to 12-inch, CD maps to CDs, cassette/tape to Tapes, clothing to Clothes, and unmatched options to Other. Additional editorial formats do not create additional Store items or imply another sellable option.
- Keep format group derivation only for navigation names/counts and legacy fragments. Render one Grid/optional Coverflow with the ordered cards; add a small New release label only to recent BlackBox cards in Distro. Reuse existing card styles and artwork.
- Read a format key from each card instead of deriving membership from DOM sections. Format links retain their fragment IDs as anchors at the complete catalog start. All active filters intersect in the existing visibility pass, force Grid and preserve order; a zero-result catalog remains a valid focus target. Cleanup and shell snapshot sanitation continue resetting transient markers.

## Risks / Trade-offs

- Generic Vinyl/LP copy does not state a size. Retain the catalog's existing standard LP interpretation; explicit size tokens take precedence, and accepted distro source groups never use this fallback.
- Static builds retain the date window from their render. Document that existing rebuild/publication timing controls refresh.
- Overlapping active Store deltas have old grouped/preview-first prose. This change owns the new mixed catalog behavior; reconcile those deltas during eventual sync rather than archiving unrelated changes here.
- Claude's pre-order flow arrives later. This change completes without detecting or promoting pre-orders and does not add a placeholder field.

## Migration Plan

No data migration or hosted operation. Use normal code promotion after Local acceptance; reverting the frontend change restores the previous presentation without touching content or commerce identity.
