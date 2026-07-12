## Context

The repository now has one completed performance implementation and one fresh post-implementation audit. The completed change, `improve-site-runtime-performance`, is archived at `../archive/2026-07-12-improve-site-runtime-performance/`; its deltas are now part of the baseline specs. The audit found that the first round fixed several large costs but that realistic first traversal, font relayout, secondary-route LCP, route-independent JavaScript, and dormant animation work remain.

OpenSpec 1.6 has no parent-child or change-dependency primitive. A custom schema would add maintenance without creating those relationships. The native model is one normal `spec-driven` umbrella change whose proposal, design, spec, and tasks register independent child changes by stable ID. Each child keeps its own complete artifact graph and archive lifecycle.

Current program register:

| Round | Change ID                                    | State                 | Evidence                           |
| ----- | -------------------------------------------- | --------------------- | ---------------------------------- |
| 1     | `improve-site-runtime-performance`           | Implemented, archived | `PERF-001`, `PERF-002`             |
| 2     | `improve-site-runtime-performance-round-two` | Planned               | Implementation report remains open |

## Goals / Non-Goals

**Goals:**

- Keep one ordered, OpenSpec-native index of all site performance rounds.
- Preserve every child proposal, design, delta spec, task plan, result, and archive as an independent review unit.
- Keep an append-only ledger of implementation and formal verification reports.
- Make cross-round comparisons method-honest and explicit about field-data confidence.
- Let future performance rounds be added without redesigning the planning structure.

**Non-Goals:**

- No mega-change that implements every performance round inside the epic.
- No copying of child proposals, designs, specs, or task lists into the epic.
- No custom OpenSpec schema, external issue tracker, report database, or telemetry backend.
- No website, API, commerce, hosting, dependency, or content behavior change from the epic itself.
- No claim that unlike environments, devices, cache states, routes, or scroll scripts form a like-for-like improvement comparison.

## Decisions

### Use a portfolio change with independent children

`site-performance-program` remains the durable portfolio. Its task list records child order, prerequisite state, reporting, and closure. Every implementation round is a separate `spec-driven` change and remains independently applicable, reviewable, revertible, and archivable.

This uses OpenSpec's native artifact graph for the work that benefits from it while avoiding a custom imitation of unsupported parent-child metadata.

Alternatives considered:

- Put all future work into one growing implementation change: rejected because completed tasks, active work, deltas, and reports would become inseparable.
- Copy each child plan under the epic: rejected because duplicate source-of-truth artifacts drift.
- Add a custom schema or JSON relationship registry: rejected because OpenSpec still would not enforce child execution and the extra structure would need custom tooling.

### Use explicit sequencing, not implied dependency

Each child names its predecessor and epic in its design. The epic tasks enforce this order:

1. Archive the previous completed child so its delta specs become baseline.
2. Create and strict-validate the next child against that baseline.
3. Apply one child at a time.
4. Verify and append its report before the child is archived.
5. Start another child only from new measured evidence.

Round one has completed step 1. Round two may now modify the baseline `frontend-runtime-performance` requirements without competing active deltas.

### Keep one append-only report ledger

`performance-report-log.md` is the durable index. Every entry receives a stable `PERF-NNN` identifier and records date, report type, implementation round, child change ID, tested commit, profile, outcome, field-data confidence, report location, comparison class, and follow-up.

Detailed reports remain Markdown evidence. The round-one implementation report stays with its archived child. The fresh independent audit is stored under this epic because it created the next program decision. Archive moves may update a report location, but existing report IDs, measurements, conclusions, and history are never deleted or rewritten.

Alternatives considered:

- Keep only raw trace folders: rejected because `.codex-artifacts` is diagnostic storage, not a durable human-readable decision record.
- Put every metric directly in `tasks.md`: rejected because task state and performance evidence have different lifecycles.
- Add a spreadsheet or observability service: rejected because the current evidence volume is small and no privacy-approved field pipeline exists.

### Separate lab, field, and user-perceived evidence

Reports distinguish field Core Web Vitals, controlled cold load, controlled first and repeat scroll, rendered interaction/accessibility checks, and bounded diagnostics. Field status remains unavailable without a representative privacy-approved sample. Lab results cannot become a field pass. First traversal is separate from repeat traversal because warmed layout can hide the experience a user first encounters.

### Close children, keep the program open

A child is complete only when its tasks, focused regression coverage, repository gates, rendered acceptance, before/after evidence, report entry, and strict OpenSpec validation are complete. The child is then archived and its deltas become baseline.

The epic remains open while more rounds are expected. It closes only when the owner declares the program finished, no child remains active, all completed children are archived, and every implementation has a report entry.

## Risks / Trade-offs

- **A long-lived epic can become stale** -> Update its register and ledger in the same change that creates or closes a performance child.
- **Archived paths change** -> Treat the child change ID and `PERF-NNN` as stable identity; update only the location field when an archive moves the source artifact.
- **Different profiles can create false improvement claims** -> Label comparisons as like-for-like, directional, or incomparable and retain raw profile metadata.
- **The epic could become a second source of runtime requirements** -> Keep runtime behavior in child delta specs; the epic owns only program governance and evidence lifecycle.
- **More rounds can turn into an endless optimization sweep** -> Require a measured user-facing miss and a bounded child before adding work.

## Migration Plan

1. Archive round one with spec synchronization. Completed on 2026-07-12.
2. Register `PERF-001`, the round-one implementation report.
3. Store and register `PERF-002`, the fresh post-round-one audit.
4. Create and strict-validate `improve-site-runtime-performance-round-two` against the synchronized baseline.
5. Apply round two one measured slice at a time, with first traversal as the critical scroll gate.
6. Append the round-two implementation report and update the epic register before archiving the child.
7. Repeat the same intake and closure sequence only when later evidence justifies another child.

Rollback is documentation-only: remove an unimplemented child registration and its proposed artifacts. Historical report entries and archived completed children are never rolled back or erased.

## Open Questions

None for planning. Any future custom field telemetry, list virtualization, service worker, CDN/DAM, framework migration, or new performance dependency requires a separate evidence-backed child decision.
