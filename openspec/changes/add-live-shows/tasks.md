# Tasks

## 1. Show content contract [Codex]

- [x] 1.1 Add the `shows` collection to the shared content model with the Show schema in design decision 2: title, ISO date, `HH:MM` doors, venue, up to four euro prices, HTTPS ticket and Facebook links, poster with alt text, billing line and lineup. Add complete and draft validation, with field-scoped messages for missing facts, non-HTTPS links, artist-or-name exclusivity, a Release only on an Artist Headliner, and at least one Headliner. Verify with content-model unit tests covering each scenario in `specs/live-shows` and `specs/emdash-editorial-operations`.
- [x] 1.2 Extend snapshot validation and projection: lineup Artist and Release references must be published. Project Artist and Release ids to slugs and the poster to snapshot media. Verify with snapshot parser tests for valid Vol. I data, a missing Artist, a missing Release and media references.
- [x] 1.3 Add `shows` to the CMS seed schema and to `prepareCatalogSchema`. The collection and fields must be created when absent, type-checked when present, and the run must change no content. Wire the collection into publication review (required unpublished references, trash for never-published Shows) and preview selection. Verify with backend worker tests for first and repeat preparation, a wrong field type, review asking for an unpublished Sidus, and trashing a draft Show.
- [x] 1.4 Add the `shows` collection to `apps/web/src/content.config.ts`, and add a pure upcoming-show selector that uses the Europe/Athens calendar, with title tie-break. Verify with unit tests at fixed clocks on 4, 5 and 6 December 2026 (Athens and UTC edges), several Shows, and no Shows.
- [x] 1.5 Add a local Vol. I Show fixture (the poster from the owner's asset folder, the approved lineup and links) to the retained source content, so Local renders the placements. Verify that `pnpm test` passes for the content-model, backend and web modules touched, and record the agreed data shape in design.md.

## 2. Staff Show editor [Claude]

- [ ] 2.1 Mock the Shows list and Show editor (desktop 1440px and phone 390px) in the Staff style, and get owner approval through the visual-review guard before building. Verify by the approved capture recorded in validation.md.
- [ ] 2.2 Build the Shows section under Website: date-ordered list, editor fields, the `LineupFields` component (Artist picker or plain name, role, Release choice filtered to the Artist, Move up and Move down) and Home as the preview destination. Verify with `ContentFields` and `LineupFields` unit tests (adding Hylas as an opening act, filtering LOTUS for Sidus, reordering, validation messages) and the staff content-workspace browser fixture.

## 3. Public placements [Claude]

- [x] 3.1 Add `ShowStrip` to the persistent header with `--show-strip-height` included in `--header-height`: one line, the lineup hidden below 40rem, and an accessible name that includes the title, date and ticket seller. Verify with an e2e check at 390px and 1440px (one line, `<main>` heading not covered) and the shell continuity scenario: Home → Releases → overlay with the player active.
- [x] 3.2 Add `HomeShowSection` before News, matching the approved 2b capture: the full poster at its own ratio, facts, Get tickets and the Facebook quiet link, stacking below 48rem. Verify by an e2e check of the link targets and uncropped poster ratio, and by desktop and phone captures compared with the approved design.
- [x] 3.3 Add `ArtistNextShow` to lineup Artist pages and `ReleaseShowLine` to linked Releases listing entries, matching the approved captures. Verify that e2e checks find the Sidus box text, no box on Ouranopithecus, and the LOTUS line with an unchanged Pre-order action and price.
- [x] 3.4 Verify no-show behavior: with no upcoming Show (fixture clock after 5 December), no placement renders and header height equals the baseline. Verify with an e2e check or unit-level render test.

## 4. Integration and evidence

- [ ] 4.1 Run `pnpm validate`, `pnpm openspec -- validate add-live-shows --strict` and `graphify update .`. Capture the four placements on Local at 390px and 1440px, and record source-bound evidence, acceptance rows and unverified hosted behavior in validation.md.

## Workflow follow-up

- Owner authorizes the UAT release, `cms:catalog-schema` in UAT, Vol. I content entry and publication, then UAT acceptance.
- Owner authorizes the PRD promotion and the PRD Vol. I publication before 5 December 2026.
- Archive the change after PRD acceptance.
