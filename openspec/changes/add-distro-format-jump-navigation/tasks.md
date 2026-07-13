## 1. Predecessor gate

- [ ] 1.1 Confirm `organize-distro-format-discovery` and `add-static-distro-search` are implemented and archived, run `pnpm openspec:guard`, and verify their final grouped-route and search-control seams still match this design before editing Distro.

## 2. Format jump navigation

- [ ] 2.1 Derive each populated group's heading ID once beside its existing entries and chunks, then render one wrapping `Browse formats` navigation after search and before the groups with source-derived names/counts, matching `href` and `data-scroll-to-target` values, and local outline `buttonVariants` styling.
- [ ] 2.2 Extend the Distro search control to hide the whole server-rendered navigation for every non-empty normalized query and restore it on clear or cleanup without filtered counts, per-link state, or new app-shell logic.

## 3. Verification

- [ ] 3.1 Extend focused route and Distro-search tests for the named navigation landmark, populated-group order, count/target consistency, active-query hiding, clear, cleanup, and the native fragment fallback.
- [ ] 3.2 Use Browser Use at mobile and desktop widths to verify wrapping, keyboard activation, shell scrolling, search/clear transitions, route exit/re-entry, no-JavaScript navigation, and console cleanliness.
- [ ] 3.3 Run `pnpm test:unit`, `pnpm check`, `pnpm build`, `pnpm openspec -- validate add-distro-format-jump-navigation --strict`, and `git diff --check` against the final tree.
