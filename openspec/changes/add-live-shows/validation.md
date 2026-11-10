# Validation

## Show content contract: earlier partial Local evidence

- `pnpm openspec:guard`: passed before implementation.
- `pnpm openspec -- validate add-live-shows --strict`: passed after the task checkbox update.
- `pnpm test cms-runtime`, `pnpm test web-content-files`, and `pnpm test storefront-catalog`: passed during implementation. Concurrent edits and subsequent formatting mean these are not final source-bound acceptance evidence.
- `pnpm test:content`: passed, 108 tests.
- `pnpm test @blackbox/content-model`: unavailable; that Nx project has no `test` target. Shared-model behavior is covered by the web content-files tests and the content-contract suite.
- A broader affected test run found an unsupported `420` image width in the concurrently edited `HomeShowSection.astro`. UI work belongs to Claude.
- The retained source has Afterwise (`mass-culture.md`, slug `afterwise`) and Disintegration. It has no Sidus Artist or LOTUS Release. The Show fixture references their intended slugs; fresh Local bootstrap skips the unresolved Show with a warning. Local placement acceptance remains unverified.
- A Local bootstrap preparation dry run passed with `skipUnresolvedShows` and reported the missing-lineup warning. Its ignored plan is at `.codex-artifacts/emdash-migration/show-check/plan.json`; no CMS content was written.
- `graphify update .`: completed. SQL extraction was unavailable because `tree_sitter_sql` is not installed; one unrelated test file was partially extracted after a syntax error.
- `pnpm validate` has not run: it formats all dirty files, including concurrent UI work outside this task. No final source fingerprint, final-tree validation summary, browser, provider, or release acceptance is claimed.

## Show content contract: fixture and worker-test follow-up

- Added retained `artists/sidus.md` and `releases/lotus.md`. They use existing placeholder images: `news/dark-concert-venue-.jpg` and `releases/anarchotribal-cover.webp`. `2026-10-01` is a fixture date for the specified October 2026 release month, not a verified release day.
- The Local import preparation completed without a missing-reference warning and included the Show plus both linked Artists and Releases. The ignored plan is `.codex-artifacts/emdash-migration/show-complete-check/plan.json`; it did not write CMS content. Existing populated Local CMS data was not changed.
- `pnpm test:content`: passed, 108 tests, including retained lineup identities and Release ownership.
- `pnpm test web-content-files`: passed with the two-Headliner Show, missing references, mismatched ownership, media projection, draft and completeness cases.
- `pnpm test cms-runtime`: passed. A subsequent focused worker run passed the added assertion that repeated preparation also leaves collection metadata unchanged. The worker coverage includes actual D1 schema creation, type mismatch, unchanged content and trash state, as well as publication review and Home preview.
- `pnpm test storefront-catalog`: passed. `@blackbox/content-model` has no independent Nx test target; its behavior is exercised by the content and web content-files suites.
- `pnpm validate` was not run as instructed. Browser placement, final-tree validation and hosted acceptance remain for integration; these checks do not establish them.

## Public placements and Staff editor (Claude)

Approved design: direction C with Home option 2b (owner, 10 November 2026). The captures below are of the implemented components, not injected mockups.

- **Placements.** `ShowStrip` sits in the persistent header's banner slot. `HomeShowSection` is placed before News, `ArtistNextShow` after the artist profile, and `ReleaseShowLine` after the release description on the Releases listing. One presentation helper, `apps/web/src/lib/live-show.ts`, resolves them all through Codex's `selectUpcomingShow`.
- **Header height.** The existing banner ResizeObserver measures the header. `:root:has([data-show-strip])` reserves 116px before that script runs. Without a strip, header height and `<main>` offset keep today's values, because no rule applies.
- **Image widths.** The poster uses existing ladder rungs: 480, 720 and 1080. The unsupported 420 width that Codex reported is gone.
- **Staff.** Shows appears under Website with "Add show", soonest-first ordering, trash for never-published drafts and draft discard. The Show form has a date picker, a 24-hour `HH:MM` text input for doors, prices as up to four amounts, URL fields, a whole-poster image picker with description, and `LineupFields`. A native time input was replaced because it rendered 12-hour ("08:00 μμ") in the Greek browser locale.
- **Bundle budget.** The Staff overview bundle is budgeted. The Shows nav link reuses the existing FileText icon, because a new icon put the bundle 144 bytes over budget.
- **Record picker.** `EditorialPicker` gained an optional `filter`. It filters each loaded page client-side, which is enough for one label's releases.

### Checks run

- `pnpm test apps/web/src/lib/live-show.test.ts` passed. It covers the date labels ("Sat 05 Dec"), prices, Ticket seller, the resolved lineup with the Hylas plain name, the Athens show night, and absence at 00:30 Athens on 6 December (task 3.4).
- `pnpm test staff-content` passed. It covers the `LineupFields` scenarios: adding Hylas as an opening act, filtering Releases to Sidus, clearing a Release on role or Artist change, reordering with disabled ends, and validation messages. It also covers the Show form test: structured fields, missing facts, and price parsing.
- `pnpm test:e2e e2e/live-shows.spec.ts` passed 5 of 5 tests across chromium-desktop and chromium-mobile:
  - The strip is one line, 36px high, with the ticket link and a new tab. Its accessible name has the title, date and seller. The lineup is hidden on phones, and the `<main>` heading is not covered.
  - The strip stays connected through Home → Releases → a release overlay while the player iframe stays connected.
  - The Home poster ratio is within 0.02 of its natural ratio. The poster sits beside the facts on desktop and above them on phones. The ticket and Facebook links are correct, Sidus is linked, and Hylas is text only.
  - The Sidus box text matches the spec scenario, and Ouranopithecus has no box.
  - The LOTUS line follows its description.
- **Captures.** Taken on Local at 1440px and 390px at 2x:
  - public: `%LOCALAPPDATA%/AI-work/previews/live-shows/built/` (8 files)
  - Staff editor on the full Local stack, as private Local drafts: `.../live-shows/staff/` (6 files)

### Not verified

- LOTUS's Pre-order action and price beside the line are not checked. The local LOTUS fixture has no Store Item. Check on UAT.
- The Staff editor's validation-error states and the poster picker have not been viewed in a browser. The UAT/PRD CMS publication path and hosted rendering are also unverified.
- Local fixtures use placeholder Sidus and LOTUS images.
- Staff design approval (task 2.1) is pending owner review of the editor captures.

## Local LOTUS fixture and migration catalog

- The repository migration loader previously treated every release Markdown file as a Store Item. The Local LOTUS placeholder therefore entered Desired Catalog State with a default price and PRD target. It is now explicitly excluded from that loader while its retained release and Show link remain available to the site. Remove the exclusion only when approved catalog data replaces the placeholder.
- `pnpm test backend-tooling` and `pnpm test web-content-files` passed. The catalog tests assert that LOTUS is absent from Local mock commerce and from UAT and PRD migration contracts.
- `pnpm test:e2e e2e/live-shows.spec.ts -g 'LOTUS on Releases'` passed on Local Chromium desktop: the LOTUS listing retained its release-show line after its summary.
- `pnpm validate` was not run, as instructed; final-tree validation remains with Claude.
- Show review test mock typing corrected; `pnpm exec nx run @blackbox/backend:typecheck` and `pnpm test cms-runtime` passed.
