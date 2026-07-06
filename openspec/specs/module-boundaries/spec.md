## Purpose

Specify the TypeScript-native application module boundary model and the machine-readable manifest used by audits.

## Requirements

### Requirement: Closed module boundaries

The system SHALL treat application modules as closed by default with explicit provided interfaces and named interfaces.

#### Scenario: Code imports another module

- **GIVEN** code in one application module needs another module
- **WHEN** it imports or calls that module
- **THEN** it targets the module's provided interface or approved named interface
- **AND** it does not deep-import another module's internal implementation.

### Requirement: Boundary manifest authority

The system MUST keep module ownership, entrypoints, allowed dependencies, statuses, and exceptions in the OpenSpec module-boundary manifest.

#### Scenario: Module ownership changes

- **GIVEN** a change updates module roots, entrypoints, allowed dependencies, or exception policy
- **WHEN** the change is made
- **THEN** `openspec/specs/module-boundaries/module-boundaries.manifest.json` and this spec are updated together when behavior changes.

#### Scenario: Shared UI primitive is added

- **GIVEN** a reusable UI foundation primitive must be consumed across closed application modules
- **WHEN** the primitive is added under `apps/web/src/components/ui/`
- **THEN** the primitive is listed as a provided `ui-foundation` entrypoint in `module-boundaries.manifest.json`
- **AND** feature modules import that entrypoint directly instead of deep-importing private UI foundation implementation.

#### Scenario: Route-local HTTP helper is added

- **GIVEN** public commerce HTTP route code needs a helper that is not a cross-module interface
- **WHEN** the helper is added under `apps/backend/src/interfaces/http/routes/`
- **THEN** the helper is listed under the owning `public-commerce-http` roots in `module-boundaries.manifest.json`
- **AND** it is not listed as a provided entrypoint unless another module is allowed to import it.

#### Scenario: Cart-scoped checkout route is added

- **GIVEN** cart-scoped checkout pages are added under `apps/web/src/pages/store/checkout/`
- **WHEN** boundary validation runs
- **THEN** those route files are owned by the closed `checkout-web` module
- **AND** item-scoped checkout compatibility pages stay owned by `checkout-web` until removed.

#### Scenario: Backend shared observability helper is added

- **GIVEN** backend modules need shared Worker-safe logging, tracing, or HTTP response helpers
- **WHEN** the helper is added
- **THEN** it is listed as a provided `platform-shared` entrypoint in `module-boundaries.manifest.json`
- **AND** feature modules import that entrypoint directly instead of deep-importing HTTP route internals.

### Requirement: Compatibility facades are disallowed

The system SHALL avoid temporary compatibility facades during boundary work unless a new OpenSpec change explicitly approves an exception.

#### Scenario: Boundary slice moves a caller

- **GIVEN** an internal module path is closed
- **WHEN** a caller must be migrated
- **THEN** the caller moves to the documented root entrypoint or named interface in the same slice.
