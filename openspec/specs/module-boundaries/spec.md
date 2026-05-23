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

### Requirement: Compatibility facades are disallowed

The system SHALL avoid temporary compatibility facades during boundary work unless a new OpenSpec change explicitly approves an exception.

#### Scenario: Boundary slice moves a caller

- **GIVEN** an internal module path is closed
- **WHEN** a caller must be migrated
- **THEN** the caller moves to the documented root entrypoint or named interface in the same slice.
