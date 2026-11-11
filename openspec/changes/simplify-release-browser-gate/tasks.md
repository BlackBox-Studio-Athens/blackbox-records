## 1. Evidence

- [x] 1.1 Classify every failed Release run of the last 40 by cause from the job logs.

## 2. Suite

- [x] 2.1 Delete the layout, typography, motion, timing and catalog-content specs.
- [x] 2.2 Remove the layout and timing tests from the kept specs and the helpers that only they used.
- [x] 2.3 Remove the Firefox projects and point WebKit at the phone journey specs.
- [x] 2.4 Wait for the guarantee notice image instead of reading it once.

## 3. Pipeline

- [x] 3.1 Run the suite in one `e2e` job and the staff previews in one Chromium `staff-previews` job.
- [x] 3.2 Require `e2e`, `staff-previews` and `deploy-uat` for promotion, with tests.
- [x] 3.3 Update the release docs that name the jobs.

## 4. Acceptance

- [x] 4.1 The touched specs pass twice in a row locally against the built preview: 269 passed, 1 WebKit player-continuity failure on the second repeat (footer Store tap did not navigate), which then passed 6 of 6 alone.
- [x] 4.2 A Release run on main passes every job: run 43105614689 (0b3be798), all seven jobs on attempt 1. The first run, 43090837640, failed staff-previews on staff-editor drift, fixed in 0b3be798.
- [x] 4.3 `promote-prd` accepts that run and PRD serves it: run 43107015670 verified the PRD Worker and hosted release at 0b3be798, run 43105614689.
