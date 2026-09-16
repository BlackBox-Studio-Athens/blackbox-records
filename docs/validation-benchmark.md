# Local validation benchmark protocol

Current results and unresolved acceptance items: [refreshed measurement report](validation-refresh-report.md).

Refreshed baseline: `8b5160c552959751ad95e2053fc9d499dec590fb`. The September 14 report is historical, not acceptance for this revision. Implementation is authorized on
`codex/validation-efficiency` in its separate worktree. Main is not modified.

Use Node 24.20.0, pnpm 12.0.0, independent worktree dependencies and caches, and
RTK 0.47.0 in both arms. Record setup separately. Do not time competing workloads.
The benchmark model is pinned to `gpt-5.6-luna`, effort `high`;
pin both for every agent trial. Keep existing user configuration, rules, tools,
and RTK guidance. Use fresh sessions, one at a time, with JSONL event capture.

## Frozen scenarios

The fixtures below are fixed before runner tuning. Apply the same fixture in
both arms and restore only the exact fixture afterward. No provider activity.

1. Frontend pass: append a regression test to `apps/web/src/utils/content.test.ts`
   asserting `calculateYearsActive(2020, 2026)` equals `7`.
2. Backend pass: add `apps/backend/test/scripts/validation-benchmark-fixture.test.ts`
   with a Vitest assertion that `new URL('/api/store/capabilities',
'http://127.0.0.1:8787').pathname` equals `/api/store/capabilities`.
3. Failure diagnosis: add the same backend test file but expect `/api/wrong`.
   The expected finding is the incorrect assertion in that file; never repair
   or suppress the fixture during the trial.

Passing prompt: “A prepared regression-test change is present. Follow this
repository's normal implementation validation instructions, exercise the
required completion checks, and report whether the tree is ready. Do not edit
source, commit, deploy, or access hosted services. Local generated build outputs
are allowed.”

Failure prompt: “A prepared test change is present. Exercise the repository's
normal validation, diagnose any failure with its file and assertion, and report
whether completion is allowed. Do not edit, suppress tests, commit, deploy, or
access hosted services. Local generated build outputs are allowed.”

## Preserved gate inventory

| Gate           | Required leaves                                                                                                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit tests     | Web Vitest, Staff Vitest, backend Worker Vitest then Node Vitest, API-client Vitest                                                                                                                                              |
| Root contracts | Route isolation and Pages workflow Vitest; release candidate, inventory, import, markdown, capture, local publication poll, snapshot readers/staging, CMS schema and backup Node tests; candidate additionally tests this runner |
| Check          | Environment model; Prettier; uncached ESLint; web/staff Astro checks and backend/client TypeScript checks; module audit, dependency-cruiser, commerce audit                                                                      |
| Build          | Web Astro build, cache policy, font and image markup checks, public route isolation; Staff Astro build and staff route isolation                                                                                                 |

The existing package-level parallel test/type scheduling remains unchanged.
The candidate's two-group scheduling overlaps tests and checks only;
builds start after both have passed. Catalog generation is prohibited in ordinary validation.
Two groups are the candidate default after the refreshed pilot passed in 182.9s
versus 264.1s sequentially. This is exploratory, not acceptance evidence.
Use `--jobs 1` for sequential diagnosis; the five-pair benchmarks must confirm
the default before accepting it. Old baseline timeouts are not silently discarded.

Run `pnpm benchmark:validation --baseline <baseline-worktree> --candidate
<candidate-worktree> --mode commands` for command trials, and substitute
`--mode agents` for actual Codex trials. The harness stops at an invalid run,
retains it, and requires diagnosis before restarting; a restarted campaign has
a new evidence directory. Neither harness validity nor computed statistics
constitutes acceptance without transcript review and the stated thresholds.
Passing agent scenarios now stop the campaign unless all required gate commands
exited successfully. Usage capture alone is not successful validation. Statistics
retain failures; incomplete or failed groups must not be compared as savings.

## Measurements

Command trials: five paired repetitions each for fresh generated/cache state
and warm state. Alternate A/B and B/A order. Exclude installation from elapsed
validation time. Fresh means removing only an explicit allowlist of generated
Astro/build outputs and test caches inside each worktree;
never clear the shared pnpm store or delete source. Prime each warm arm once.

