# Fast release path

## Why

Releases are too slow. On 2026-10-06, push run `37537450513` took 14.8 minutes to deploy UAT, and promotion `37539133505` took 7.9 minutes to deploy PRD. The user's targets are at most 5 to 7 minutes from a push to UAT, and at most 3 to 5 minutes from a promotion dispatch to PRD.

Two causes account for almost all of the time:

- **A poll that waits on the Durable Object, not the Worker.** `release-candidate.mjs verify-worker` reads the backend identity from the `OPTIONS /api/store/capabilities` preflight. The deployed backend entry (`apps/backend/src/cms-worker.ts`) forwards every `/api/*` request, including that preflight, to the `CommerceRuntime` `store` Durable Object. Commit `932aaca2` assumed the entry answers it, but only the undeployed commerce-only entry `src/index.ts` does.
  - Durable Object code updates are eventually consistent ("seconds to minutes"), so the poll waited 5:23 on UAT and about 5:40 on PRD.
  - Pages, and with it the UAT or PRD release, waited behind that poll.
- **Every browser suite gates the UAT deploy.** The deploy waited 6:46 for the slower e2e shard. Shard 2 holds every Firefox test (992 s of test time against 544 s).

## What Changes

- The backend entry answers `OPTIONS /api/*` itself (excluding `/api/internal/*`), so `verify-worker` reads the entry's release identity. The Durable Object is not involved.
- Deploy jobs deploy the Workers and then Pages straight away. Only after that do they verify the Worker identity, listing readiness and the hosted release. The Worker poll budget drops from 10 to 2 minutes. The `/` identity check bypasses the renderer's 30-second edge cache.
- UAT deploy waits for the build and all static checks: lint, typecheck and unit tests. The end-to-end suite and the staff previews still run on every push, in parallel with the deploy, and promotion still requires every one of them to have passed.
- The checks run as three parallel parts (lint, typecheck and tests). The end-to-end suite runs in four shards and the staff previews in one job per browser, so the push run turns green soon after UAT is live.
- Remove the backend `deploy:prd` package script, which would deploy the commerce-only entry over the PRD backend.

## Capabilities

### Modified Capabilities

- `software-release-promotion`: UAT deployment waits for the checks and the build. The browser suites gate promotion. The deploy order is migrate, Workers, Pages, identity checks, then smoke.
- `static-site-and-deployment`: the UAT Pages deploy no longer presupposes passed browser suites.

## Impact

Affected areas:

- `.github/workflows/pages.yml` and `promote-prd.yml`
- `scripts/release-candidate.mjs`
- `scripts/validate.mjs`
- `apps/backend/src/cms-worker.ts`
- the release docs, `feedback-policy.json` wording, and the agent acceptance matrix

There is no data, provider or Free-tier quota change. Polling requests fall from about 65 Worker and 65 Durable Object requests per deploy to a few.
