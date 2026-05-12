# Phase 11 Patterns - Website Editorial And Catalog UX Improvements

## Reuse These Patterns

- Content schemas live in `apps/web/src/content.config.ts`; keep frontmatter/data validation there and avoid ad hoc runtime parsing in pages.
- Collection listing and sorting helpers belong in `apps/web/src/lib/catalog-data.ts` or the narrower helper module such as `apps/web/src/lib/distro-data.ts`.
- Detail pages should share direct route and overlay route components. Artist detail changes belong in `apps/web/src/components/detail/ArtistDetailContent.astro`, not duplicated in `apps/web/src/pages/artists/[slug].astro` and `apps/web/src/pages/app-shell-overlay/artists/[slug].astro`.
- Markdown body rendering should follow `apps/web/src/components/detail/NewsDetailContent.astro`: call `render(entry)` in the Astro component and render the returned `Content`.
- Existing player/listen integration uses `buildEmbeddedPlayerData()` plus `data-music-streaming-service-embedded-player-*` attributes. Do not add page-local iframe/player ownership for release listening.
- Cards already own reusable presentation:
  - `apps/web/src/components/cards/NewsCard.astro` for homepage News.
  - `apps/web/src/components/cards/ReleaseCard.astro` for release/player data conventions.
  - `apps/web/src/components/cards/DistroCard.astro` for Distro metadata display.
- Decap config should stay aligned with collection schemas in `apps/web/src/lib/admin/decap-config.ts`.

## Avoid These Patterns

- Do not add parallel content systems for artist profile paragraphs, Distro metadata, or homepage News.
- Do not put Stripe IDs, stock authority, payment state, D1 fields, backend secrets, or provider internals into browser content models.
- Do not infer Distro dates from prose when a first-class date is unknown.
- Do not restore News to global header/footer navigation as part of homepage News.
- Do not create new route-swap or player persistence mechanics in this phase.

## Planning Implications

- Put all schema/content/helper changes before UI changes that depend on them.
- Keep UI tasks vertical by surface: artist detail, homepage/releases, Distro, then verification.
- Include Browser Use validation in the verification plan because Phase 11 changes rendered UI and overlay behavior.
