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

- Commit `7fe7080b6626d6962a757a4c5afb3a902e1d2c3d` was pushed to `main` and deployed by release run [35082777390](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/35082777390).
- `build-candidate`, `inspect-uat-pages`, `deploy-uat`, and `deploy-uat-static` passed. The UAT Worker and static Pages deployment both recorded the current release revisions; the Pages deployment is `35856dce.blackbox-records-web-uat.pages.dev`.
- The hosted staff preview policy check passed in Chromium and Firefox. The immutable UAT Pages deployment returns `404` for every retired `/admin/*` path.
- The release smoke job remains failed because the canonical `blackbox-records-web-uat.pages.dev` alias serves five retired `/admin/*` responses from a `cf-cache-status: HIT` object with an age of approximately 33 hours. A cache-busting query and the immutable deployment hostname return the expected `404`, confirming stale Pages edge cache rather than a current artifact regression.
- Zone cache purge requests were accepted for `blackboxrecordsathens.com` and for the UAT Pages hostname, but did not invalidate the shared `pages.dev` object. The approved legacy-cache exception was not broadened to this commit.
- UAT deployment is therefore live and usable through the current deployment, while task 4.2 remains open until the canonical Pages alias passes the unmodified smoke gate.
