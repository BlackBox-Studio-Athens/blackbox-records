# Tasks

## 1. Print component and styles

- [x] 1.1 Add the `.artist-print` and `.artist-print--thumb` styles to `apps/web/src/styles/global.css`: paper border, caption strip, `--print-tilt`, shadow, 220 ms depth transition, and a `prefers-reduced-motion` override. Verify with a Vitest source test that asserts the reduced-motion rule exists.
- [x] 1.2 Create a reusable `ArtistPrint.astro` in `apps/web/src/components/artists/`. Props: artist image, alt, roster number, name, role (`preview` | `thumb` | `detail`), tilt index, and loading/priority. It sizes the slot from source dimensions within the role maxima and passes explicit `width`/`height` to `<Image>`. Verify with a unit test of the slot-size helper for square, landscape, and portrait sources.

## 2. Crate index roster

- [x] 2.1 Build `ArtistRosterIndex.astro`:
  - A server-rendered `<ul>` in A–Z order. Each `<li data-artist-roster-item>` keeps the existing `data-artist-*` attributes and adds `data-artist-sort-name` and `data-artist-latest-release-sort`.
  - Each row holds an `lg+` row link (number, Veneer name, genre and country, release count) and a `<lg` `<details>`/`<summary>` with a thumbnail print that discloses the full print, the release stat, the latest teaser, and a "View artist" link.
  - Verify by rendering the page and asserting both presentations per item.
- [x] 2.2 Add the preview panel to `ArtistRosterIndex.astro`: a sticky panel with the hidden print deck (one `preview` print per artist; only the first eager with high priority), a details block per artist (genre, country, bio clamp, `artist-release-stat`, `artist-latest-teaser`, View artist and Listen actions), and an empty `[data-artist-roster-preview]` mount. Verify the first artist is visible without JavaScript.
- [x] 2.3 At 13 or more artists, render letter markers on each group's first row and an A–Z jump index. Letters without artists are rendered but disabled; enabled letters are anchors that move focus to the group's first row. Verify with a test that uses a 13-profile fixture and a 12-profile fixture.
- [x] 2.4 Replace the grid in `apps/web/src/pages/artists/index.astro` with `ArtistRosterIndex`. Keep `InternalPageHero` (`Roster` / `Artists`) and the six-or-more search outlet gate. Update `apps/web/src/pages/_artist-roster-layout.test.ts` and verify it passes.

## 3. Preview island

- [x] 3.1 Create `ArtistRosterPreview.tsx`, a React island that holds the active artist and a two-item history. It handles hover and focus on rows through delegation, and sets `data-print-depth`, `hidden`, and `aria-hidden` on deck prints and details blocks, capped at three visible prints. Verify with a jsdom test: hover order A → B → C → D leaves D on top, C and B underneath, and A hidden.
- [x] 3.2 Wire the island as a route-owned portal: add an `AppShellRoot` `connectShellPortalTarget` effect for `[data-artist-roster-preview]` on `/artists/`, and a separate `React.lazy` outlet in `ShellPortalOutlets` with an error boundary that keeps the server default. Verify the chunk loads only on `/artists/` with the existing portal-boundary tests.
- [x] 3.3 Extend `readDocumentShellPageSnapshot` to empty the preview mount and reset deck and details state and active-row markers. Verify with a snapshot unit test in `shell-page-snapshot` tests.

## 4. Search, genre filters, and sort

- [x] 4.1 Extend `ArtistsRosterFilters.tsx`:
  - Genre filter buttons with counts and `aria-pressed`, combined with search text.
  - An A–Z / latest-release sort applied through CSS `order`, which hides letter markers when not A–Z.
  - A clear action that resets search and genre.
  - Keep the existing count, clear, and empty-state copy.
  - Verify with cases in `artist-roster-search.test.ts` or a component test.
- [x] 4.2 Check that filtering, sorting, and the preview island work together: a filtered-out active artist falls back to the first visible row. Verify with a jsdom integration test.

## 5. Artist detail and Home roster

- [x] 5.1 Replace the `16/13` frame and `object-contain` lead image in `ArtistDetailContent.astro` with `ArtistPrint` (`detail` role, preserving the existing priority input for direct loads vs overlays), and adjust `.artist-detail-hero__image-frame` styles. Verify an overlay and a direct load render the print without fill bars.
- [x] 5.2 Replace the `featured-roster` card in `apps/web/src/pages/index.astro` with a print plus the genre and name below it, and no gradient. Remove the unused `ArtistCard` variants, or `ArtistCard` itself if it is now unused, and update `components/artists/project.json` boundary exports and the boundary manifest. Verify `pnpm validate` architecture checks pass.

