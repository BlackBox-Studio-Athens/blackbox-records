## ADDED Requirements

### Requirement: Performance work is organized as an ordered OpenSpec portfolio

The program SHALL maintain one ordered register of independently planned, implemented, verified, and archived site performance changes.

#### Scenario: A performance child is registered

- **WHEN** measured evidence justifies a new performance implementation round
- **THEN** the epic records the child's stable OpenSpec change ID, outcome scope, predecessor, state, and report status
- **AND** the child owns a complete native proposal, design, delta-spec, and task artifact graph.

#### Scenario: A child changes requirements introduced by its predecessor

- **WHEN** a completed child introduced or modified requirements needed by the next child
- **THEN** the completed child is synchronized and archived before the next child is applied
- **AND** the next child is strict-validated against the resulting baseline specs.

### Requirement: Performance children remain independently executable

The program MUST keep each implementation round independently reviewable, measurable, reversible, and archivable.

#### Scenario: A child is applied

- **WHEN** implementation begins for a registered child
- **THEN** work follows that child's tasks and delta specs rather than an implementation checklist copied into the epic
- **AND** unrelated future rounds do not expand the active child's scope.

#### Scenario: A child closes

- **WHEN** all child tasks and acceptance gates pass on the exact final tree
- **THEN** its implementation report is registered in the epic
- **AND** its OpenSpec artifacts are strict-valid before the child is archived.

### Requirement: Performance reports have stable, append-only history

The program SHALL maintain an append-only report ledger covering every completed implementation and every formal post-implementation audit that changes program direction.

#### Scenario: An implementation report is registered

- **WHEN** a performance child completes implementation
- **THEN** the ledger assigns a stable report ID and records the date, report type, child change ID, tested commit, environment, profile summary, outcome, field-data confidence, and detailed report location
- **AND** the entry identifies any accepted follow-up child.

#### Scenario: A formal verification report is registered

- **WHEN** a fresh audit remeasures a completed implementation and changes the program backlog
- **THEN** the ledger records it as a separate report instead of overwriting the implementation report
- **AND** the detailed report explains what improved, what remains, and which comparisons are or are not like-for-like.

#### Scenario: A child is archived

- **WHEN** archival moves a linked report artifact
- **THEN** the ledger may update the artifact location
- **AND** the report ID, measurements, conclusions, and prior history remain unchanged.

### Requirement: Cross-round performance claims remain method-honest

The program MUST distinguish like-for-like comparisons from directional or incomparable evidence.

#### Scenario: Two reports use the same profile

- **WHEN** route, environment, build mode, viewport, DPR, CPU/network settings, cache state, scroll input, browser method, and run count are equivalent
- **THEN** the report may calculate and state a direct before/after change.

#### Scenario: Two reports use different profiles

- **WHEN** any material profile dimension differs
- **THEN** the report labels the comparison as directional or incomparable
- **AND** it does not present the difference as an implementation improvement percentage.

#### Scenario: Field evidence is unavailable

- **WHEN** no representative privacy-approved rolling field sample exists
- **THEN** the report labels field status unavailable or low-confidence
- **AND** lab evidence is not used to claim a field Core Web Vitals pass.

### Requirement: Future rounds start from measured user-facing misses

The program SHALL create future performance children only from reproducible user-facing evidence and the smallest bounded remedy set.

#### Scenario: A new issue is proposed for the program

- **WHEN** a maintainer identifies a possible performance optimization
- **THEN** the issue is measured on a representative route and profile before it becomes a child task
- **AND** the child names the responsible loading, scripting, style, layout, paint, raster, animation, or network work.

#### Scenario: Existing gates pass

- **WHEN** a proposed optimization has no repeatable budget miss or material user-perceived cost
- **THEN** the program records no action
- **AND** it does not add speculative infrastructure, dependencies, or architecture changes.

### Requirement: The performance program has an explicit closure condition

The program SHALL remain active while additional rounds are expected and SHALL close only by explicit owner decision.

#### Scenario: One child completes while future work is expected

- **WHEN** the current performance child is reported and archived
- **THEN** the epic remains open
- **AND** no speculative next child is created without fresh evidence.

#### Scenario: The program is closed

- **WHEN** the owner declares the performance program finished
- **THEN** no registered child remains active
- **AND** every completed implementation is archived and represented in the report ledger.
