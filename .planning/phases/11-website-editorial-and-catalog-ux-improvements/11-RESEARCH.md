# Phase 11 Research - Website Editorial And Catalog UX Improvements

## Scope

Phase 11 is a static Astro editorial/catalog UX phase. It must not change Worker checkout, D1, Stripe, BOX NOW, cart authority, order state, store item identity, feature gates, or shipping behavior.

The highest-leverage next task is to replace the stale Phase 11 plans with repo-evidence-backed plans that reflect the completed context session. The current five plan files are correctly shaped by workstream, but they predate the final discussion decisions around artist Markdown bodies, YouTube embeds, homepage News, release banner placement, Distro groups, and Browser Use validation.

## Repo Evidence

### Existing planning state

- `.planning/phases/11-website-editorial-and-catalog-ux-improvements/11-CONTEXT.md` captures the final discussion decisions.
- `.planning/phases/11-website-editorial-and-catalog-ux-improvements/11-SPEC.md` locks seven requirements: `SITE-ARTIST-01`, `SITE-RELEASE-01`, `SITE-HOME-01`, `SITE-DISTRO-01`, `SITE-DISTRO-02`, `SITE-DISTRO-03`, and `SITE-VERIFY-01`.
- `.planning/phases/11-website-editorial-and-catalog-ux-improvements/11-UI-SPEC.md` already exists, so UI work should follow the existing BlackBox monochrome/static editorial direction instead of creating a new visual system.
- `.planning/ROADMAP.md` already lists five Phase 11 plans: content models, artist pages, homepage/releases, Distro, and verification.

### Content model and CMS surface

- `apps/web/src/content.config.ts` currently models artists with `bio` frontmatter only, while the discussion decided that `bio` remains short/card/meta summary and the artist Markdown body becomes the rich profile source.
- The artist collection has no structured profile links or video references yet. Phase 11 should add optional browser-safe editorial fields for a quiet profile link row and YouTube references.
- `apps/web/src/lib/admin/decap-config.ts` currently exposes artist `Bio` as text and does not surface artist Markdown profile body, profile links, or videos. Schema/CMS changes must stay aligned so future content editing remains collection-backed.
- The Distro schema currently uses `group: Vinyls | Clothes | Tapes`, optional `format`, and no first-class optional `release_date`. Phase 11 needs display groups matching `Vinyl 12-inch`, `Vinyl 7-inch`, `CDs`, `Clothes`, `Tapes`, and fallback-only `Other`, plus optional known dates.

### Artist detail implementation

- `apps/web/src/components/detail/ArtistDetailContent.astro` already receives one collection entry and is reused by direct artist pages and overlay partial routes.
- `apps/web/src/pages/artists/[slug].astro` and `apps/web/src/pages/app-shell-overlay/artists/[slug].astro` both delegate to `ArtistDetailContent.astro`. Any artist detail change must keep both direct and overlay paths working.
- `ArtistDetailContent.astro` already derives previous releases with `listReleaseCatalogByArtistId()` and a latest release from sorted release catalog data.
- Player/listen intent is already delegated through `buildEmbeddedPlayerData()` and app-shell data attributes. YouTube embeds must remain editorial embeds and must not become player state.
- `apps/web/src/components/detail/NewsDetailContent.astro` shows the existing local pattern for rendering Markdown bodies via `render(item)` and `<Content />`. Artist rich profile body should reuse that Astro content rendering pattern instead of introducing parallel body arrays.

### Homepage, releases, and cards

- `apps/web/src/pages/index.astro` currently renders `Latest Releases` from `listReleaseCatalog().slice(0, 3)` with `ReleaseCard`.
- `apps/web/src/components/cards/NewsCard.astro` already renders collection-backed news cards with image, date, title, summary, and link. Homepage News should reuse this component for the three-item strip.
- `apps/web/src/pages/releases/index.astro` currently renders only `InternalPageHero` and the release grid. The latest-release editorial banner should sit before the grid and use existing release catalog/player patterns.
- `apps/web/src/components/cards/ReleaseCard.astro` already contains the embedded-player data attributes and is a useful source for the release banner listen action.

### Distro data and tests

- `apps/web/src/lib/distro-data.ts` currently defines `DISTRO_GROUP_ORDER = ['Vinyls', 'Clothes', 'Tapes']` and groups entries by that old enum.
- `apps/web/src/pages/distro/index.astro` currently defines intro copy keyed to `Vinyls`, `Clothes`, and `Tapes`.
- `apps/web/src/components/cards/DistroCard.astro` displays only `eyebrow` and `format` in the metadata row.
- `apps/web/src/lib/catalog-data.test.ts` currently asserts the old Distro group order and old store metadata shape, so content-model changes need focused unit test updates.
- Several Distro summaries already contain embedded release-date prose. Phase 11 should add optional first-class dates only when known and should omit unknown dates without placeholders or inferred values.

## Implementation Implications

- Plan 11-01 should be the model/data foundation: artist optional profile links/videos, Markdown body support, Distro group/date schema, Decap config, data helpers, and focused unit tests.
- Plan 11-02 should implement the artist page UX on top of 11-01: rich story-first body, quiet links, optional YouTube section, previous releases, and direct/overlay consistency.
- Plan 11-03 should implement homepage News and the releases latest banner together because both use existing catalog/news listing helpers and page-level presentation.
- Plan 11-04 should implement Distro grouping/copy/display polish after schema/data helpers exist.
- Plan 11-05 should remain a verification-only pass covering Browser Use paths, responsive checks, player continuity, and the mandatory `pnpm test:unit`, `pnpm check`, and `pnpm build`.

## Validation Architecture

Validation should combine deterministic commands with Browser Use manual checks:

- Unit tests: update catalog/data tests for Distro group order, optional date metadata, release sorting, and News/latest-release data usage where helper logic changes.
- Static checks: `pnpm check` for content schema, Astro, TypeScript, lint, and formatting.
- Production build: `pnpm build` to prove static collection rendering and routes.
- Browser Use checks:
  - Direct enriched artist route, using Afterwise as the representative enriched artist.
  - Artist overlay route through the app shell.
  - Homepage mobile/desktop rendering with three-item News strip and quiet `/news/` link.
  - Releases page with latest-release banner and normal grid.
  - Distro page at a narrow viewport showing the new group order and no placeholder dates.
  - Targeted app-shell/player continuity around the artist overlay and any YouTube embeds.

## Risks

- Artist Markdown body rendering could accidentally change card/list summaries if `bio` and body responsibilities are blurred. Keep `bio` as the short summary and render body only on artist detail.
- YouTube embeds could create visual or focus conflicts in overlays. Treat them as ordinary editorial iframes and validate direct plus overlay paths.
- Distro group renames can break existing JSON content and tests. Update content, schema, grouping helpers, display copy, and tests in one model commit.
- Homepage News should not restore News to global navigation. Use a quiet section link only.
- Release banner player actions should reuse the existing app-shell player contract and avoid page-local player logic.

## RESEARCH COMPLETE
