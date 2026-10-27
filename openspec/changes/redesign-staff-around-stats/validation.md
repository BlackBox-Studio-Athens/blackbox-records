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
