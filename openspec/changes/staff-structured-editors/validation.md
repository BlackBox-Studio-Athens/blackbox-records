# Validation

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
