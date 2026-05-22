---
phase: 15
plan: 15-01
subsystem: web-assets
tags: [frontend, tooling, assets, sharp, validation]
key-files:
  - apps/web/package.json
  - apps/web/scripts/check-assets.ts
  - apps/web/test/assets/check-assets.test.ts
  - package.json
  - .planning/phases/15-adopt-sharp-asset-qa/15-VALIDATION.md
metrics:
  tests_added: 7
  assets_inspected: 46
status: completed
completed: 2026-05-23
---

# 15-01 Summary - Add Sharp-backed Asset QA

## Completed

- Added a read-only Sharp-backed asset QA command under `apps/web/scripts/check-assets.ts`.
- Wired `pnpm --filter @blackbox/web assets:check` and the root `pnpm assets:check` wrapper.
- Covered public static assets, favicon PNG/SVG/ICO metadata, and content-referenced local `image` / `cover_image`
  fields.
- Added focused Vitest coverage for passing metadata, favicon dimension errors, artist portrait ratio diagnostics,
  unreadable files, generated image inspection, and stable diagnostic formatting.
- Recorded current asset findings in `15-VALIDATION.md`.

## Task Commits

| Commit             | Description                                                                |
| ------------------ | -------------------------------------------------------------------------- |
| Local working tree | Add Sharp-backed asset QA command, tests, and Phase 15 validation evidence |

## Deviations from Plan

- Artist portrait ratio checks are advisory warnings in this first read-only slice. The current catalog has three existing
  artist sources that do not meet the documented 3:4 portrait-source guidance, and replacing them requires human
  content/design review.
- `favicon.ico` is validated with a read-only ICO header parser because Sharp reports ICO input as unsupported on the
  current local toolchain.
- Browser Use validation was not run because this phase changed local tooling only, not rendered UI.

## Verification Commands

- `pnpm --filter @blackbox/web exec vitest run test/assets/check-assets.test.ts` passed with 1 file and 7 tests.
- `pnpm assets:check` passed after inspecting 46 image references and static assets, with 3 advisory artist portrait
  warnings and no skipped image classes.
- `pnpm --filter @blackbox/web check` passed with no errors; only existing Zod deprecation hints were reported.
- `pnpm test:unit` passed for `@blackbox/web` (81 files, 359 tests), `@blackbox/backend` (33 files, 192 tests), and
  `@blackbox/api-client` (1 file, 2 tests).
- `pnpm check` passed, including format, lint, TypeScript/Astro checks, module boundary audit, dependency-cruiser boundary
  audit, and commerce boundary audit.
- `pnpm build` passed and built 116 static pages.

## Self-Check: PASSED

- Sharp remains tooling-only; Astro content collection image handling stays the runtime path.
- The command is read-only and does not mutate image files, content entries, public paths, or route-visible URLs.
- Favicon metadata and artist portrait standards are covered where local files resolve.
- The command emits stable rule ids and actionable diagnostics.
- Targeted tests, the asset check, package type checking, and full repository gates passed after implementation.
