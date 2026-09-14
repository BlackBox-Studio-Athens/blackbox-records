# Local validation measurements — unaccepted

Status on 2026-09-14: implementation is retained for review, not accepted as a
proven speed/token improvement. No merge, deployment, hosted smoke, or provider
operation was performed. Main-checkout work was not modified.

Baseline is `f0e79e9a6db07cd5ac12cb9ecce6911485614fea`, containing the committed
EmDash work inspected before worktree creation. The latest measured candidate is
`b699ef688d101f8882fcb7b763e334cbfe1ecbcc`, on `codex/validation-efficiency`.
The separate baseline worktree is detached. Dependencies and generated/cache
state are independent. Node 24.20.0, pnpm 12.0.0, RTK 0.47.0, and Codex CLI
0.153.4 were used on Windows 10.0.26200, an i5-8600K (six logical processors),
with 34,272,403,456 bytes of RAM. Dependency installation took 268.915s baseline
and 174.139s candidate, outside validation timing; other setup time was not
measured. The verified Node runtime is retained under the candidate's ignored
`.codex-artifacts/toolchain/` directory.

## Observed command results

The candidate preserves all 1,472 baseline tests and adds 13 runner tests, plus
the original format, lint, type, boundary, and build checks. Full validation
prepares catalog artifacts once. It defaults to sequential execution; the
two-group option remains an unaccepted experiment. Fast scopes are explicitly
partial and do not replace completion or task-specific acceptance checks.

Five fresh pairs completed against the latest candidate:

| Arm                         | Median seconds | p75 seconds | p90 seconds | Median console bytes |
| --------------------------- | -------------: | ----------: | ----------: | -------------------: |
| Baseline legacy three gates |        330.971 |     355.800 |     454.385 |              193,917 |
| Candidate `pnpm validate`   |        286.588 |     288.094 |     304.848 |                  377 |

The observed median reduction is **13.4%**, but it is **not controlled acceptance
evidence**: “Resume EmDash implementation” resumed on the same host at 03:58 UTC.
That overlaps candidate fresh repetition five (03:56:42–04:01:15 UTC) and the
warm series. No overlapping samples were silently removed. p75/p90 estimates
from five samples have low confidence. Console bytes are not model tokens;
complete candidate logs remain on disk.

Both excluded warm priming runs passed. Warm pair one was 232.266s baseline /
320.004s candidate; pair two was 308.630s / 341.751s. Candidate regressions were
37.8% and 10.7%, respectively. Baseline warm repetition three then failed after
212.151s: `apps/backend/test/http/internal-price-routes.test.ts:63` exceeded its
5,000ms timeout. The campaign stopped; there are no five-pair warm statistics.
Do not compare that partial failure with a successful full candidate run.

## Actual agent usage — pilot only

Three pilot trials ran serially with fresh `codex exec --json --ephemeral`
sessions, `gpt-5.6-luna`, high reasoning effort, workspace-write permissions,
the same installed configuration, and identical prepared frontend fixtures.
The candidate then was `a4f97b5b67d0663c912e8e88ff000b00512a16fb`, not the latest
revision. Both completed trials correctly refused completion after failed
required gates. They are not passing-scenario comparisons.

| Trial                               | Seconds |       Input | Cached input |      Output | Reasoning output | Total input + output | Observed calls / explicit log reads |
| ----------------------------------- | ------: | ----------: | -----------: | ----------: | ---------------: | -------------------: | ----------------------------------: |
| Baseline frontend 1 — failed gates  | 757.078 |   1,922,168 |    1,822,208 |       5,273 |            2,142 |            1,927,441 |                              18 / 0 |
| Candidate frontend 1 — failed gates | 328.068 |     969,052 |      908,800 |       4,138 |            1,790 |              973,190 |                               8 / 2 |
| Candidate frontend 2 — interrupted  | 323.345 | unavailable |  unavailable | unavailable |      unavailable |          unavailable |                               8 / 1 |

