## Context

`/news/` currently contains only the March 13, 2026 _Caregivers_ entry. News `date` is the editorial publish date, and `listNewsArticles()` exposes every entry in descending order without future-date filtering. Release and Artist content already describe _Disintegration_ and _Anarchotribal_, but both Release dates and related Artist tense are stale, and only _Disintegration_ has a partial structured credit list.

Commit `7193409a` verified and installed album-level Bandcamp and Tidal player sources for both releases. Those links expose complete album records and must remain unchanged while editorial content is aligned around them.

Current evidence:

| Release                          | Strongest web evidence                                                                                                                                                                                                                                 | Current label content                                                                                   | Decision                                                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Afterwise — _Disintegration_     | [Official Afterwise Bandcamp album page](https://afterwise.bandcamp.com/album/disintegration) and verified Tidal album `521945607`: released June 9, 2026; six tracks; complete lineup, recording, mastering, artwork, and BlackBox Records credits    | Release date September 1, 2026; incomplete credit list; Artist copy still says the album is forthcoming | Use June 9 as the Actual Release Date and retrospective News date; enrich the Release summary and credits; update stale Artist tense            |
| Ouranopithecus — _Anarchotribal_ | [Official Ouranopithecus Bandcamp album page](https://ouranopithecus.bandcamp.com/album/anarchotribal) and verified Tidal album `526716850`: released June 6, 2026; ten tracks; complete lineup, recording, production, mastering, and artwork credits | Release date December 1, 2026; vinyl-only format; no structured credits; Artist copy says title TBA     | Use June 6 as the Actual Release Date and retrospective News date; enrich the Release summary, formats, and credits; remove stale upcoming copy |

Search results contain unrelated labels with similar names. Evidence must remain tied to BlackBox Records Athens, the matching artist, and the matching release.

## Goals / Non-Goals

**Goals:**

- Preserve a credible pre-launch timeline of BlackBox Records release participation.
- Give both releases useful News coverage and useful Release detail summaries/credits from the same source-backed fact set.
- Keep News, Release, and Artist dates and tense mutually consistent.
- Preserve the verified album-level music links from `7193409a`.
- Reuse existing content fields, rendering, and release artwork.

**Non-Goals:**

- Redesigning `/news/`, changing navigation, or adding a publication scheduler.
- Changing the News schema, release selection logic, commerce state, or provider integrations.
- Adding Release-body rendering, a native track-list field, or a second credits component when the existing summary, formats, credits, and album player already cover the need.
- Treating Bandcamp-confirmed digital availability as proof of a physical edition; existing physical formats remain label-owned facts.

## Decisions

### Use event chronology for pre-launch backfill

The _Anarchotribal_ and _Disintegration_ articles use `date: 2026-06-06` and `date: 2026-06-09`, matching their verified public release events. The site was not live then, so deliberate backfill keeps launch chronology honest instead of making old activity look new. Descending News order becomes _Disintegration_, _Anarchotribal_, then _Caregivers_.

### Prefer primary release evidence and state source boundaries

The official artist Bandcamp pages are the primary fact sources. Verified Tidal album records independently agree with both dates and album identities. Secondary editorial/promoter sources are unnecessary for credits and cannot override the primary pages.

_Disintegration_ carries these shared facts: six-track debut instrumental post-rock/post-metal album; all music written and performed by Afterwise; George Stamatiou on piano/synth, Stavros Apostolou and Ilias Daramouskas on guitar, Markos Kousounadis Knousen on bass, and Giannis Avraam on drums; recorded and mixed by Jim Spanos at BlackBox Studio; mastered by Nikos Dimitrakakos and Jim Spanos at Unreal Studio; artwork by Joshua Takak; released by BlackBox Records. Bandcamp confirms Digital; Black Vinyl LP and CD remain label-owned formats.

_Anarchotribal_ carries these shared facts: ten-track psychedelic/punk-influenced rock album; music by Ouranopithecus and lyrics by Zon Pletsis; Mario on drums/backing vocals, Jack on bass, and Zon Pletsis on guitar/vocals; recorded at Atavo and Buduzi Studios; drum engineering and mastering by Kostas Ragiadakos; co-engineering, instrument/vocal recording, and mixing by Marios Adamopoulos; produced by Ouranopithecus and Marios Adamopoulos; Nina Politimou and Marianna Tzaneti on `Bad`; artwork by Voltas and Ouranopithecus; original cover photos by Edward S. Curtis. Bandcamp confirms Digital; Vinyl remains a label-owned format.

### Keep implementation content-only

First enrich each Release frontmatter record. `summary` carries concise release context, `formats` distinguishes confirmed Digital from label-owned physical formats, and `credits` carries the complete structured credit list already rendered by `ReleaseDetailContent.astro`. Do not add track-list or body-rendering code; the existing verified album player exposes tracks on Release details.

Create two Markdown entries under `apps/web/src/content/news/`, referencing the existing release artwork with relative content paths and using base-safe relative Markdown links for internal Release navigation. News bodies may narrate the shared facts, include the verified track sequence, and repeat the most useful performer/production/artwork credits, but they must not contradict the structured Release records. Existing cards, detail pages, overlays, metadata, sitemap generation, and descending sort need no code changes.

Align both matching Artist entries in the same slice: describe _Disintegration_ as released and remove Ouranopithecus' stale `upcoming_release` placeholder. Preserve the exact `bandcamp_embed_url`, `tidal_url`, and Artist profile links installed by `7193409a`.

## Risks / Trade-offs

- [The same facts drift between News and Release content] -> Author from the source matrix above and compare dates, names, roles, formats, and links during review.
- [A physical format is mistaken for provider-confirmed availability] -> Keep Digital marked as provider-confirmed and Vinyl/LP/CD marked as label-owned.
- [The long structured credit lists crowd narrow Release details] -> Reuse the existing responsive credit grid and verify both direct and overlay surfaces at 320 CSS pixels.
- [A cross-collection artwork path is invalid] -> Let `pnpm check` and `pnpm build` fail; fix only the path while continuing to use the existing artwork file.

## Migration Plan

1. Correct and enrich both Release entries while preserving `7193409a` music links, then align matching Artist copy.
2. Add both historical News entries from the same verified fact set.
3. Run unit, content/type/lint/format, and production-build gates.
4. Verify homepage, `/news/`, and both News/Release direct and overlay detail routes with Browser Use.
5. Merge the worktree branch to `main`; rollback is a content-only revert.

## Open Questions

None. Both Actual Release Dates and both official album records are verified.
