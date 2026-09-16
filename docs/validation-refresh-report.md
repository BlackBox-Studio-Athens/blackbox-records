# Refreshed local validation measurements — unaccepted

Status: 2026-09-17. The full-command speed target is met. Overall acceptance is
incomplete: the thirty-agent matrix stopped at its first candidate trial after
a Windows sandbox build failure. No token-savings claim is accepted. Nothing
was merged or deployed; the main checkout is unchanged.

## Revision and implementation

Baseline: `8b5160c552959751ad95e2053fc9d499dec590fb`, detached in
`C:/Users/SVall/WebstormProjects/blackbox-records-validation-baseline`.
Measured candidate: `5c7cb37f5ff5d063c1c00de851da9077a03eb353`, branch
`codex/validation-efficiency`, in the sibling validation-efficiency worktree.
The original `f0e79e9a` comparison is historical; main has changed substantially.
The explicitly authorized worktree exception and default-deny OpenSpec guard
remain documented and tested. See the [frozen protocol and gate inventory](validation-benchmark.md).

`pnpm validate` now runs the complete current repository gates. It overlaps
two independent test/check groups, then builds only after both pass. It retains
native Vitest JSON, ESLint diagnostics/statistics, complete logs, phase timings,
tool versions and start/end source fingerprints. Source edits invalidate success.
`validate:full` aliases it; the legacy three commands remain independently usable.
`validate:fast` and `validate:editor` are explicitly partial. Browser, CMS,
publication and asset acceptance remain additional.

Main removed routine catalog generation, so no catalog preparation or skip flag
was added. Two root Vitest suites were collected by both web and root contracts;
their sixteen duplicate executions were removed, not their assertions. Candidate
native reports contain 1,452 Vitest cases, plus the existing Node contracts and
fifteen runner tests. No automatic affected selection, persistent result cache,
cached final lint, new orchestration framework or dependency was introduced.

## Controlled command measurements

Five paired fresh and five paired warm repetitions completed, alternating order,
with no overlapping benchmark workloads. Both warm primes passed and are excluded.
Every measured run passed with unchanged source identity. Baseline used RTK-wrapped
`pnpm test:unit`, `pnpm check`, `pnpm build`; candidate used RTK-wrapped
`pnpm validate --jobs 2`.

| State | Arm       | Median seconds | p75 seconds | p90 seconds | Median console bytes |
| ----- | --------- | -------------: | ----------: | ----------: | -------------------: |
| Fresh | Baseline  |        288.360 |     288.794 |     296.639 |              198,414 |
| Fresh | Candidate |        233.501 |     236.978 |     249.971 |                  593 |
| Warm  | Baseline  |        241.557 |     242.568 |     242.787 |              186,494 |
| Warm  | Candidate |        194.678 |     195.138 |     195.843 |                  593 |

Median reductions: **19.0% fresh**, **19.4% warm**, both above the 10% target.
p75/p90 use nearest ranks; tail estimates from five samples have low confidence.
Console bytes are not model tokens. Full candidate output remains on disk.

The gain is elapsed-time overlap, not uniformly faster leaves. Baseline median
unit time was 133.170s fresh / 141.409s warm; candidate was 149.051s / 160.102s
while competing with its check group. Build medians were 78.044s / 29.227s
baseline and 80.353s / 29.719s candidate. Do not add concurrent phase durations
to infer total time, or claim each phase became faster.

[All command records](C:/Users/SVall/WebstormProjects/blackbox-records-validation-efficiency/.codex-artifacts/validation-benchmark/commands-2026-09-16T19-54-08-089Z/runs.json)
retain actual commands, phase times, test summaries, exits, bytes, cache state,
source fingerprints and embedded candidate summaries.
[Statistics](C:/Users/SVall/WebstormProjects/blackbox-records-validation-efficiency/.codex-artifacts/validation-benchmark/commands-2026-09-16T19-54-08-089Z/statistics.json)
and [metadata](C:/Users/SVall/WebstormProjects/blackbox-records-validation-efficiency/.codex-artifacts/validation-benchmark/commands-2026-09-16T19-54-08-089Z/metadata.json)
are retained separately.

