# Validation

## Slice 1: stats-led Overview, 27 October 2026

Local only. Evidence files are ignored under `.codex-artifacts/staff-redesign/` (`before/`, `previews/`, `after/`).

### Checks run

- `pnpm exec astro check` (staff): 0 errors.
- `pnpm test` per file: `stats-overview.test.ts` (staff-stats), `order-todos.test.ts` (staff-orders), `unpublished-changes.test.ts` and `staff-navigation.test.ts` (staff-platform; Nx also re-ran the six dependent staff modules). All passed.
- `pnpm build:staff`: route isolation and staff bundle budgets passed. Overview eager JavaScript is 128,791 Brotli bytes against 129,024. The first build measured 129,106 and failed; replacing three Lucide arrow icons with the text arrows Stats already uses brought it under. **Headroom is 233 bytes**; the next Overview addition needs a lazy import or a saving.
- `pnpm openspec -- validate redesign-staff-around-stats --strict`: valid.
- ESLint on the changed staff files: no issues.
- `pnpm validate` on the final tree: passed, 24 of 24 affected tasks (repository gates only). Summary: `.codex-artifacts/validation/2026-10-27T09-57-35-681Z-15636-579b66/summary.json`.
- `graphify update .` refreshed after the code batch.

### Browser (Playwright CLI, headless Chromium, Local stack on 8787)

- Real Local data: Visits and Google show "Not connected"; Paid orders 0 and €0 show "Same as before"; To do shows 7 paid orders to ship (oldest paid 179 days ago), Orders need review, and 11 saved changes. The previous Overview showed none of these counts. `after/d-overview.png`.
- Test-browser fixture (sample figures, not production): lead sentence and four signed changes render as specified at 1440 and 390 px. `after/d-overview-sample.png`, `after/m-overview-sample.png`.
- Store read returning 503: only Paid orders and Paid total read "Not available", with one Store alert and Retry; Visits and Google stay usable. Retry restores the figures and clears the alert. `after/d-overview-store-failed.png`.
- 30 days writes `/?range=30d`; Back restores 7 days. Before the allowlist fix the URL did not change and Back left Overview.
- "Paid orders to ship" opens `/orders/?status=paid&dispatch=not_shipped` with Not shipped ticked and 7 orders shown, matching the count. Back returns to Overview.
- Keyboard: focus reaches the period buttons with a 2 px solid outline. `after/d-overview-focus.png`.
- No horizontal overflow and no clipped controls at 195 (200% zoom of a 390 px phone), 320, 390 and 1440 px. At 195 px the period buttons first clipped; they now wrap. `after/m-overview-zoom200.png`.
- All links and buttons in the page body are at least 44 px tall at 390 px.
- No console errors or warnings.

### Not established

- 768 and 1280 px, Firefox, Safari and physical phones.
- Screen-reader output beyond the markup (counts use visually hidden text; change direction is in the text).
- Hosted Visits and Search data, and request cost on UAT or PRD.
- At 195 px the shell header drops its Menu button. This predates the change and is recorded under task 2.1.

## Slice 2: shared page header, 27 October 2026

### Checks run

- `pnpm exec astro check` (staff): 0 errors.
- `pnpm test` for `StaffBack.test.tsx` (new; Nx re-ran all seven staff modules), `StaffShell.test.tsx`, `stats-workspace.test.tsx` and `order-workspace.test.tsx`: all passed.
- Staff build in the stack restart: bundle budgets passed; Overview eager JavaScript 128,821 Brotli bytes (budget 129,024).
- `scripts/test-content-workspace.mjs` now asserts no Overview-only return on top-level areas. The script itself was not run.
- `pnpm validate` on the final tree: passed, 24 of 24 affected tasks (repository gates only). Summary: `.codex-artifacts/validation/2026-10-27T10-38-57-927Z-23252-a94944/summary.json`.

### Browser (Playwright CLI, headless Chromium)

- Every area title (Overview, Releases, Pages, Images, Stock, Orders, Stats, Publication calendar, Review website changes) measures 28 px at 1440 px and 24 px at 390 px. Before: 16, 24, 28 and 44 px.
- At 390 px every title starts at x = 16. At 1440 px left edges still differ (24 to 360 px) because Overview, Stats, Orders and Images centre their columns and Catalog and Website have a sidebar; see the open decision in tasks.md.
- No `[data-staff-back]` link on any of those nine pages at either width.
- Header area name visible and untruncated at 360, 390, 640 and 1024 px. At 320 px it first truncated to 44 px; the below-360 px rule fits it at 68 px (checked by injecting the rule, then in the rebuilt stack). Menu and Review stay 44 px.
- Evidence: `.codex-artifacts/staff-redesign/slice2/`.

## Slice 3: Orders triage, 27 October 2026

### Checks run

- `pnpm exec astro check` (staff): 0 errors.
- `pnpm test` for `order-workspace.test.tsx` (new default, All view, custom view and filter-count cases) and `staff-navigation.test.ts` (`view=all` allowed on Orders only; Nx re-ran all seven staff modules): all passed.
- Staff build in the stack restart: bundle budgets passed; Orders eager JavaScript 133,006 Brotli bytes (budget 137,216).
- ESLint on the changed files: no problems.
- `pnpm validate` on the final tree: passed, 24 of 24 affected tasks (repository gates only). Summary: `.codex-artifacts/validation/2026-10-27T10-58-59-718Z-31648-b05907/summary.json`.

