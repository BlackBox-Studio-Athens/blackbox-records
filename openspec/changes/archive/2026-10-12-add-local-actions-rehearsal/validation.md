# Manual local Actions setup evidence

## Final scope

The maintainer clarified: "I don't want code changes if possible, only the ability to test actions locally in the future." The custom harness and compatibility bridge were removed, and remaining container rehearsals were stopped. Final deliverables are the installed official tool and operational documentation. No application, package-script, feedback-policy or workflow changes from this task are intended to remain.

## Observed environment and rehearsal

- WinGet installed the official `nektos.act` executable, reporting version 0.2.89. Its portable package directory is registered in the user PATH; a new terminal picks it up.
- Docker Desktop reports running. The Linux engine named-pipe `/_ping` returned HTTP 200 `OK`; `docker info` reported Linux engine 29.8.2.
- The cached Ubuntu runner image digest is `sha256:62d572b92f9f32d3427b6d220ad1f9dca9c7b6ffad37d295425037dbff78abaf`.
- The real lint rehearsal copied the current Git-ignored working tree, installed dependencies, and reached `pnpm validate:checks --part=lint`. It failed formatting in an unrelated shared-checkout review document and then exposed the pinned upload action's `mime_type` protocol incompatibility. Its source changed during the run, so its summary is correctly invalidated and is not final acceptance evidence.
- Initial failure evidence: `.codex-artifacts/act/2026-10-10T14-54-16-694Z-44752-53c2dd/summary.json` and `act.log`.
- A later controlled-failure attempt was stopped while waiting for machine slots. No compatibility patch was retained. The full validation/browser matrix and artifact-upload compatibility remain unverified and are outside the clarified setup-only scope.

## Completion checks

Final diff, guidance/OpenSpec checks and repository validation are recorded in the ignored `.codex-artifacts/act/implementation-validation.json` pointer after documentation is complete. Earlier custom-harness test results and repository summaries belong to superseded source trees. Product browser/provider/release acceptance does not apply to this documentation and developer-machine setup change.

- `act --list -W .github/workflows/pages.yml -P ubuntu-latest=ghcr.io/catthehacker/ubuntu:act-24.04` passed using the explicit Linux Docker endpoint.
- `git diff --exit-code` passed for this task's former package, project, feedback-policy and workflow edit points: no implementation changes remain from this task.
- `pnpm agent:check` and strict OpenSpec validation passed. Documentation formatting and scoped `git diff --check` passed.
- Graphify refreshed after implementation removal: 26,223 nodes, 42,233 edges. The existing parser warning for `scripts/pages-workflow-contract.test.ts` remains.
- The 15:39 repository validation completed all 63 tasks successfully in its first pass. Another chat then changed `openspec/changes/simplify-main-site-modules/implementations/store-cart.md`; the automatic second pass failed that file's formatting check. This run is not accepted as a final pass: `.codex-artifacts/validation/2026-10-10T15-39-51-662Z-64208-dd735f/summary.json`. A fresh normal validation after these note edits is recorded in the ignored pointer above, including its source identities and observed status.
