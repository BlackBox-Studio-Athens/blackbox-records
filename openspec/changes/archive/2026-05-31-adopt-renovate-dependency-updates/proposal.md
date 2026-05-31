## Why

The repository now has enough moving dependency surface across Astro, React, Tailwind, Cloudflare Workers, Prisma, Stripe, OpenAPI, tests, and GitHub Actions that manual updates are too easy to batch unsafely or defer too long.

Renovate should own routine dependency detection and pull request creation, while the repo continues to require local validation gates and owner approval for compatibility-sensitive runtime groups.

## What Changes

Adopt repository-owned Renovate configuration and validate it in CI.

The first implementation slice will:

- Replace the default hosted Renovate onboarding config with a repo-owned `renovate.json`.
- Configure modern Renovate presets, semantic commit metadata, labels, grouping, and dashboard approval rules.
- Add CI validation for the Renovate config.
- Document the hosted Mend Renovate GitHub App setup and current Scan and Alert caveats.
- Run the first direct dependency update locally with compatibility-sensitive package groups considered together.
- Preserve `workspace:*` links and existing repo validation gates.

The change does not approve automatic merging for runtime, persistence, commerce, Cloudflare, or GitHub Actions dependency groups.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `tooling-validation`: Adds Renovate ownership and compatibility-aware dependency update policy.

## Impact

- Touches root Renovate config, GitHub Actions, docs, package manifests, and lockfile.
- May require source updates for dependency API changes discovered by `pnpm check`.
- Hosted Renovate behavior still depends on the Mend.io repository mode and GitHub app permissions.
- GitHub Issues are disabled, so the issue-based Dependency Dashboard cannot appear unless Issues are enabled.
