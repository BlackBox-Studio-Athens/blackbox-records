# Validation

## Source and local validation

- **Source:** SHA `64466274` (`perf(release): deploy UAT after checks and read Worker identity from the entry`).
- **`pnpm validate`** (`NX_PLUGIN_NO_TIMEOUTS=true`) on the working tree before that commit:
  - status `passed`, `mode: local`, 114.0 s;
  - fingerprint `4154799a…25e180` (25 changed files) matched before and after;
  - summary: `.codex-artifacts/validation/2026-10-06T23-10-57-962Z-56076-7e6c69/summary.json`.
  - It proves repository gates only.
- **Focused checks, all passing:**
  - `node --test scripts/release-candidate.test.mjs` (12/12)
  - `node --test scripts/validate.test.mjs` (22/22)
  - `pnpm test apps/backend/src/emdash-checkpoint.test.ts` (it includes the new entry-preflight test)
  - `pnpm test scripts/pages-workflow-contract.test.ts`
  - `pnpm agent:check`
  - `pnpm openspec -- validate fast-release-path --type change --strict`

## Product Environments and acceptance rows

- **Environments:** UAT and PRD for hosted timing evidence; Local for repository gates.
- **Rows used:** Release/environment and Boundaries/tooling/instructions.
- **Covered by the push run's own jobs, not run locally:**
  - the Shell/player and Staff/editor browser suites (`e2e (1)` to `e2e (4)`, `staff-previews (chromium)`, `staff-previews (firefox)`);
  - the UAT static smoke.
- **Not applicable:** CMS/schema/publication and Commerce/checkout/stock. The change touches release tooling and the backend entry's CORS preflight routing, not editorial, stock or checkout behaviour.

## Hosted evidence (2026-10-06, UTC)

**Push run `37545331781`** (pushed 23:13:17, green):

| Measure                                          | Time                                                                                    |
| ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| UAT live (Pages deployed at 23:17:17)            | 4:00                                                                                    |
| `deploy-uat` done (23:18:16)                     | 5:00                                                                                    |
| Run green (last job 23:18:23)                    | 5:06                                                                                    |
| Gate: `check-candidate` lint / typecheck / tests | 1:50 / 1:28 / 2:24                                                                      |
| `build-uat`                                      | 1:17                                                                                    |
| `deploy-uat`                                     | 2:27 (migrations 22 s, Workers 19 s, Pages 10 s, verify 7 s, Chromium 22 s, smoke 25 s) |
| `e2e (1)` to `e2e (4)`                           | 3:48 / 2:46 / 4:35 / 5:01                                                               |
| `staff-previews (chromium)` / `(firefox)`        | 3:38 / 4:21                                                                             |

**Promotion `37546197141`** (dispatched 23:22:27, success):

| Measure                               | Time |
| ------------------------------------- | ---- |
| PRD live (Pages deployed at 23:24:24) | 1:57 |
| Promotion done (23:24:27)             | 2:00 |
| Build                                 | 25 s |
| Migrations                            | 20 s |
| Workers                               | 19 s |
| Pages                                 | 6 s  |
| `Verify the deployed PRD release`     | 3 s  |

**Lag probe.** From Athens, every 5 s: the entry was read with `OPTIONS /api/store/capabilities` and the Durable Object with `GET`.

|     | Entry served the new SHA                                | Durable Object served the new SHA |
| --- | ------------------------------------------------------- | --------------------------------- |
| UAT | 23:17:08, about 1 s after the backend deploy step ended | 23:22:06, about 5 min later       |
| PRD | 23:24:23, about 5 s after the Workers step              | 23:29:28, about 5 min later       |

This confirms the diagnosis: the old poll waited for the Durable Object's code update, not for Worker propagation. Task 1.5's follow-up (bundle trim or Worker split) is not needed.

**Targets:**

| Target | Required           | Measured                                              |
| ------ | ------------------ | ----------------------------------------------------- |
| UAT    | at most 5 to 7 min | 4:00 to live, 5:06 to green (before: 14.6 / 14.8 min) |
| PRD    | at most 3 to 5 min | 2:00 (before: 7:53)                                   |

## Unverified and left open

- **Durable Object lag.** The commerce and CMS Durable Objects still run the previous code for about 5 minutes after a deploy, and the pipeline does not wait for them. Backend API changes must stay compatible with the previous release.
- **Edge cache on `?release=`.** Whether the renderer's edge cache keys on the `?release=<sha>` query is not observed directly. `verify-hosted` passed within the step's 3 to 7 seconds.
- **Single-browser editor runs.** A local `validate:editor --browser=…` run still records `mode: editor`.
- **Browser and visual acceptance** were not repeated locally. One push and one promotion are the timing sample.
