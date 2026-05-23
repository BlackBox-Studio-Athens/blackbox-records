## ADDED Requirements

### Requirement: Renovate owns routine dependency update PRs

The system SHALL use repository-owned Renovate configuration for routine dependency update detection and pull request creation.

#### Scenario: Renovate runs for the repository

- **GIVEN** the hosted Renovate GitHub App is installed for the repository owner
- **WHEN** Renovate evaluates the repository
- **THEN** it reads dependency update policy from `renovate.json`.

#### Scenario: Renovate config changes

- **GIVEN** Renovate configuration or package-manager metadata changes
- **WHEN** CI validates the change
- **THEN** the Renovate config validator runs before the change reaches `main`.

### Requirement: Dependency updates preserve compatibility groups

The system MUST keep dependency updates grouped by compatibility-sensitive ecosystem boundaries.

#### Scenario: Routine frontend and tooling packages update

- **GIVEN** Astro, React, Tailwind, TypeScript, lint, format, test, browser automation, or script-runner packages have compatible updates
- **WHEN** Renovate opens update PRs
- **THEN** related packages are grouped by ecosystem so peer and runtime mismatches can be reviewed together.

#### Scenario: Runtime-sensitive packages update

- **GIVEN** Cloudflare Worker, Prisma D1 persistence, backend API, commerce contract, GitHub Actions, or major-version packages have updates
- **WHEN** Renovate proposes the update
- **THEN** the update requires dashboard approval and is not automerged.

### Requirement: First update pass reaches latest compatible direct dependencies

The system SHALL verify the first Renovate adoption pass by updating direct dependency ranges to the latest compatible published versions available to pnpm.

#### Scenario: First local update pass completes

- **GIVEN** direct npm dependencies can be updated without breaking repository gates
- **WHEN** the first update pass finishes
- **THEN** `pnpm outdated --recursive --format json` reports no outdated direct dependencies except documented compatibility deferrals.

#### Scenario: Latest published versions have peer mismatches

- **GIVEN** a latest published package version creates a peer dependency mismatch with repo-owned tooling
- **WHEN** the first update pass is completed
- **THEN** the repo stays on the latest compatible version and documents the deferral.

#### Scenario: Package manager major is not compatible yet

- **GIVEN** the latest package-manager major cannot consume the current lockfile because of its supply-chain or compatibility policy
- **WHEN** the first update pass is completed
- **THEN** the repo stays on the latest compatible current major and documents the deferral.
