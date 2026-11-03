# Validation: keep-uat-ready-to-test

## Observed

- `pnpm validate` passed on the final tree before the release (37 tasks), with `pnpm test cms-runtime`, backend typecheck, boundary checks and the workflow contract test.
- Release run for `81f6c9e0` passed every job, including `deploy-uat` and the e2e shards. The new step printed its summary: releases checked 5, distro checked 103; catalog numbers staged for `disintegration`, `caregivers` and `anarchotribal`; condition New staged for four releases and the distro items that lacked one; one stale acceptance release (`uat-label-release-acceptance-...`) was skipped and reported because it has no number and no known legacy assignment, and the deploy did not fail.
- The first run took about 7 minutes in the migration step (one draft write per missing value). Later runs only read.

## Publication queue (UAT)

- Root cause: the UAT public origin redirects anonymous requests to Cloudflare Access, so the confirmation fetch never got the identity JSON; a 15 Oct publication waited in Confirming and blocked the serialized queue, so nothing completed after 9 Oct.
- After the release of `12a06e9e` the history showed all three stuck rows Published at 3 Nov 20:45 Athens time (Website update for Disintegration, LOTUS, and the 15 Oct "site" entry), and the editor read "Everything is live".
- The deploy run's `e2e-webkit` job hit the job time limit (an infrastructure timeout, no failing test); the failed job was rerun.

## Not yet recorded

- A second deploy staging nothing (the next UAT release log).
- A second deploy staging nothing is expected but not yet read from a log.

## Notes

- About 100 distro drafts now show as pending website changes. Publishing is limited to 20 selected records per publication, so they only need publishing when staff next edit those items.
