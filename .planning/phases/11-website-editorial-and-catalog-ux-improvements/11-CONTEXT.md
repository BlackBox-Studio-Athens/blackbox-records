# Phase 11: Website Editorial And Catalog UX Improvements - Context

**Gathered:** 2026-05-12T13:07:27.5299211+03:00
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 11 improves the static Astro site's editorial and catalog experience from the partner handwritten notes. It adds richer artist profiles, a compact homepage News strip, a latest-release banner, and clearer distro grouping/copy while preserving the existing app shell, overlay routes, player ownership, static content model, and commerce authority boundaries.

This phase does not alter Worker checkout, D1 stock, Stripe, BOX NOW, webhooks, order state, feature gates, cart behavior, store item identity, or shipping behavior.

</domain>

<spec_lock>

## Requirements Locked Via SPEC.md

**7 requirements are locked.** See `11-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `.planning/phases/11-website-editorial-and-catalog-ux-improvements/11-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope from SPEC.md:** rich artist profiles, optional artist links/videos, latest and previous release context, homepage News replacing Latest Releases, a latest-release feature on `/releases/`, optional distro release dates, 12-inch/7-inch/CD distro grouping, and editorial distro description cleanup.

**Out of scope from SPEC.md:** Worker checkout, D1 stock, Stripe, BOX NOW, webhook, order, feature-gate authority, browser-owned commerce authority, and the homepage hide-all-sections idea unless a later discussion explicitly accepts that scope.

</spec_lock>

<decisions>
## Implementation Decisions

### Phase Shape

- **D-01:** Treat the partner notes as one cohesive GSD phase, not many small backlog tasks.
- **D-02:** Use five implementation plans: content model, artist detail UI, homepage/releases modules, distro catalog UX, and verification.

### Artist Profile Presentation

- **D-03:** Artist detail pages should open with the artist story first. Image/title, long-form bio, and profile links carry the first impression; latest release stays near the top but does not dominate.
- **D-04:** Keep existing `bio` frontmatter as the short/card/meta summary. Use the artist Markdown body for rich multi-paragraph profile copy when present; do not add `bio_paragraphs` unless implementation proves the Markdown body path is impractical.
- **D-05:** Artist profile links should render as a small quiet link row near the bio, not as heavy CTAs or a large link list.
- **D-06:** Artist videos mean YouTube embeds. Model them as YouTube video references and render an optional embedded Videos section only when content exists, below the main artist story/latest-release area.
- **D-07:** Previous releases are derived from the existing release-to-artist relationship unless a later content need requires manual curation.
- **D-08:** The player/listen action remains owned by the existing persistent app-shell player model.

### Homepage And Releases

- **D-09:** Replace only the homepage Latest Releases module with News. Keep Artists, Distro, About/Journey, and newsletter sections.
- **D-10:** Homepage News should be a compact update strip, not a large editorial takeover.
- **D-11:** Homepage News should show three items.
- **D-12:** Homepage News should link quietly to `/news/`, without restoring News to visible global header/footer navigation.
- **D-13:** `/releases/` should use an editorial latest-release banner before the grid, with artwork, title, artist, short copy, and listen/detail actions.
- **D-14:** If the releases banner or broader Phase 11 visual direction needs extra design support, route that through GSD planning/UI-spec work and allow a manual GPT Image 2 mockup as input. Mockups guide implementation but do not replace repo design-system constraints.

### Distro And Catalog Metadata

- **D-15:** Add display-only catalog metadata for optional release date and physical format grouping.
- **D-16:** Visible distro group order is Vinyl 12-inch, Vinyl 7-inch, CDs, Clothes, Tapes, Other. `Other` is fallback-only and should render only if needed.
- **D-17:** Distro release dates are a small optional metadata line on cards and render only when known.
- **D-18:** Unknown distro release dates are omitted completely. Do not show placeholders and do not infer dates.
- **D-19:** Distro descriptions get editorial polish only. Improve clarity and tone while preserving titles, slugs, images, routes, and commerce linkage.
- **D-20:** Clean descriptions as editorial content; do not convert descriptions into commerce authority.

### Validation Focus

- **D-21:** Artist direct and overlay routes are the highest-risk Browser Use checks because enriched artist content must render cleanly in both full-page and app-shell overlay contexts.
- **D-22:** Use Afterwise as the representative enriched artist validation path, tying artist profile validation to the current native store/latest-release smoke context.
- **D-23:** Validation includes a targeted app-shell/player continuity check: enriched artist overlays must not move player ownership out of the persistent shell, and YouTube embeds must not interfere with existing listen/player behavior.
- **D-24:** Mobile validation uses representative narrow routes: homepage, enriched artist, releases banner, and distro grouping at one narrow viewport.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Contract

