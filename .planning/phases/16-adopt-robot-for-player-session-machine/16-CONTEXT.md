# Phase 16: Adopt Robot For Player Session Machine - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning
**Source:** Automatic `gsd-discuss-phase 16 --auto` from dependency-adoption request

<domain>
## Phase Boundary

Phase 16 replaces the hand-rolled app-shell player session reducer with the latest `robot3` package while preserving the existing player modal, miniplayer, iframe interaction, reopen, and stop behavior. It is a frontend app-shell/player implementation slice only.

</domain>

<decisions>
## Implementation Decisions

### Library Choice

- **D-01:** Use `robot3`, not XState, for this replacement because the current state model is small and already reducer-like.
- **D-02:** Use the latest published package version at implementation time; `pnpm view robot3 version` returned `1.2.0` on 2026-05-22.
- **D-03:** Keep the public app-shell/player APIs stable unless a type export must change to reflect Robot internals.

### Behavior Preservation

- **D-04:** Preserve current no-op behavior for invalid events.
- **D-05:** Preserve current mini-player eligibility: an opened session must load and the embed surface must be interacted with before dismissing can minimize.
- **D-06:** Preserve current close semantics: dismissing before interaction destroys the session.
- **D-07:** Preserve reopen and stop semantics.
- **D-08:** Do not add new player states or provider behavior in this phase.

### Test Boundary

- **D-09:** Existing `player-session-machine` tests are characterization tests and must pass after the replacement.
- **D-10:** Run app-shell/player focused tests before the full repo gate.
- **D-11:** Browser Use validation is required only if this phase changes rendered player UI or event wiring beyond the reducer seam.

### the agent's Discretion

The agent may choose whether to expose a thin adapter function named `reducePlayerSessionMachine` over Robot or migrate callers to a Robot service directly, provided the behavior and tests stay stable.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Player State

- `apps/web/src/components/app-shell/player-session-machine.ts` - current hand-rolled reducer.
- `apps/web/src/components/app-shell/player-session-machine.test.ts` - characterization tests.
- `apps/web/src/components/app-shell/player-shell/shell-player-session-controller.ts` - caller seam.
- `apps/web/src/components/app-shell/player-shell/shell-player-session-machine-state.ts` - active session state derivation.

### Prior Architecture

- `.planning/phases/12-modulith-boundary-hardening-planning/12-CONTEXT.md` - boundary-hardening context.
- `.planning/phases/12-modulith-boundary-hardening-planning/12-23-PLAN.md` - prior player session-machine boundary slice.
- `.planning/phases/08-webhook-orders-and-inventory/08-CONTEXT.md` - prior rejection of Robot/XState for backend order state; this phase does not reopen backend order-state decisions.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- The current reducer is small and already expresses a finite state transition surface.
- Tests exercise the exact modal/miniplayer semantics that must survive.

### Established Patterns

- App-shell state helpers are small, tested modules.
- The repo prefers behavior-preserving refactors with focused characterization tests.

### Integration Points

- `shell-player-session-controller.ts` dispatches the events that Robot must model.
- `derivePlayerPresentationState` consumes the derived status shape.

</code_context>

<specifics>
## Specific Ideas

Start with an adapter-preserving migration: add Robot internally but keep `reducePlayerSessionMachine(state, event)` as the call-site API until the behavior is proven.

</specifics>

<deferred>
## Deferred Ideas

- XState visual modeling.
- New player provider states.
- Backend order-state machine changes.
- Waveform/audio preview features.

</deferred>

---

_Phase: 16-Adopt Robot For Player Session Machine_
_Context gathered: 2026-05-22_