## 6. Tooling and image checks

- [x] 6.1 Update `scripts/check-image-markup.ts` and its test to find roster images by `data-artist-roster-print`. Verify `check-image-markup.test.ts` passes.
- [x] 6.2 Remove the 3:4 portrait warning for artist sources from the asset check and its test. Verify `check-assets.test.ts` passes and `pnpm assets:check` reports no artist-ratio warning.
- [x] 6.3 Drop the 3:4 artist preview frame and guidance in the staff pickers: artists pass no `cropRatio` in `ContentFields.tsx` and `EditorialPicker.tsx`, the 0.75 special cases leave `MediaLibrary.tsx`, and the guidance names a 1200 px long-edge minimum (1800 px or more ideal). Verify staff tests and `pnpm validate` pass. Evidence: staff content tests passed; `pnpm validate` PASSED (`.codex-artifacts/validation/2026-09-30T07-38-51-106Z-34960/summary.json`).

## 7. Acceptance

- [x] 7.1 Run `pnpm validate` on the final tree and record the command and result in this change. Evidence: `pnpm validate` PASSED on the final tree (2026-09-30, `.codex-artifacts/validation/2026-09-30T01-48-31-243Z-21816/summary.json`; rerun after the acceptance CSS fix PASSED: `.codex-artifacts/validation/2026-09-30T01-58-03-060Z-63552/summary.json`).
- [x] 7.2 In a local dev server, check with Claude in Chrome (blackbox profile) at 1440 px and 390 px:
  - Chronoboros renders as a clean square print with no bars.
  - Hover and focus drop prints on the pile, at most three.
  - Mobile rows disclose prints.
  - Keyboard order and visible focus are correct.
  - Reduced motion removes the motion.

  Record screenshots as evidence.
  Evidence: 2026-09-30, `astro build` + `astro preview` (port 4336) in the built-in browser pane at 1440×900 and 390×844 (Claude in Chrome was used first, but its screenshots only capture part of the high-DPI 2134px window, so the pane was used for framing). Desktop: rows render; hovering Chronoboros then Ouranopithecus left depths `ouranopithecus:0, chronoboros:1, afterwise:2` with only the top print unhidden from assistive tech; the colour print sits on the pile. Fixed during acceptance: deck prints shrank to 212px because an absolute box at `left:50%` only gets the remaining half; `.artist-roster-preview__deck > .artist-print` now uses `inline-size: max-content`. Mobile: thumbnails tilt; opening Chronoboros shows a 1:1 print with no bars (lazy image loads on open); no horizontal overflow (scrollWidth 391 = innerWidth). Keyboard: focusin on a row makes it active; `:focus-visible` outlines exist for rows, summaries, jump links and actions; `prefers-reduced-motion` rules remove print transitions (asserted in the layout test; the pane cannot emulate reduced motion).

- [x] 7.3 Run the shell continuity checks from `docs/agent-workflow.md`: Artists → artist overlay → back, and Artists → Home → Artists keep the persistent player, and the snapshot restores the default preview. Record the result.
      Evidence: 2026-09-30, same preview: Listen in the preview panel started the Afterwise player iframe; opening the Chronoboros overlay from its row showed the detail print, and the same iframe survived; Back closed the overlay with the roster state intact; Artists → Home (three prints, no gradient) → Artists kept the same player iframe and restored the cached roster to the default (first print depth 0, first details visible, others hidden); hover and focus still worked after the restore.
- [x] 7.4 Publish the Afterwise (`Afterwise Wall.jpeg`, sha256 f34b4c…) and Sidus (`0DSC05408lli.jpg`, 4469×4000, sha256 eb216f…) photo swaps through the PRD staff CMS, then confirm with a PRD `/artists/` fetch that both media hashes match and Sidus has no baked-in bars. UAT is skipped by choice; print rendering on PRD follows code promotion. Record the result.
      Evidence 2026-09-30: before the swap PRD served the old Afterwise live photo (sha256 474e30…, 2048×1365) and a padded 1800×2400 Sidus image. Both photos were uploaded through the PRD staff CMS (Claude in Chrome, blackbox profile) with new image descriptions and published together as "Publish 2 changes" (status: On the website). A fetch of PRD `/artists/`, `/artists/afterwise/` and `/artists/sidus/` then served media ending in `f34b4c43…064b` (Afterwise) and `eb216f41…ca3d` (Sidus): byte-identical to the source files, so Sidus has no baked-in bars. PRD still runs the old card code until promotion.