- `.planning/ROADMAP.md` — Phase 11 roadmap entry and dependency chain.
- `.planning/BACKLOG.md` — Source backlog item from partner handwritten website notes.
- `.planning/UBIQUITOUS_LANGUAGE.md` — Canonical project terminology and commerce authority boundaries.
- `.planning/phases/11-website-editorial-and-catalog-ux-improvements/11-SPEC.md` — Locked requirements, boundaries, and acceptance criteria.
- `.planning/phases/11-website-editorial-and-catalog-ux-improvements/11-UI-SPEC.md` — Current UI design contract for Phase 11.

### Existing Frontend And Content Seams

- `apps/web/src/content.config.ts` — Astro content collection schemas to extend.
- `apps/web/src/lib/catalog-data.ts` — Catalog query/projection seam; new display metadata must not become commerce authority.
- `apps/web/src/lib/distro-data.ts` — Distro grouping order and grouping helper.
- `apps/web/src/lib/admin/decap-config.ts` — Decap/editor field generation that must stay aligned with content schema changes.
- `apps/web/src/pages/index.astro` — Homepage section rendering and Latest Releases replacement point.
- `apps/web/src/pages/releases/index.astro` — Release index where the latest-release banner belongs.
- `apps/web/src/pages/distro/index.astro` — Distro grouped catalog rendering.
- `apps/web/src/components/detail/ArtistDetailContent.astro` — Shared artist detail view for direct route and overlay fragments.
- `apps/web/src/components/cards/DistroCard.astro` — Distro card metadata and description rendering.
- `apps/web/src/components/cards/NewsCard.astro` — Existing news card presentation for homepage News reuse.
- `apps/web/src/components/cards/ReleaseCard.astro` — Existing release summary/listen behavior for release banner reuse.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `ArtistDetailContent.astro`: Shared artist detail rendering for canonical pages and app-shell overlays; enriched artist UI should land here so both routes stay aligned.
- `NewsCard.astro`: Reusable news summary card for the compact homepage News strip.
- `ReleaseCard.astro`: Existing release summary/listen behavior that can inform or partially back the latest-release banner.
- `DistroCard.astro`: Existing distro card shell for optional release-date metadata and polished descriptions.
- `catalog-data.ts`: Existing sorted catalog helpers, artist-release relationship lookup, store projection, and metadata construction.
- `decap-config.ts`: Existing pure YAML builder for content editor fields; schema additions should be reflected here.

### Established Patterns

- Astro content collections own editorial content; backend/commerce authority stays outside content.
- Detail components are shared by direct routes and app-shell overlay fragments.
- Shell routing and player persistence are owned by `AppShellRoot.tsx`; Phase 11 must not move player state into artist page-local scripts.
- Content helpers are tested in colocated Vitest files, especially `catalog-data.test.ts` and `decap-config.test.ts`.
- New UI should keep the existing monochrome BlackBox visual language unless a GSD UI-spec/mockup explicitly refines it.

### Integration Points

- Artist schema/content changes connect through `apps/web/src/content.config.ts`, artist Markdown entries, `ArtistDetailContent.astro`, artist cards, and Decap config.
- Homepage News connects `listNewsArticles()` / news collection data to `apps/web/src/pages/index.astro`.
- Latest-release banner connects `listReleaseCatalog()` and artist profile mapping to `apps/web/src/pages/releases/index.astro`.
- Distro grouping connects schema metadata, `groupDistroEntries`, `DistroCard.astro`, and `/distro/` rendering without changing store item routes.

</code_context>

<specifics>
## Specific Ideas

- Use the artist Markdown body as the rich long-form profile area; keep `bio` as short summary text.
- Artist links should feel like profile links rather than ecommerce CTAs.
- Videos are YouTube embeds only for this phase.
- Homepage News is a compact three-item strip with a quiet `/news/` archive link.
- Latest release gets an editorial banner on `/releases/`; a manual GPT Image 2 mockup may be produced by the user and routed through GSD UI planning if needed.
- Distro date metadata is understated and absent when unknown.
- Distro description edits should sound editorial and specific, not generic sales copy.
- Afterwise is the representative enriched artist path for Browser Use validation.

</specifics>

<deferred>
## Deferred Ideas

- Hiding all homepage sections other than News.
- Search/filter/sort controls for distro.
- Account-backed artist/media administration.
- Any checkout, order, stock, cart, Stripe, BOX NOW, or shipping behavior changes.

</deferred>

---

_Phase: 11-website-editorial-and-catalog-ux-improvements_
_Context gathered: 2026-05-12T13:07:27.5299211+03:00_
