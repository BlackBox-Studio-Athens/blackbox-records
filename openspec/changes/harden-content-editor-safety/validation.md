# Validation

## Local verification — 2026-09-16

- `pnpm test:unit` passed: 110 web test files / 575 tests, 10 staff files / 46 tests, 70 backend files / 530 tests, 47 backend Node files / 289 tests, and contract tests.
- `pnpm check` passed with no errors.
- `pnpm build` passed public and staff builds, static cache/font/image checks, and staff route isolation.
- `pnpm --filter @blackbox/staff build` passed.
- `node scripts/test-preview-policy.mjs` passed in Chromium and Firefox; approved CSS/images/fonts loaded while scripts/forms and unauthorized assets remained blocked.
- `node scripts/test-content-workspace.mjs` passed in Chromium.
- `node scripts/test-content-workspace.mjs --firefox` passed in Firefox.
- `pnpm --filter @blackbox/backend build:cms --env uat` passed with the no-KV guard and generated the CMS Worker artifact.
- `pnpm openspec -- validate harden-content-editor-safety --type change --strict` passed.

## UAT release verification

To be recorded after the reviewed main push completes: release run URL, commit SHA, UAT Worker/CMS artifact verification, and Chromium/Firefox hosted preview confirmation.
