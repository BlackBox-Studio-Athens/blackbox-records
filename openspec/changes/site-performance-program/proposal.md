## Why

Performance work now spans multiple measured implementation rounds. A durable OpenSpec epic is needed to preserve their order, evidence, decisions, and before/after reports without copying child plans or losing the distinction between lab findings and field results.

## What Changes

- Establish one long-lived Site Performance Program that registers each performance child change by stable OpenSpec change ID.
- Register the completed first round, `improve-site-runtime-performance`, and its implementation report without rewriting its history.
- Register the second round, `improve-site-runtime-performance-round-two`, which addresses the fresh post-round-one audit with first traversal as the critical scroll experience.
- Add an append-only performance report log and retain a detailed report for every implementation or formal post-implementation audit.
- Require each child to own its proposal, design, specs, tasks, verification, and archive lifecycle while the epic owns order, status, and cross-round evidence.
- Define a repeatable future-round intake rule: measure, compare like-for-like, create a bounded child, implement, remeasure, append the report, then archive.

## Capabilities

### New Capabilities

- `performance-program`: Defines the OpenSpec-native portfolio, child-change registry, sequencing, report ledger, comparison discipline, and completion rules for recurring site performance work.

### Modified Capabilities

None. Runtime behavior remains owned by the registered child changes and their capability deltas.

## Impact

- OpenSpec: adds a program-level proposal, design, capability spec, task ledger, append-only report log, and linked report evidence.
- Existing history: keeps `improve-site-runtime-performance` intact and links to its canonical archived artifacts instead of duplicating them.
- Runtime: no website, API, dependency, content, hosting, or commerce behavior changes are authorized by this epic alone.
- Workflow: future performance work gains one durable index while each implementation remains independently reviewable, measurable, reversible, and archivable.
