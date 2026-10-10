# Design

## Context

See proposal.md for motivation. All receives canonical entries in source order, while Distro already applies a pure artist/band alphabetical comparator. Collection selection is also used by other categories, whose ordering must remain independent.

## Goals / Non-Goals

Reuse the existing comparator and server-rendered card sequence. Do not sort the shared source projection, add client sorting state, or change category membership.

## Decisions

- Rename the existing sorter to `sortStoreCollectionEntriesByArtist` and keep its copy-before-sort, normalized credit, English collator, title and slug comparisons. Validate its generic input with the existing All collection invariants. A second comparator would risk divergence.
- Apply the shared sorter at the All route and retain its existing Distro component caller. Sorting inside the shared list or layout would also change BlackBox Releases and Merch.
- Keep filter and Coverflow code unchanged: both already reuse canonical DOM order. Existing comparator tests remain valid after updating their import and calls.

## Risks / Trade-offs

- Artist credits can also name labels; sort the existing displayed credit rather than inventing artist metadata.
- Older unsynced Store deltas describe superseded layouts; this delta adds only the All ordering contract and leaves those unrelated changes intact.

## Migration Plan

No content or data migration and no hosted operation. Normal frontend promotion delivers the change; reverting the All route's sort restores its previous source order.
