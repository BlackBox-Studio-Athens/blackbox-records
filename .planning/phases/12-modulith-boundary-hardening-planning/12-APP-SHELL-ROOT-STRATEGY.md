---
phase: 12
status: active
created: 2026-05-16
---

# AppShellRoot Refactor Strategy

## Current Evidence

- `AppShellRoot.tsx` is currently 1,207 lines after slice `12-34`.
- The app-shell implementation folder is too flat: many behavior helpers and their tests sit directly under
  `apps/web/src/components/app-shell/`, which makes ownership harder to scan even though many helpers are now tested.
- Serena symbol overview still shows `AppShellRoot` owning orchestration-heavy functions for shell page application,
  overlay opening, shell-section navigation, player lifecycle coordination, StoreCart state application, route loading,
  and event/effect wiring.

## Realistic Size Goal

The Phase 12 target for `AppShellRoot.tsx` is **800-900 lines**, with a stretch target near **750 lines** only if the
remaining extractions improve reader locality without creating wrappers.

That target is intentionally not "as small as possible." `AppShellRoot` should still own:

- React state and refs that are truly composition concerns.
- Render structure for the persistent shell, overlay portal, player modal/miniplayer, StoreCart drawer, and mobile nav.
- Event-handler wiring that coordinates multiple shell subsystems.
- Calls into named helpers/hooks for policy, DOM details, cache decisions, and focused side-effect clusters.

The refactor should stop before the root becomes a thin but opaque dispatcher where behavior can only be understood by
jumping through many shallow files.

## Folder Shape Target

Keep the public mount surface unchanged:

- `AppShell.astro`
- `AppShellRoot.tsx`

Group app-shell internals by behavior, not by whether a file was extracted recently:

- `navigation/` - shell page loading, page snapshots, section navigation, popstate, anchor/click intent, route loading,
  scroll/focus reset, rendered navigation state, prefetch intent.
- `overlay/` - overlay fragment loading, overlay history, overlay focus, overlay open/close request coordination.
- `player-shell/` - shell-owned player modal/miniplayer policy, frame host synchronization, focus, iframe interaction,
  view-state, and session-machine input derivation.
- `store-cart/` - shell bridge code that reads browser StoreCart convenience state and drives the drawer.
- `dom/` - body state, document/window listener attachment, portal target lookup, hero scroll progress, and other
  shell-owned DOM helpers that are not navigation-specific.

Do not introduce `index.ts` barrels as compatibility facades. A barrel is acceptable only when it becomes a documented
root or named app-shell interface in the module canvas and manifest.

Closed `player` module files currently living under `app-shell/player-*` need a separate move decision because the
manifest assigns them to the `player` module through explicit ownership exceptions. Moving those files is allowed only in
a slice that updates the manifest, module canvases, imports, and tests together.

## Extraction Strategy

1. Prefer cohesive slices over one-helper-at-a-time churn.
   - A slice may move several already-tested helpers into one folder when the move is mechanical and import-only.
   - A slice may extract a larger root function when it removes real policy or side-effect sequencing from
     `AppShellRoot`.
2. Characterize before extraction when behavior is not already directly covered.
3. Separate mechanical folder moves from behavioral extraction unless the combined diff is still easy to review.
4. Keep `eslint-plugin-boundaries` active as the primary import/entrypoint gate:
   - folder moves must keep `.planning/codebase/module-boundaries.manifest.json` accurate;
   - `pnpm check` must continue to run ESLint with `boundaries/no-unknown-files` and `boundaries/dependencies` as errors.
5. Continue to record Browser Use blockers instead of substituting unrelated browser tooling when the plugin is
   unavailable.

## Test Throughput Strategy

Keep the fast path boring while Phase 12 refactors are still module-internal:

- Use focused Vitest filters for the seam being extracted, such as
  `pnpm --filter @blackbox/web exec vitest run shell-overlay-navigation`.
- Use `pnpm --filter @blackbox/web exec vitest run src/components/app-shell` as the package-scoped regression loop for
  AppShellRoot and its extracted shell helpers before running repository-wide gates.
- Keep `pnpm test:unit`, `pnpm check`, and `pnpm build` as required completion gates for behavior-changing slices.
- Do not introduce custom scripts, Nx, project graph caching, or repo-wide TypeScript reference reshaping just to speed up
  the current shell refactor. Revisit those only if repeated Phase 12 timings show the simple package-scoped loop is not
  enough.

## Next Slice Order

1. **App-shell folder organization pass:** move already-tested app-shell-owned helpers into the folder shape above with
   no behavior changes, keeping tests next to their helpers and updating docs/manifests if ownership patterns change.
2. **Shell-section navigation orchestration:** reduce root-owned section navigation by moving cache/page-apply/history
   sequencing behind a named helper or hook-shaped coordinator.
3. **Overlay open coordination:** move overlay open request sequencing and cache/focus/history coordination behind a
   named helper.
4. **Player lifecycle coordination:** after folder organization, reassess whether `applyPlayerProvider`,
   `retireActivePlayerSession`, and related root-owned player lifecycle steps can move without hiding React-owned refs.
5. **StoreCart bridge:** keep StoreCart browser convenience state non-authoritative while reducing root-local drawer
   synchronization only if the extracted seam stays testable.
