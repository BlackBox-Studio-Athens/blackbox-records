# Tasks

## 1. Wheel ownership

- [x] 1.1 Extend controller regressions for consumed and browser-owned input; observe failure before the fix and passing focused tests afterward.
- [x] 1.2 Consume preview wheel input across covers and gaps on the enclosing surface, stop propagation, and clean up the registered listeners; verify thresholds, repeat timing, and passthrough behavior remain covered.
- [x] 1.3 Add real-wheel regressions for All Store and Distro; verify cover and stage-gap navigation holds page position for 750ms and scrolling resumes outside the stage and in Grid.

## 2. Acceptance

- [x] 2.1 Run the Store formats browser suite, strict OpenSpec validation with the worktree opt-in, and final `pnpm validate`; record source identity, fingerprints, results, and artifact paths in validation.md.
