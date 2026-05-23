## ADDED Requirements

### Requirement: Execa adoption is narrow

The system SHALL adopt Execa where it removes meaningful process orchestration complexity from repo-owned development scripts without changing documented commands.

#### Scenario: Script process handling is refactored

- **GIVEN** a script manages subprocess execution, readiness, ports, signals, or stdio
- **WHEN** Execa is introduced
- **THEN** documented command behavior, Windows compatibility, and tests remain stable.

### Requirement: Shared local process helper is introduced first

The system SHALL introduce a shared local process helper before refactoring multiple local process orchestration scripts.

#### Scenario: Local stack execution is refactored

- **GIVEN** the local stack launcher manages finite preparation commands and long-running service commands
- **WHEN** the launcher is refactored to Execa
- **THEN** shared process lifecycle behavior is moved into a repo-local helper while local-stack-specific command planning remains in the launcher.

### Requirement: Launcher and secret behavior are preserved

The system MUST preserve WebStorm launcher targets, package script names, port-failure behavior, long-running process lifecycle, and secret redaction.

#### Scenario: Local stack script changes

- **GIVEN** a refactor touches local stack or stripe-mock orchestration
- **WHEN** validation runs
- **THEN** command planning, failure handling, and redacted output remain equivalent for users.

#### Scenario: Long-running script changes

- **GIVEN** a refactor changes a long-running local script
- **WHEN** the automated checks pass
- **THEN** manual launcher validation is still required before the change is considered complete.

### Requirement: Local stack remains the first high-value target

The system SHALL refactor `scripts/start-local-stack.ts` before lower-complexity process scripts unless implementation evidence shows the helper cannot preserve current local-stack behavior.

#### Scenario: First Execa-backed script is selected

- **GIVEN** multiple scripts use hand-rolled child-process orchestration
- **WHEN** this change starts implementation
- **THEN** the first target is the local stack launcher because it contains the highest-value mix of finite commands, long-running processes, ports, readiness, signals, and WebStorm launcher behavior.
