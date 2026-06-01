## ADDED Requirements

### Requirement: Astro Upgrade Compatibility Is Verified

The system SHALL verify Astro upgrade compatibility across the frontend build/runtime dependency graph before an Astro upgrade is accepted.

#### Scenario: Astro package versions are selected

- **GIVEN** an Astro upgrade is implemented
- **WHEN** package manifests and the lockfile are changed
- **THEN** the selected `astro` version matches the confirmed latest stable target for the change
- **AND** official Astro companion packages are updated only when they are part of the compatibility set
- **AND** unrelated dependencies remain unchanged unless validation exposes a direct compatibility issue.

#### Scenario: Peer and runtime compatibility are checked

- **GIVEN** an Astro upgrade changes dependency manifests or the pnpm lockfile
- **WHEN** compatibility validation runs
- **THEN** it verifies Astro, the official React integration, `@astrojs/check`, Astro lint/format tooling, Vite, Tailwind Vite integration, Node, and CI workflow runtime compatibility
- **AND** it verifies the lockfile does not introduce duplicate Astro or incompatible Vite lines.

#### Scenario: Repository gates prove the upgrade

- **GIVEN** an Astro upgrade is complete
- **WHEN** validation runs
- **THEN** `pnpm test:unit`, `pnpm check`, `pnpm build`, and `pnpm audit:unused` pass before completion is claimed.
