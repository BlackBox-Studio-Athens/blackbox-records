## MODIFIED Requirements

### Requirement: Staff frontend is composed of closed feature modules

The `staff-frontend` composition root SHALL consume closed `staff-*` modules for the shared UI primitives, platform helpers, order, stats, publication, shell, stock and content features. Each module MUST declare its root, task inputs and test target in its own Nx `project.json`, and module dependencies MUST stay acyclic.

#### Scenario: Staff modules are layered

- **WHEN** boundary validation runs
- **THEN** layering runs `staff-ui` ← `staff-platform` ← {`staff-orders`, `staff-stats`, `staff-publication`} ← {`staff-shell`, `staff-stock`} ← `staff-content` ← `staff-frontend`
- **AND** `staff-ui` has no staff dependencies, `staff-platform` may use `staff-ui`, and `staff-orders`, `staff-stats` and `staff-publication` may use `staff-ui` and `staff-platform`
- **AND** `staff-shell` and `staff-stock` may use `staff-ui`, `staff-platform` and `staff-publication`
- **AND** `staff-content` may use `staff-ui`, `staff-platform`, `staff-publication` and `staff-stock`
- **AND** `staff-frontend` may use every staff module, and declares them as implicit Nx dependencies because Astro imports are invisible to static analysis.

#### Scenario: Shell and stock stay independent of the content editor

- **WHEN** a staff shell or stock file is added or changed
- **THEN** it does not import `staff-content`
- **AND** publication behavior shared with the editor lives in `staff-publication`.

#### Scenario: Internal API client access is narrow

- **WHEN** a staff module needs `@blackbox/api-client`
- **THEN** only `staff-platform` and `staff-orders` consume the `./internal` export
- **AND** no staff module consumes another `@blackbox/api-client` export.

#### Scenario: Staff module tests run independently

- **WHEN** a maintainer runs `pnpm test <staff-module>` or `pnpm test:watch <staff-module>` for a module with tests
- **THEN** that module's own Nx test target runs only its test files
- **AND** `staff-ui` and `staff-frontend` have no test target
- **AND** every staff test file has exactly one owning module.
