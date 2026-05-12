# Phase 11: Website Editorial And Catalog UX Improvements - Context

**Gathered:** 2026-05-12
**Status:** Planned from partner handwritten notes

<domain>
## Phase Boundary

Phase 11 improves the static Astro site's editorial and catalog experience. It sits beside the native commerce migration but does not change commerce authority. Astro content and UI can change; Worker-owned checkout, Stripe, D1, order, stock, and shipping behavior stay out of scope.

</domain>

<decisions>
## Implementation Decisions

### One-phase grouping

- **D-01:** Treat the partner notes as one cohesive GSD phase, not many small backlog tasks.
- **D-02:** Use five implementation plans: content model, artist detail UI, homepage/releases modules, distro catalog UX, and verification.

### Artist scope

- **D-03:** Artist work includes both content model and UI changes.
- **D-04:** Artist pages should support optional links and videos in content, plus multi-paragraph biographies.
- **D-05:** Previous releases are derived from the existing release-to-artist relationship unless a later content need requires manual curation.
- **D-06:** The player/listen action remains owned by the existing persistent app-shell player model.

### Homepage and releases

- **D-07:** Replace only the homepage Latest Releases module with News. Keep Artists, Distro, About/Journey, and newsletter sections unless later scope changes.
- **D-08:** Add a latest-release feature/banner to `/releases/` before the grid.

### Distro/catalog

- **D-09:** Add display-only catalog metadata for optional release date and physical format grouping.
- **D-10:** Separate vinyl into 12-inch and 7-inch display groups, and add CDs as a distro group.
- **D-11:** Clean descriptions as editorial content; do not convert descriptions into commerce authority.

### Manual visual support

- **D-12:** If the user creates a wireframe/mockup with GPT Image 2, treat it as input to `11-UI-SPEC.md`, not as a replacement for repo design-system constraints.

</decisions>

<code_context>

## Current Code Insights

- `apps/web/src/content.config.ts` defines `artists`, `releases`, `distro`, `news`, and `home` collection schemas.
- Artist details render through `ArtistDetailContent.astro` for both direct routes and app-shell overlay fragments.
- Release lists render through `apps/web/src/pages/releases/index.astro`.
- Homepage sections are driven by `apps/web/src/content/home/site.json` and `apps/web/src/pages/index.astro`.
- Distro groups currently come from the `group` field and render in `apps/web/src/pages/distro/index.astro`.
- Store item projection is centralized in `apps/web/src/lib/catalog-data.ts`; new display metadata must not leak backend-only commerce authority into StoreCart or checkout.

</code_context>

<canonical_refs>

## Canonical References

- `.planning/ROADMAP.md`
- `.planning/BACKLOG.md`
- `.planning/UBIQUITOUS_LANGUAGE.md`
- `apps/web/src/content.config.ts`
- `apps/web/src/pages/index.astro`
- `apps/web/src/pages/releases/index.astro`
- `apps/web/src/pages/distro/index.astro`
- `apps/web/src/components/detail/ArtistDetailContent.astro`
- `apps/web/src/lib/catalog-data.ts`

</canonical_refs>

<deferred>
## Deferred Ideas

- Hiding all homepage sections other than news.
- Search/filter/sort controls for distro.
- Account-backed artist/media administration.
- Any checkout, order, stock, or shipping behavior changes.

</deferred>

---

_Phase: 11-website-editorial-and-catalog-ux-improvements_
_Context created: 2026-05-12_
