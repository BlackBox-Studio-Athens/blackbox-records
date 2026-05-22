# Phase 16: Adopt Robot For Player Session Machine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `16-CONTEXT.md`; this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 16-adopt-robot-for-player-session-machine
**Mode:** automatic `gsd-discuss-phase --auto`
**Areas discussed:** library choice, behavior preservation, test boundary

---

## Library Choice

| Option                   | Description                                                            | Selected |
| ------------------------ | ---------------------------------------------------------------------- | -------- |
| Robot/robot3             | Small finite-state-machine library matching the current reducer scale. | yes      |
| XState                   | Larger statechart/actor library for complex orchestration.             | no       |
| Keep hand-rolled reducer | Avoid dependency but keep current custom machine.                      | no       |

**Auto choice:** Robot/robot3.

---

## Behavior Preservation

| Option                    | Description                                             | Selected |
| ------------------------- | ------------------------------------------------------- | -------- |
| Strict preservation       | Keep existing event behavior and UI semantics.          | yes      |
| Expand states             | Use migration to add new loading/error/provider states. | no       |
| Rewrite player controller | Move all player lifecycle into a new service now.       | no       |

**Auto choice:** Strict preservation.

---

## Test Boundary

| Option                  | Description                        | Selected |
| ----------------------- | ---------------------------------- | -------- |
| Characterization-first  | Existing tests define acceptance.  | yes      |
| Browser-first           | Rely primarily on rendered checks. | no       |
| Broad app-shell rewrite | Touch adjacent shell modules.      | no       |

**Auto choice:** Characterization-first.

## the agent's Discretion

Whether to keep the reducer adapter or migrate callers directly to a Robot service after tests are stable.

## Deferred Ideas

XState, new player states, backend state-machine changes, and waveform features.
