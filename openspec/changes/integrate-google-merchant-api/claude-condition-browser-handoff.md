# Claude addendum: condition-aware browser fixtures

Complete the existing browser acceptance tests for the new condition field. Work on `main` in `C:/Users/SVall/WebstormProjects/blackbox-records`, base `f5ecffac7352501de6007e2e867752e0c533284b`. Read AGENTS.md and the original condition UI handoff. The owner retains Claude ownership of UI tests. Codex has committed the reviewed UI/backend implementation; do not change controls, invent defaults, weaken validation, edit backend/contracts, or touch unrelated working changes.

The combined local validator passed 56/56 tasks with source fingerprint `8e457a3503cf871d7f57cea01a7ff7f2a6e2ffd9a0530d924ae4601617f4ddb3`. [UAT CI run40915428904](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/40915428904) exposed these browser-test gaps. Fix them locally; the coordinator owns commit/push/release, content publication and all provider operations.

## Staff creation and publication fixtures

Owned file: `scripts/test-content-workspace.mjs`.

- In `assertCreationPublication`, around line1842, choose **Physical condition** explicitly before the first Details **Continue**. The existing test omits the newly required choice, remains on Details, then times out filling the hidden Price (EUR) input at line1850. Both Chromium and Firefox staff-preview jobs fail on this same helper. Use the actual accessible label and choose `new` or `used`; assert the choice survives reload and that the created source carries the same condition.
- The existing happy-path `data.releases` (Vinyl, around line94) and `data.distro` (physical group, around line112) fixtures need explicit condition because later unified-catalog publication uses them, including `assertUnifiedCatalog` around lines1988/2097. Add a fact to these controlled synthetic fixtures, not a production default or global normalizer. Keep intentional invalid/missing-condition cases intact.
- Other `/items/new/?kind=` callers were checked: navigation-only links/loops around2814/3024 and the deliberately unfinished editorial Release around3355. Preserve those blank draft/navigation scenarios; they do not confirm physical creation. Scan any additional successful physical creation/publication caller you change so another omission is not hidden behind the first failure.

Evidence: `.codex-artifacts/merchant-pilot/uat-f5-staff-preview-firefox.log` and `uat-f5-staff-preview-chromium.log`. Both fail because Price is not visible after the omitted required choice. This is not a demonstrated UI runtime defect or provider incident; do not bypass the step or add automatic retry.

## Separate numeric assertion failure

Owned file: `e2e/store-buy-bar.spec.ts:47`. CI shard3 failed the phone preorder test with `Expected: 0`, `Received: -0` after `Math.round(innerHeight - rect.bottom)`. The same result occurred on its configured retry. Assess the test's numeric equality, then normalize signed zero (for example, assert `Math.abs(edge)` equals0) while retaining the existing rounded-pixel boundary check. Do not change UI layout or widen tolerances merely to pass. Evidence: `.codex-artifacts/merchant-pilot/uat-f5-e2e-shard3.log`; 133 tests passed in that shard. This is separate from the Staff condition fixture.

## Checks and return

Run `pnpm openspec:guard` before edits. Use the repository's existing Chromium/Firefox Staff-preview entry points and a focused chromium-mobile buy-bar test, respecting feedback-policy.json and browser/runtime instructions. Resolve the exact supported commands from package.json/workflow; do not bypass the guard or run a whole-project command without its required grant. Record actual browser results, source hashes and any missing acceptance. No live data, stock, private drafts, credentials or flags should change.

Save the return to `C:/Users/SVall/WebstormProjects/blackbox-records/openspec/changes/integrate-google-merchant-api/claude-condition-browser-return.md`, with changed files, current blob hashes, exact commands/results and unresolved findings. Do not invoke or message another agent. The coordinator will review the diff and rerun the required canonical checks before the next candidate.

Read and carry out C:/Users/SVall/WebstormProjects/blackbox-records/openspec/changes/integrate-google-merchant-api/claude-condition-browser-handoff.md; save results to C:/Users/SVall/WebstormProjects/blackbox-records/openspec/changes/integrate-google-merchant-api/claude-condition-browser-return.md.
