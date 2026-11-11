# Validation

## 2026-11-11 — Distro inventory readers

- The inventory matcher and repository catalog fixtures now use canonical Distro `format`. Catalog display labels use the existing `format_override` projection. The Local backfill reader accepts both typed and legacy stored values; its regression checks both shapes. The compiled CMS pagination smoke uses typed Distro values.
- `pnpm test backend-tooling` and `pnpm test catalog-sync` passed after the reader change. These are Local checks; see the 1.4.0 upgrade validation for final-tree evidence and remaining browser limits.
- The mixed legacy/typed pagination fixture now narrows its union before comparing the stored type, fixing the backend typecheck without changing either fixture shape.
- Catalog-data test fixtures include the projected empty Artist country and Distro tracklist fields required by the typed content schemas.
- Web typecheck and `pnpm test storefront-catalog` passed. The third Local `pnpm validate` passed 68 tasks before this documentation update; the source-bound report is recorded in `upgrade-emdash-1-4-0/validation.md`.

## 2026-11-11 — typed editorial values and draft migration (tasks 2.1, 3.1, 4.1, 6.1)

- Local source: base `f89cf47e06c94f16f31faddc7596d0aa30e930a7`; SHA-256 `dc9c9b0b6a18b7464c93727666d36245ec60ee2488aeae3e84b5d30baf173c10` over the sorted path, NUL, file bytes and NUL of each of 143 changed non-Staff files. The file list and exclusions are recorded in `.codex-artifacts/validation/staff-structured-editors-source.json`; task and validation notes are excluded. Concurrent Staff edits are outside this evidence.
- Passed `pnpm openspec:guard`, `pnpm test:content` (108 tests), `pnpm test web-content-files`, `pnpm test storefront-catalog`, `pnpm test apps/web/src/lib/tracklist.test.ts`, `pnpm test catalog-sync`, `pnpm test web-editorial`, `pnpm test web-platform`, `pnpm test cms-runtime`, `pnpm agent:check`, and `pnpm openspec -- validate staff-structured-editors --strict`. The CMS Worker tests cover first and repeat migration, an unknown country, unchanged original revisions and mixed-format Staff pagination. Focused ESLint also passed for the pagination files and tracklist module.
- Local fixtures and the generated CMS seed use the typed shapes. Legacy public country labels, Distro labels and groups, social visibility and track durations are projected through transition readers. The migration command defaults to inspection, stages drafts only with `--apply`, and does not migrate Show prices. No Local, UAT or PRD migration or publication was performed.
- `graphify update .` completed locally; SQL extraction support was unavailable and one unrelated script was partially parsed. Browser, provider, hosted release and Staff UI acceptance remain outside this evidence. Whole-project validation was not run under the local feedback policy.

## 2026-11-10 — value types and Show prices (tasks 1.1–1.2)

- Passed `pnpm test:content` (108 tests), `pnpm test web-content-files`, `pnpm test apps/web/src/lib/live-show.test.ts`, `pnpm test apps/web/src/lib/values.test.ts`, `pnpm test storefront-catalog`, and `pnpm test cms-runtime`.
- Passed `pnpm openspec -- validate staff-structured-editors --strict`. CMS seed JSON schema inspection confirmed Show doors remain a string and prices an array of positive integers.
- A supplementary `pnpm exec nx run @blackbox/backend:typecheck` stopped before typechecking: the workspace format prerequisite reported concurrently edited Staff files. Those files were left for their owner. Whole-project validation was not run.
- Show prices are cents only; the unreleased Show data has no dual read or migration.

## 2026-11-10 — field kit, card shell and Show cards (tasks 1.3–1.5)

- New closed module `staff-fields` (`apps/staff/src/components/fields/`) with its own test target; `staff-orders`, `staff-shell`, `staff-stock` and `staff-content` may use it (module-boundaries delta in this change). The three copied switch tracks now use `SwitchTrack`.
- Passed `pnpm test staff-fields`, `pnpm test staff-content` (including `EditorCards`, `show-cards`, `LineupFields` and the Show editor test) and `pnpm test staff-stock`.
- Passed `pnpm validate` on the final tree (summary `.codex-artifacts/validation/2026-11-10T20-26-27-143Z-34168-af3680/summary.json`). The first run failed on a stale Nx project map that still placed `components/fields` in `staff-frontend`; `nx reset` cleared it, with no source change.
- Browser: the full Local stack, Chromium, `el-GR` locale, 1440×900 and 390×844. A new Show was filled entirely through the cards. Summaries read "Sat 05 Dec 2026 · doors 20:00" and "€10 / €12 / €15 · More.com"; a pasted "more com/sidus" turns Tickets into the problem state with its message and stores nothing. No horizontal scroll; every visible card header, button and input is at least 44 px. Captures: `%LOCALAPPDATA%/AI-work/previews/staff-cards/`.
- Owner approved the Show editor result on 2026-11-10 (task 1.5). Earlier local test drafts store euro prices and read €0.10; re-enter their prices.