The interrupted trial was stopped when the collector's capture-only validity
check was found insufficient. Its fixture was restored, evidence retained, and
the dead runner's exact stale lock removed after checking its PID. The collector
now requires successful completion-gate commands in passing scenarios, rather
than treating a successful CLI exit plus usage as successful validation.

Usage is from completed-turn events, not RTK estimates. Cached input and reasoning
output are subcategories and are not added again. Observed calls are completed
command/MCP events; polling and implicit log reads are not separately exposed by
the CLI. Whole-turn time/tokens include their cost. Independent transcript review
remains necessary to verify the reported outcome and the actual gates.

The requested 30-trial acceptance matrix is **not complete**: only these three
pilot attempts exist, with two usage records and no accepted passing scenario.
Backend-pass and planted-assertion scenarios have not run. No 20% token-reduction
claim, subscription-savings claim, or scenario non-regression claim is justified.

## Retained evidence and verification

- [Frozen protocol and gate inventory](validation-benchmark.md).
- [Latest command runs, including the failing baseline](C:/Users/SVall/WebstormProjects/blackbox-records-validation-efficiency/.codex-artifacts/validation-benchmark/commands-2026-09-14T03-06-51-571Z/runs.json). Phase commands, durations, counts, exits, bytes, fingerprints, and log paths are retained. Every candidate console log links its detailed validation summary.
- [Agent pilot records and transcript paths](C:/Users/SVall/WebstormProjects/blackbox-records-validation-efficiency/.codex-artifacts/validation-benchmark/agents-2026-09-14T01-51-06-270Z/runs.json). Original pilot `valid` fields meant capture validity, not gate success; do not use their original statistics as acceptance.
- [Earlier command campaign](C:/Users/SVall/WebstormProjects/blackbox-records-validation-efficiency/.codex-artifacts/validation-benchmark/commands-2026-09-14T02-21-37-059Z/runs.json) stopped on false source invalidation from generated pnpm probes/directory notifications.
- [Second command campaign](C:/Users/SVall/WebstormProjects/blackbox-records-validation-efficiency/.codex-artifacts/validation-benchmark/commands-2026-09-14T02-33-30-172Z/runs.json) stopped on Windows access-notification false invalidation. Both defects were fixed and regression-tested; earlier samples remain separate.
- [Initial baseline failure](C:/Users/SVall/WebstormProjects/blackbox-records-validation-baseline/.codex-artifacts/validation-benchmark/baseline-tests.log) and sibling `baseline-retry-*.log` files retain the pre-existing catalog-operation timeout and passing isolated retry of all three gates. The retry totaled 357.763s; it was exploratory, not paired evidence.
- [Sequential exploratory candidate](C:/Users/SVall/WebstormProjects/blackbox-records-validation-efficiency/.codex-artifacts/validation/2026-09-14T01-36-18-128Z-52968/summary.json) and [two-group exploratory candidate](C:/Users/SVall/WebstormProjects/blackbox-records-validation-efficiency/.codex-artifacts/validation/2026-09-14T01-45-22-255Z-42680/summary.json) retain 486.5s and 208.7s runs with different cache state; no speedup is inferred from them.
- [Final functional compatibility evidence](C:/Users/SVall/WebstormProjects/blackbox-records-validation-efficiency/.codex-artifacts/validation-benchmark/final-compatibility/summary.json) records the legacy three gates against the final committed candidate. This is functional verification, not another timing comparison.

The runner acceptance suite passes 14 tests, including real failing Node test,
Prettier, TypeScript, dependency-cruiser, and Astro invocations; subprocess exits;
missing inputs; cancellation; scoped partial results; worktree opt-in rejection;
and persistent/reverted source edits versus reads and generated probes. Reproduce
with the acceptance command in the protocol. Evidence directories are ignored,
local-only, and must be retained separately from Git.

Acceptance remains blocked by incomplete warm/agent matrices, intermittent
baseline failures, and overlapping host work. A quiet window and a stable
approved baseline are needed before rerunning the full protocol. Do not weaken
tests, inflate timeouts, discard failed runs, or treat the observed 13.4% as an
accepted overall improvement.