Agent trials: five paired repetitions of each frozen scenario (30 runs).
Passing trials must execute all completion gates. Failure trials must identify
the actual assertion and must not report completion. Count command selection,
polls, additional log reads, and final reporting, not just terminal output.

Retain every run, including failures and interruptions. Store raw logs/events,
source fingerprints, versions, hardware, commands, counts and exit codes under
ignored `.codex-artifacts/validation-benchmark/`. Commit only a concise report.
Report median, p75 and p90; tail statistics with five samples are low confidence.

Actual Codex usage comes from `turn.completed.usage`, including input, cached
input, output and separately exposed reasoning tokens. Cached input and
reasoning are subcategories, not additional total tokens. Preserve missing
values as unavailable. Do not equate RTK estimates or account quota percentages
with actual model usage or monetary savings.
The CLI exposes completed command/MCP events, not every polling operation.
Report observed calls and explicit log-read commands as lower bounds. Whole-turn
usage and elapsed time include polling, even when its call count is unavailable.

## Refreshed local editor scenario

Keep the three frozen agent fixtures above unchanged. Additionally compare the existing
local staff fixture browser flow: build staff, run `scripts/test-preview-policy.mjs`,
then `scripts/test-content-workspace.mjs` in Chromium and Firefox. Candidate instructions
expose `pnpm validate:editor`; baseline uses its documented individual commands.
This is additional browser evidence, not a substitute for repository completion gates.
The fixture APIs are in-memory. Never run mutating publication trials against the
developer's persistent library. Real CMS/public-renderer acceptance remains explicitly
additional, requiring isolated storage and the checks in docs/content-publication.md.

Run a one-pair passing/failing agent pilot before the full matrix. Pilot results are
not five-sample acceptance evidence. Preserve all unsuccessful runs. Native Vitest
reports identify test files/assertions; ESLint JSON records diagnostics and rule times.
The two root contract suites formerly collected twice are owned by test:contracts;
assertion identity, not duplicate execution count, determines preservation.

Use `--scenario frontend` or `--scenario failure` with `--mode agents --repetitions 1`
for pilots. Use `--mode commands --scenario editor` for the additional browser
comparison. All trial prompts explicitly authorize the separate worktree while
prohibiting OpenSpec artifact edits. Candidate agents may choose either the
aggregate command or all three legacy gates; do not discard slower valid choices.
The editor fixture now releases initial search/history responses only after the
loading assertions, instead of racing a fixed 1.5-second timeout. The original
Firefox failure and trace remain evidence; no assertion was removed or weakened.

Runner acceptance checks: `node --import tsx --test scripts/validate.test.mjs
scripts/validate-acceptance.test.mjs`. The second file invokes real failing test,
Prettier, TypeScript, dependency-cruiser, and Astro commands in isolated temporary
fixtures. The first checks cancellation, missing input, worktree opt-in, partial
results, and persistent and reverted source edits. Do not run these diagnostics
concurrently with timed benchmarks.

Accept only with all checks preserved, no false success, at least 10% lower
median full command time and 20% lower median total agent tokens across equally
weighted scenarios. No scenario's median time or tokens may regress over 10%.
Compare full to full, not fast to full. Missing usage or a failing baseline
leaves acceptance incomplete. Do not discard unfavorable runs.

Evaluate command reduction separately in fresh and warm state. For agent tokens,
weight the three scenarios equally using the mean of their candidate/baseline
median token ratios, not a sum that lets the most expensive scenario dominate.
Require each scenario's median time and token ratio to remain at or below 1.10.
User configuration and instruction hashes are retained without their contents;
a changed harness during a trial invalidates its comparison. The prompt specifies
the pinned toolchain on PATH, but never supplies the candidate validation command.
The common prompt also supplies the absolute personal policy root and RTK guide/binary
paths. The first refreshed frontend pilot could not resolve relative personal policy
links and ran plain pnpm; retain that pilot as a setup deviation, not RTK comparison
proof. Review subsequent transcripts for RTK use before accepting token comparisons.
The corrected failure pilot exposed a diagnostic-selection defect: expected D1 errors
from passing tests appeared before the failed assertion. The runner now prioritizes
test-failure sections and reports skipped phases explicitly. Retain the slower-token
pilot as tuning evidence; do not mix it into the final frozen candidate matrix.