Hardware: Windows 10.0.26200, Intel i5-8600K, six logical processors,
34,272,403,456 bytes RAM. Both arms used Node 24.20.0, pnpm 12.0.0 and RTK 0.47.0.
Dependencies, generated outputs and caches were independent. Setup was outside
validation timing: baseline install 20.235s; candidate pnpm reported 34.3s for
its initial automatic refresh, followed by a measured 2.096s install verification.
This is not a complete end-to-end setup timing. The default shell's Node 24.17.0
was not used; the pinned runtime is retained under ignored `.codex-artifacts/toolchain/`.

## Actual agent measurements

Fresh `codex exec --json --ephemeral` sessions used CLI 0.153.4,
`gpt-5.6-luna`, high reasoning effort and `workspace-write`. Prompts supplied
identical toolchain and personal-policy/RTK paths, but never the candidate command.
Fixtures were identical and restored after each trial. Configuration hashes,
prompts, transcripts, command exits and final responses are retained.

Eight pilot trials preceded the matrix. The matrix then stopped after two of
thirty planned trials. All ten actual usage records are shown; none is discarded.
Each row below represents one trial, not a five-sample median.

| Trial                                | Arm       | Seconds |     Input | Cached input | Output | Reasoning output | Total input + output | Calls / log reads |
| ------------------------------------ | --------- | ------: | --------: | -----------: | -----: | ---------------: | -------------------: | ----------------: |
| Initial frontend pilot               | Baseline  | 333.421 |   987,137 |      896,512 |  3,016 |              934 |              990,153 |            12 / 0 |
| Initial frontend pilot               | Candidate | 244.454 |   576,298 |      535,296 |  3,627 |            1,127 |              579,925 |            14 / 2 |
| Failure pilot, before diagnostic fix | Baseline  | 339.171 |   796,048 |      731,648 |  3,197 |            1,509 |              799,245 |             7 / 0 |
| Failure pilot, before diagnostic fix | Candidate | 294.837 |   995,782 |      933,120 |  4,839 |            2,046 |            1,000,621 |            13 / 3 |
| Corrected frontend pilot             | Baseline  | 333.097 | 1,065,847 |      993,280 |  3,842 |            1,562 |            1,069,689 |             6 / 1 |
| Corrected frontend pilot             | Candidate | 290.863 |   533,853 |      488,448 |  3,136 |            1,308 |              536,989 |            15 / 1 |
| Failure pilot, after diagnostic fix  | Baseline  | 354.171 | 2,211,646 |    2,105,088 |  5,199 |            2,044 |            2,216,845 |             9 / 0 |
| Failure pilot, after diagnostic fix  | Candidate | 271.457 |   612,886 |      555,520 |  3,653 |            1,349 |              616,539 |            19 / 3 |
| Matrix frontend 1                    | Baseline  | 373.091 | 1,162,981 |    1,037,568 |  3,293 |              847 |            1,166,274 |            13 / 0 |
| Matrix frontend 1 — invalid          | Candidate | 418.489 |   948,987 |      858,112 |  8,481 |            4,792 |              957,468 |            33 / 2 |

Usage comes from completed-turn events. Cached input and reasoning output are
subcategories, not added again. Calls and explicit log-read commands are observed
lower bounds; CLI polling is not separately exposed, but its time/tokens are included.
No subscription or monetary savings are inferred. The three equally weighted
scenario medians and their 10% non-regression checks cannot be computed yet.

Pilot issues and evidence:

