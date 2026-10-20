# Validation

## Preparation state

The owner approved the complete behavior brief and requested implementation on 19 October 2026. The approved plan retains Claude ownership for UI interactions and their tests. Codex prepared the change and [handoff](handoff.md); no UI implementation or Claude process has started in this preparation.

- Product Environment: Local records only.
- Checkout: `C:/Users/SVall/WebstormProjects/blackbox-records`, branch `main`.
- Source HEAD: `59f20954c1ea5b6c33024777e9a80368e4aac85b`.
- Preservation baseline: `.codex-artifacts/unify-navigation-history/preservation-before.json` (25 existing dirty files and 1,296 tracked source files).
- Graph evidence: focused Graphify explanations for public popstate/surface history and Staff navigation, and CodeGraph source/caller inspection during planning. No code edit batch exists to refresh.
- Design approval: public and Staff; deliberate browsing steps; existing controls; 500 ms/Enter/blur search grouping; internal modal traversal; explicit dismissal consumes the modal group and retains final choices. Separate user confirmation approved the brief.

## Preparation checks

- `pnpm openspec:guard`: passed on primary `main` before artifact creation.
- `pnpm openspec -- validate unify-navigation-history --type change --strict`: passed for both capability deltas. All four required planning artifacts exist; that status does not mean implementation is complete.
- `pnpm validate`: passed in `mode: local`, exit 0, 27.1 seconds. Summary: `.codex-artifacts/validation/2026-10-19T13-03-29-390Z-38916-fb9df3/summary.json`. Before/after source fingerprints both `02ac72de0f3693d5ff1f45e6a942f37bd0eadb24a247e7f9a4a24bca5551140c`; `sourceChanges: []`. Formatting changed only this change's design.md.
- Preservation comparison: all 25 pre-existing dirty files and all 1,296 protected source files match the preparation baseline; no source implementation or UI tests were edited. `git diff --check` also passed.
- The ignored `.codex-artifacts/unify-navigation-history/preparation-result.json` records the final post-record validation pointer and preservation comparison. Historical validation evidence from other changes is not reused as acceptance for this change.
- Graphify refresh is not applicable to this preparation: no meaningful code batch or pull/merge occurred. The UI owner must refresh after implementation.

## Remaining implementation acceptance

All implementation groups in [tasks](tasks.md) remain open. The existing completed `back-closes-shell-surfaces` evidence covers narrower historical behavior and does not certify this change.

Required rows are shell/player/routing and Staff/editor, plus architecture/boundaries if actual public module interfaces change. Commerce behavior is protected by read-only restoration and no-replay assertions; no commerce authority change or provider mutation is planned. Software Release and Content Publication are outside this request.

No new browsing behavior, browser/device Back gesture, accessibility, physical phone, cross-origin playback, provider, UAT or PRD acceptance is established by these records. Record actual implementation identity, required tests, browser observations, stable validation fingerprint and limitations here when Claude returns.
