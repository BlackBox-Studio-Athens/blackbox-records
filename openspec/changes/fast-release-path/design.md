## Context

The archived `simplify-software-release` change made a green push run the acceptance evidence and promotion deploy-only. It measured, but did not fix, the time spent waiting for Worker identity.

Measured on 2026-10-06:

- **Push run `37537450513`.** Step times: lint 2:03, tests 3:38, e2e 4:36 and 6:38, staff previews 6:10, build 1:17.
- **`deploy-uat`.** Started at 6:46 and ran 8:04. `wrangler deploy` of both Workers took about 20 s, then `verify-worker` polled for 5:23.
- **Promotion `37539133505`: 7:53.**
  - The control plane listed the new PRD backend version at 100% from 22:14:59Z.
  - At 22:19Z the backend in ATH still answered with the old SHA, while the renderer through Pages already served the new one.
  - The poll passed at about 22:20:40Z.

## Decisions

1. **The user decided on 2026-10-07:** UAT deploy waits for the build plus all static checks (lint, typecheck, unit tests). The browser suites run on every push and gate promotion, not the UAT deploy. This replaces decision 2 of `simplify-software-release`.
2. **Identity comes from the Worker entry.** The deployed entry answers `OPTIONS /api/*` with the existing preflight-only HTTP app, as `src/index.ts` does. The `/api/*` middleware stamps `X-Release-SHA` and `X-Release-Run-Number`. `/api/internal/*` stays on the staff path unchanged.
3. **Pages follows the Workers immediately; the checks run after.**
   - The renderer and the backend have no request dependency on each other, and browser islands already tolerate one release of API skew.
   - Gating Pages on a poll lengthened the window in which new renderer HTML referenced `/_astro` chunks the old Pages deployment lacked: about 6 minutes on both runs above. With Pages straight after the Workers, the window is about 15 s.
   - The identity checks still run inside the non-cancelling lock, before the smoke.
4. **The poll budget is 24 attempts of 5 s.** With the entry answering, the old 10-minute budget only hides failures.
5. **The `/` identity read uses a query** (`/?release=<sha>`), because the renderer stamps `s-maxage=30, stale-while-revalidate=30`.
6. **Parallel parts are:**
   - checks `lint`, `typecheck` and `tests`;
   - end-to-end shards `1/4` to `4/4` over all projects (a project filter could silently drop a new project);
   - one staff-preview job per browser.

   `validateSuites` names them, so runs from before this change are unpromotable.

## Expected timings

| Path                             | Before         | After (estimate)                                      |
| -------------------------------- | -------------- | ----------------------------------------------------- |
| Push → UAT live (Pages deployed) | 14.6 min       | about 4.5 min (5.5 if the test part stays at 3.6 min) |
| Push → run green                 | 14.8 min       | about 5.5 min                                         |
| Dispatch → PRD done              | 2.0 to 7.9 min | about 2.5 min                                         |

## Risks

- **The commerce and CMS Durable Objects may run the previous code for minutes after a deploy** (Cloudflare: code updates are eventually consistent). The pipeline does not wait for them. API changes stay compatible with the previous release.
- **UAT can serve a candidate whose browser suites later fail.** The run is then red, and promotion refuses it.
- **Not yet measured:** how quickly the backend entry itself, rather than its Durable Object, serves a new version. The first hosted runs record it.
  - If the entry also lags for minutes, the follow-up is to drop the unused EmDash admin locales and MCP server from the 21.6 MB bundle.
  - Only after that would the staff and CMS Worker be split out.
