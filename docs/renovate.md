# Renovate

Renovate is configured from the repository-owned `renovate.json` file.

The hosted Mend Renovate GitHub App must also be installed for the GitHub owner that owns this repository. The app was manually configured in Mend.io Scan and Alert mode on 2026-05-23.

If hosted Renovate does not open onboarding, reconfigure, update PRs, or a Dependency Dashboard after `renovate.json` reaches the default branch, check the Mend.io repository mode first. Scan and Alert mode may report dependency state without opening the same update PR flow as full Renovate automation.

Hosted app verification on 2026-05-23:

- GitHub repository: `BlackBox-Studio-Athens/blackbox-records`
- Default branch: `main`
- Renovate opened onboarding PR [#1](https://github.com/BlackBox-Studio-Athens/blackbox-records/pull/1), `chore: Configure Renovate`, from `app/renovate`.
- GitHub Issues are disabled for the repository, so Renovate cannot use an issue-based Dependency Dashboard unless Issues are enabled.

First local update pass on 2026-05-23:

- `pnpm outdated --recursive --format json` reported only the documented TypeScript 6 deferral after the direct dependency update.
- Internal `workspace:*` links were preserved.
- Prisma packages did not change, so Prisma client regeneration was not required.
- Hono/Zod/OpenAPI-adjacent packages changed, so `pnpm generate:api` was rerun.
- TypeScript stayed on `5.9.3` because `openapi-typescript@7.13.0` still declares a `typescript@^5.x` peer range.
- pnpm `11.2.2` was checked but deferred because pnpm 11 rejected the existing lockfile while `@cloudflare/workers-types@4.20260523.1` was still inside its release-age policy window.
- `pnpm audit:unused` remains report-only and produced owner-review findings; no cleanup was performed as part of the dependency update.
- Renovate onboarding PR #1 was opened before the repo-owned config in this branch existed; prefer this branch's `renovate.json` over merging the default onboarding config as-is.

Local config validation:

```powershell
pnpm renovate:validate
```