### Browser (Playwright CLI, headless Chromium, Local data)

- `/orders/` opens To ship: URL `?status=paid&dispatch=not_shipped`, 7 orders, first row "Local Mock Recipient / €26.50".
- All orders writes `?view=all`, shows 25 orders, and survives reload. Unpaid rows read "No customer yet / Ref f5ddb7f2" instead of a full UUID.
- Previous/Next render after the list.
- 390 px: filters collapsed behind "Filters (2)" (`aria-expanded` false, then true); the first order starts at y = 302 (before: about 720). No control under 44 px; no horizontal overflow at 390 or 320 px; no console messages.
- Filter changes replace the history entry, as before this slice, so Back leaves Orders rather than stepping through filters.
- Evidence: `.codex-artifacts/staff-redesign/slice3/`.

## Slice 4: Stats detail, 27 October 2026

### Checks run

- `pnpm exec astro check` (staff): 0 errors.
- `pnpm test` for `stats-workspace.test.tsx` (new cases: comparison default and `compare=false`, axis labels for a week and longer periods, zero versus missing, the zero sentence, hatched days with the scale label, sentence without filler) and `staff-navigation.test.ts` (Nx re-ran all seven staff modules): all passed. `stats-overview.test.ts` updated: Overview links no longer need `compare=true`.
- `pnpm build:staff`: budgets passed. The first stack build failed with Overview at 129,155 Brotli bytes (budget 129,024) because the new helpers sat in the shared `stats-model.ts`; moving them to `stats-brief.ts`, imported only by Stats, brought Overview to 128,864. Stats is 127,921 of 131,072. The final build with the sentence colour change also passed.
- ESLint on the changed files: no problems.
- `pnpm validate` on the final tree: passed, 24 of 24 affected tasks (repository gates only). Summary: `.codex-artifacts/validation/2026-10-27T11-49-11-778Z-18836-d35f80/summary.json`.

### Browser (Playwright CLI, headless Chromium, 390 px)

- Real Local data: opening sentence "No paid orders." with no filler; comparison checked by default; Store says "No paid orders in these dates." instead of seven baseline strokes; Visits and Search keep their not-connected text.
- Test-browser fixture (labelled sample week, one unreported day): "119 visits and no paid orders."; "Highest 32" above a dashed top rule; axis Wed to Tue; one hatched bar with "Hatched days have no figures yet."; "↑ 6.3% vs 112 previously". `m-stats-fixture.png`.
- Turning comparison off writes `?compare=false` and removes the comparison.
- No horizontal overflow at 390 or 320 px; no console messages.
- The sentence colour change to full contrast was checked by injecting the same rule; it was not rebuilt into the running stack.
- Evidence: `.codex-artifacts/staff-redesign/slice4/`.

## Slice 5: Review, Stock and Catalog fixes, 27 October 2026

### Checks run

- `pnpm test` for the new `inventory-row.test.ts` (shop name shortening, low-stock range): passed; the staff-stock module ran 5 files, 37 tests, all passed.
- ESLint on the changed files: no problems.
- The Local stack rebuilt staff with bundle budgets passing.
- `pnpm validate` on the final tree: the first run failed the staff typecheck because the test passed `displayName: undefined` under `exactOptionalPropertyTypes`; after widening the helper's type it passed. Summary: `.codex-artifacts/validation/2026-10-27T12-22-34-128Z-39448-1baa77/summary.json`.

### Browser (Playwright CLI, headless Chromium)

- Review, 1440 px: before, the sticky selection bar ended at y = 876 of 900 because sticky `bottom: 0` stops at the scroll container's 24 px padding, and rows scrolled through that gap. After, the bar ends at 900 at 1440 px and at 844 at 390 px. "Finish editing" and "Discard saved changes" now have a 12 px gap. Checkboxes already centred on their titles; no change.
- Stock, 1440 px: "BlackBox Records - Disintegration - Black Vinyl LP" now reads "Disintegration" above "Black Vinyl LP". The border and inset were already fixed in slice 2. No Local item has 1 to 5 copies online, so a test-browser stub (`stub-low.js`) set 3 and 5: both rows show "Low stock" in amber text with a border, not colour alone. At first the tag was white because `--warning` exists only inside `.cms-surface`; a fallback to the staff amber fixed it (checked by injection; the rule is in the source but not rebuilt into the running stack). No horizontal overflow at 390 px.
- Catalog, 1440 px: search, area, format, sort, Add distro and Add merch sit on one row at y = 136 (before: three rows). At 390 px they wrap, with every control 44 px high and no horizontal overflow.
- Console: no messages on Review and Stock. Opening a Catalog item logs the existing `/_emdash/api/auth/me` 404s, already recorded in earlier changes.
- Evidence: `.codex-artifacts/staff-redesign/slice5/`.
