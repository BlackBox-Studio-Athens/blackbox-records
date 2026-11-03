# Validation: keep-uat-ready-to-test

## Observed

- `pnpm validate` passed on the final tree before the release (37 tasks), with `pnpm test cms-runtime`, backend typecheck, boundary checks and the workflow contract test.
- Release run for `81f6c9e0` passed every job, including `deploy-uat` and the e2e shards. The new step printed its summary: releases checked 5, distro checked 103; catalog numbers staged for `disintegration`, `caregivers` and `anarchotribal`; condition New staged for four releases and the distro items that lacked one; one stale acceptance release (`uat-label-release-acceptance-...`) was skipped and reported because it has no number and no known legacy assignment, and the deploy did not fail.
- The first run took about 7 minutes in the migration step (one draft write per missing value). Later runs only read.

## Not yet recorded

- A second deploy staging nothing (the next UAT release log).
- Staff publishing Afterwise with Show on Home on, with the Home chapter checked on UAT (task 2.2 here, task 4.3 of keep-released-items-on-home).

## Notes

- About 100 distro drafts now show as pending website changes. Publishing is limited to 20 selected records per publication, so they only need publishing when staff next edit those items.
