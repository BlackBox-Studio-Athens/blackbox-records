# Claude implementation handoff

Implement `unify-navigation-history` to completion: browser/device Back and Forward must restore the approved public and Staff browsing context. The user approved the brief and explicitly requested implementation. UI interaction and its tests retain Claude ownership; no backend slice or additional product decision is pending.

## Checkout and source

- Use `C:/Users/SVall/WebstormProjects/blackbox-records`, branch `main`, prepared at `59f20954c1ea5b6c33024777e9a80368e4aac85b`. Do not use the chat's detached `3066` checkout or create another branch/worktree.
- Read current root instructions and applicable module guides/boundary metadata. Run `pnpm openspec:guard` before edits and use the guarded `pnpm openspec -- ...` commands.
- Preserve unrelated agent-guidance/release work. The receipt `C:/Users/SVall/WebstormProjects/blackbox-records/.codex-artifacts/unify-navigation-history/preservation-before.json` hashes all 25 pre-existing dirty files and 1,296 tracked source files. Reconcile drift before editing; do not reset another agent's changes.

## Canonical contract and owned work

Read [proposal](proposal.md), [design](design.md), [tasks](tasks.md), both [public](specs/app-shell-and-player/spec.md) and [Staff](specs/staff-workspace/spec.md) deltas and [validation](validation.md). Follow the design's integration map across existing history owners, public browsing surfaces and Staff workspaces. One writer owns shared files at a time; Codex currently edits records only and has not started a Claude process.

Use the current helpers, not another router or dependency. Record each deliberate browsing choice; group search commits at 500 ms/Enter/blur separately from live results. Back retraces modal edits; Close/Escape/backdrop exits that group and keeps final choices. Navigation away from a modal or phone Menu preserves it as the preceding view. Restore background → choices → ordered surfaces → scroll/focus, including repeated URLs and lazy mounts. Named Staff returns retain their destination meaning.

Preserve current cart/commerce state, draft buffers, autosave/conflict/unfinished-stock/recovery guards and connected player iframe/minimize/Stop semantics. Restore browsing and current valid presentation, never old transactions or stopped playback. Keep checkout/provider documents native. Record no draft or operation payloads in history metadata.

The approved existing visual design stays in place. Impeccable's task-specific shape is already approved; image probes were skipped because this changes behavior without a new visual surface. Read current product/design context and apply the preflight before UI edits. No repeat design approval is needed unless the implementation changes the approved UX scope.

## Acceptance and delivery

Use focused `pnpm test <module|file>` while editing and the existing browser fixtures. Cover the task-specific failures as each slice lands, then the integrated list/modal/item return, internal-filter history, nested dismissal, stale callbacks, repeated URLs, reload, Staff save/recovery and player-continuity journeys. Use `chromium-mobile`/`webkit-mobile` for phone acceptance and current desktop engines; Staff's existing fixture covers Chromium/Firefox at the required widths. Respect feedback-policy grants for whole editor suites; never obtain a maintainer grant yourself.

Preparation evidence is in validation.md. It proves records/preservation only. Run strict change validation, Graphify refresh after the code batch and final `pnpm validate` with matching before/after source fingerprints. Record browser/device limits separately. Keep tasks unchecked until their stated implementation and evidence exist.

Save results to `C:/Users/SVall/WebstormProjects/blackbox-records/.codex-artifacts/unify-navigation-history/claude-result.json`: outcome, exact HEAD/source fingerprint, changed paths, commands/results and artifact paths, browser/device acceptance, preservation comparison and remaining tasks. Update canonical validation.md/tasks.md. Codex will inspect returned changes and evidence before integration.

Local edits and acceptance only. No commit, push, deployment, Content Publication, new credentials or hosted operations are authorized.

Read and carry out `C:/Users/SVall/WebstormProjects/blackbox-records/openspec/changes/unify-navigation-history/handoff.md`; save results to `C:/Users/SVall/WebstormProjects/blackbox-records/.codex-artifacts/unify-navigation-history/claude-result.json`.