- [Initial frontend pilot](C:/Users/SVall/WebstormProjects/blackbox-records-validation-efficiency/.codex-artifacts/validation-benchmark/agents-2026-09-16T19-08-06-730Z/runs.json): gates passed, but personal policy links did not resolve and plain pnpm was used. Not an RTK comparison. Candidate also incurred lock/polling overhead.
- [First failure pilot](C:/Users/SVall/WebstormProjects/blackbox-records-validation-efficiency/.codex-artifacts/validation-benchmark/agents-2026-09-16T19-20-33-432Z/runs.json): both refused completion, but candidate tokens were 25.2% higher. Its excerpt selected an expected D1 error from a passing negative-path test. The shared excerpt now prioritizes actual test failures and explicitly reports skipped phases; a regression test covers this.
- [Corrected frontend pilot](C:/Users/SVall/WebstormProjects/blackbox-records-validation-efficiency/.codex-artifacts/validation-benchmark/agents-2026-09-16T19-31-30-548Z/runs.json): both passed through RTK. Candidate selected the full validator from normal instructions. This was before the diagnostic-only fix.
- [Corrected failure pilot](C:/Users/SVall/WebstormProjects/blackbox-records-validation-efficiency/.codex-artifacts/validation-benchmark/agents-2026-09-16T19-43-21-673Z/runs.json): both identified `validation-benchmark-fixture.test.ts:4`, expected `/api/wrong`, received `/api/store/capabilities`, and refused completion. Candidate correctly identified the skipped build.

## Matrix blocker and remaining work

The [matrix records and transcripts](C:/Users/SVall/WebstormProjects/blackbox-records-validation-efficiency/.codex-artifacts/validation-benchmark/agents-2026-09-16T21-22-58-970Z/runs.json)
show baseline full success followed by candidate build failure. Astro failed to
rename `apps/staff/dist/.prerender/_astro/EditorialPicker.BqDHqGY_.css` over the
generated destination with Windows `EPERM`. The affected candidate assets were
owned by `CodexSandboxOffline`; baseline's corresponding asset was user-owned.
This is evidence of a sandbox/output interaction, not a proven root-cause fix.
The agent reported denied cleanup attempts. A separate-output staff build passed,
but did not satisfy the full gate and introduced unignored generated files, so
the collector also detected changed source identity. The agent correctly said
“not ready”; there was no false success.

The separate diagnostic output was moved, not deleted, to the campaign's
`diagnostic-staff-build/` evidence directory after the trial. The denied canonical
`apps/staff/dist` target was left untouched. No sandbox permissions, ACLs, installed
CLI or safety configuration were changed. OpenAI documents that Windows sandbox
constraints propagate to child processes through restricted permissions; do not
treat an unrestricted parent retry as proof of sandbox success. See the
[Windows sandbox design](https://openai.com/index/building-codex-windows-sandbox/).

Remaining: resolve the sandbox/output failure without weakening permissions or
gates; repeat controlled pilots if setup changes; complete all thirty agent trials
with transcript review; run the additional five editor pairs; run the legacy three
gates once against the final candidate as the explicit compatibility check.
That final compatibility check has not been completed for this revision. The
twenty full command runs above are gate-equivalence evidence, not a substitute
for claiming that separately requested check was done.

Runner acceptance: [sixteen passing checks](C:/Users/SVall/WebstormProjects/blackbox-records-validation-efficiency/.codex-artifacts/runner-diagnostic-acceptance.log),
including real failing test/format/type/boundary/build commands, missing artifacts,
cancellation, persistent/reverted source edits, worktree rejection without opt-in,
parallel failure propagation and bounded diagnostics.

Editor pilot: the [original Firefox failure](C:/Users/SVall/WebstormProjects/blackbox-records-validation-efficiency/.codex-artifacts/validation/2026-09-16T18-43-25-748Z-23824/summary.json)
and trace exposed a fixed 1.5-second response race: the loading assertion ran
about 30ms after the response completed. Deterministic response release after the
loading assertions fixed the fixture without removing assertions. The
[repeat passed both browsers](C:/Users/SVall/WebstormProjects/blackbox-records-validation-efficiency/.codex-artifacts/validation/2026-09-16T18-47-30-167Z-20288/summary.json)
in 97.8s with tracing enabled. Tracing subsequently became opt-in; the final
default-no-trace editor profile still needs its requested paired verification.
This is not live CMS/publication acceptance.

Earlier exploratory sequential/parallel runs and the one-pair warm pilot remain
under ignored validation evidence. September 14 failures and interrupted trials
remain documented in the [historical unaccepted report](validation-benchmark-report.md).
No unfavorable observation was silently removed. Local ignored evidence must be
retained separately from Git. Overall status remains **unaccepted**.
