## 1. Typography Contract

- [x] 1.1 Add focused source-contract coverage for the three mono summary selectors, their unchanged readable properties, optional Release summary markup, and the excluded orientation, card, and detail roles.
- [x] 1.2 Run the focused test against the unchanged CSS and confirm it fails only because the three mono declarations are absent.

## 2. Scoped Styling

- [x] 2.1 Add only `font-family: var(--font-mono)` to the Distro group introduction and Latest/Upcoming Release summary selectors.
- [x] 2.2 Run the focused test and confirm the complete typography boundary passes.

## 3. Validation

- [x] 3.1 Run `pnpm test:unit`, `pnpm check`, and `pnpm build` against the final tree.
- [x] 3.2 Use Browser Use to verify direct loads and app-shell navigation for `/store/distro/` and `/releases/` at desktop, 390px, and 320px, including computed fonts, wrapping, hierarchy, overflow, and console errors.