## 2026-11-10 — design reference (task 1.6)

- `docs/backoffice-design.md` records direction B, the card states and keys, and the field kit.
- Passed `pnpm agent:check` (11 documents) and `pnpm openspec -- validate staff-structured-editors --strict`.

## 2026-11-11 — every Staff editor on cards, typed storage in Staff (tasks 2.2–5.1)

- Release, Distro, Artist (with the new-artist flow), News, Home, About, Services, Distro page, Purchase information, Newsletter, Navigation, Socials and Label details use `EditorCards`. Item setup, price editor, pre-order control, stock operations and order detail use the field kit; order dispatch has the BOX NOW locker map (`StaffLockerMap`) with manual fallback.
- Staff reads stored values through `readTypedValues` plus `readEditorialBooleans` when a record opens (`components/content/typed-values.ts`, loaded on demand), and writes Distro `format`/`format_override`, track `duration` seconds and Artist `CountryCode[]`.
- The overview first-load budget is now 127 KiB (owner-approved 2026-11-11): the new editors split a shared chunk, 129,029 Brotli bytes against 128,840 without them, raw size unchanged.
- Passed `pnpm test staff-content` (61), `staff-publication` (27), `@blackbox/staff:typecheck` and lint, `pnpm openspec -- validate staff-structured-editors --strict`, `node --import tsx scripts/test-content-workspace.mjs --selling` (selectors updated for segmented choices). `--mobile-preorders` passed its pre-order steps, then stopped at the order-search fit check, stale since Orders moved search into the filter sheet (2026-10-27).
- Final `pnpm validate` passed on the tree after the EmDash 1.4.0 upgrade (Codex record in `upgrade-emdash-1-4-0`).
- Browser: full Local stack on EmDash 1.4.0, Chromium, 1440×900 and 390×844; first record of all 11 collections, closed cards and key open cards; no horizontal scroll and no card control under 44 px; rich-text slash menu offers basic blocks only. Captures: `%LOCALAPPDATA%/AI-work/previews/staff-cards-2/`. Owner approved the result on 2026-11-11.
- Task 5.2: stock and order detail captured; `pnpm test staff-orders` and `staff-stock` pass. The owner waived the BOX NOW locker step capture on 2026-11-11 (it needs a paid locker order on Local).
- Side effect: the rich-text probe autosaved a private Local draft on Anarchotribal. Its content was restored to the live value (`body` null); the empty draft revision remains because drafts of items on sale cannot be discarded.

## 2026-11-11 — browser acceptance and final checks (task 6.2)

- Chromium 153 and Firefox 155 via Playwright on the full Local stack (EmDash 1.4.0), viewports 390, 768, 1280 and 1600 px wide: the first record of all 11 card collections opens on cards, its first card toggles, there is no horizontal scroll, and no card header, button or input is under 44 px. Captures: `%LOCALAPPDATA%/AI-work/previews/staff-acceptance/`.
- One Firefox 768 px run reported a failed dynamic import of a served `messages` chunk (HTTP 200 when fetched); two reruns at 768 px passed, so it is recorded as a navigation race, not a defect.
- Firefox rotates the open-card chevron like Chromium once the transition settles.
- Passed `pnpm validate` on the final tree (summary `.codex-artifacts/validation/2026-11-11T11-52-45-540Z-12196-42821d/summary.json`), `pnpm openspec -- validate staff-structured-editors --strict` and `graphify update .`.
- `node --import tsx scripts/test-content-workspace.mjs --selling --mobile-preorders` now passes end to end. Three steps were out of date and are fixed: the phone order search sits behind the Filters toggle (since 2026-10-27), the Artist name field is inside the Basics card, and Menu stays visible from 1440 to 1919 px (since 2026-10-13), so the no-Menu desktop check runs at 1920 px.
