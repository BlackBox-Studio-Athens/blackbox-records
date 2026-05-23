## 1. Baseline

- [x] 1.1 Confirm hosted Renovate opened onboarding PR #1.
- [x] 1.2 Confirm the repository owner, default branch, and GitHub app mode.
- [x] 1.3 Inspect package manifests, workspace layout, GitHub workflows, and current validation commands.
- [x] 1.4 Confirm OpenSpec source of truth for tooling policy.

## 2. Renovate Configuration

- [x] 2.1 Replace the default onboarding config with repo-owned Renovate best-practices config.
- [x] 2.2 Configure semantic commit metadata, labels, concurrency, and hourly PR limits.
- [x] 2.3 Group compatible frontend, tooling, test, backend, persistence, Cloudflare, and workflow dependencies.
- [x] 2.4 Require dashboard approval for majors and runtime-sensitive groups.
- [x] 2.5 Add CI validation for `renovate.json`.
- [x] 2.6 Document hosted app setup, Scan and Alert caveats, and GitHub Issues dashboard limitation.

## 3. First Dependency Update

- [x] 3.1 Update direct npm dependencies to latest compatible published versions through pnpm.
- [x] 3.2 Preserve internal `workspace:*` dependency links.
- [x] 3.3 Keep TypeScript on the latest compatible 5.x line and document why TypeScript 6 is deferred.
- [x] 3.4 Keep pnpm on the latest compatible v10 line and document why pnpm 11 is deferred.
- [x] 3.5 Update GitHub Actions pnpm setup references to the latest compatible action/version pair.
- [x] 3.6 Repair source or type drift from package API changes.
- [x] 3.7 Regenerate API contracts when OpenAPI-adjacent packages change.

## 4. Verification

- [x] 4.1 Run `pnpm install --frozen-lockfile`.
- [x] 4.2 Run `pnpm renovate:validate`.
- [x] 4.3 Run `pnpm test:unit`.
- [x] 4.4 Run `pnpm check`.
- [x] 4.5 Run `pnpm build`.
- [x] 4.6 Run `pnpm audit:unused`.
- [x] 4.7 Run `pnpm outdated --recursive --format json` and confirm only documented compatibility deferrals remain.
- [x] 4.8 Run `openspec validate --all --strict`.
