## Context

On 2026-07-13, the repo contained 79 Distro records. Content grouped 54 as 12-inch, one as 10-inch, one as 7-inch, 19 as CDs, and four as Tapes; the accepted Distro Inventory Source instead has 53, one, two, 19, and four. `Magic Sleazeball Corrida` accounts for the mismatch. The content schema already constrains exact groups, while `format` remains display copy.

## Goals / Non-Goals

**Goals:**

- Preserve exact physical types in authored and source data.
- Present 7-inch and 10-inch records in one browse category without persisting that combined label.
- Stop artifact generation when matched content and source types disagree.
- Preserve deterministic ordering and complete server-rendered fallback.

**Non-Goals:**

- A second category model, CMS migration, or catalog-wide `order` renumbering.
- Search, rail, pagination, or virtualization work.
- Inferring physical type from free-text `format`.

## Decisions

1. `DistroGroupName` remains the exact persisted union. A small presentation mapping turns both `Vinyl 7-inch` and `Vinyl 10-inch` into the browse label `7-inch & 10-inch Vinyl`; it never changes either record's physical type. This uses the existing group field instead of adding a parallel taxonomy.
2. Browse groups render in this order: `Vinyl 12-inch`, the combined small-vinyl category, `CDs`, `Tapes`, then populated `Clothes` and `Other`. Empty groups stay omitted. Items keep ascending `order`, then title, so existing gaps and duplicate order values remain deterministic.
3. Catalog-source reconciliation compares each bijectively matched content record's normalized exact group with the inventory row's item type. A mismatch is a validation error before Desired Catalog State, availability, or stock artifacts are written. `format` is not consulted as authority.
4. Correct `Magic Sleazeball Corrida` to `Vinyl 7-inch`. Focused tests cover the derived label, visible exact types, ordering, empty groups, the correction, and fail-fast source drift. Browser verification confirms all records remain present.

## Risks / Trade-offs

- [A combined heading can hide the exact format] → Keep the individual card's exact physical type visible.
- [Source aliases can match the wrong record] → Require a bijective match before comparing type or generating artifacts.
- [Future groups need a place in browse order] → Amend the single presentation mapping when an accepted physical type is added; do not infer order from content.
