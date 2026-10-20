## ADDED Requirements

### Requirement: Agents load guidance by task and module

Agents SHALL retain essential project constraints at the entry point and explicitly load relevant local guidance before changing its owned files. Module guidance SHALL supplement executable ownership and contract policy.

#### Scenario: Root-started change touches a nested module

- **WHEN** an agent starts at repository root and changes a nested owned module
- **THEN** it resolves actual ownership, reads that module's applicable guide and uses existing focused checks without assuming a parent module or nonexistent target

### Requirement: Implementation ownership supports task-scoped overrides

UI implementation and UI tests SHALL default to Claude; non-UI implementation and tests SHALL default to Codex. An explicit prompt SHALL override only its named task. Either agent MAY investigate/review read-only or run existing checks.

#### Scenario: Codex coordinates mixed implementation

- **WHEN** a task contains both UI and non-UI changes without an override
- **THEN** Codex prepares a user-passed Claude UI handoff, completes independent non-UI work and verifies returned evidence before integration
