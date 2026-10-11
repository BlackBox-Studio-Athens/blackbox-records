# Validation

## Source and environment

Prepared on `main` in `C:/Users/SVall/WebstormProjects/blackbox-records`, based on `9d1f3bc4e18e01e4609f54c1b6ff232594b8e766`, with uncommitted implementation changes. Existing unrelated changes were preserved. Local stack only; no UAT/PRD release or hosted content mutation.

Selected acceptance rows: staff/editor and CMS/schema/publication, plus public roster presentation. Routing/player lifecycle, commerce authority and module boundaries were unchanged. No provider smoke or full hosted editor/e2e suite was run.

## Checks

- `pnpm test scripts/cms-content-schema.test.mjs`: passed, including absent/null/0/1 values, invalid supplied types, immutable accepted content and inactive publication round trip.
- `pnpm test apps/backend/src/cms/catalog-schema.test.ts`: passed, including optional boolean creation, repeated preparation and incompatible field rejection.
- `pnpm test storefront-catalog`: passed, including mixed, all-active, all-inactive, legacy and empty rosters, Home selection, unchanged source and alphabetical non-roster query.
- `pnpm test apps/staff/src/components/content/ContentFields.test.tsx`: passed; default-active, false/zero, stable switch label and disabled behavior. The focused test was rerun successfully after including the component's required validation inputs; its markup extraction also follows the repository's `RegExp.exec()` lint rule.
- `pnpm openspec -- validate add-artist-activity-ordering --type change --strict` and `pnpm agent:check`: passed.
- `graphify update .`: completed AST-only refresh. An existing syntax warning in `scripts/pages-workflow-contract.test.ts` remains unrelated to this change.
- Initial `pnpm validate` runs caught indexed access assertions in the roster test, omitted required props and a regexp lint rule in the switch test; all were corrected. One subsequent selection passed all tasks but was invalidated by source edits during the run. The stable rerun passed: `.codex-artifacts/validation/2026-10-01T22-20-13-699Z-28812/summary.json`, `mode: local`, `status: passed`, 63 tasks across 49 affected projects. Before/after SHA matched the source above, and before/after fingerprints both matched `b8ef4dd61ad8e663525a10ca422e464e818cf7e08b9a7d5999d0c7e911c3e7ab`, with no source changes. The post-documentation final summary pointer and fingerprints are retained in `.codex-artifacts/artist-activity/final-validate.json` to avoid another tracked evidence edit invalidating its identity.

## Local browser acceptance

Chrome blackbox profile; public Home and Artists checked at 1440 px and 390 px viewport settings. The mobile page measured 391 CSS px including browser rounding, without horizontal overflow.

Chronoboros opened as Active from a native null value without creating a revision. Space toggled the focused switch to Inactive, preserving a visible focus ring and a 48 px label target. Existing autosave retained `false`; reopening the editor retained Inactive. Before publication the public roster remained Afterwise, Chronoboros, Ouranopithecus, Sidus, while the private listing preview showed Afterwise, Ouranopithecus, Sidus, Chronoboros.

The existing Local **Publish changes** flow completed with “Your changes are on the website”. The editor retained Inactive and returned to “Everything is live”. Public Artists then showed Afterwise, Ouranopithecus, Sidus, Chronoboros, and Home showed the first three, at both tested sizes. Chronoboros detail and Caregivers release navigation remained available. A transient detail-preview timeout recovered when switching to Listing; the final listing preview was up to date.

Local publication: `2d368a9d-0b1a-4f88-91e9-f3068af8fdc6`, status `live`. The public `/content-version.json` confirmed the same ID and accepted snapshot SHA-256 `ae5049a06c4797198d2b7d73135acb0550fa7a0147b728f4346067b087a9eb7b`.

Screenshots: `.codex-artifacts/artist-activity/staff-switch.jpg` and `.codex-artifacts/artist-activity/artists-mobile.jpg`. Temporary viewport overrides were reset. Visual inspection found the switch consistent with existing form styling and the public mobile cards readable without clipping.

## Remaining hosted gates

Software Release and Content Publication remain separate. Prepare the optional native field through the existing environment setup/release workflow, then set Chronoboros inactive and confirm Sidus active through staff publication in the authorized hosted environment. Local acceptance does not establish UAT/PRD acceptance. The change remains unarchived for the normal release workflow.
