## 1. Shared navigation model

- [x] 1.1 Export `SitePagePath` and reject Home in the main menu in `navigationContentSchema`. Cover accepted and rejected entries in `editorial-validation.test.ts`.
- [x] 1.2 Replace `getHeaderNavigationItems` with `getMainNavigation()`, and add `navigationLinkAttributes` with unit tests.

## 2. Surfaces

- [x] 2.1 Add one `.site-nav-link` component in `global.css`, and render header, Menu and footer links through it. Remove the phone footer overrides that clip the sitemap.
- [x] 2.2 Menu changes:
  - Home first.
  - A 44px Close.
  - The Menu closes at the desktop breakpoint.
  - The button shows Menu and reports its expanded state.
  - Closing the Menu returns focus to its button.
  - The current-state sync covers the header and footer.
- [x] 2.3 Update the staff checkbox label, DESIGN.md Navigation and the runtime-performance Store selector.

## 3. Acceptance

- [x] 3.1 Extend `e2e/shell-navigation.spec.ts` to cover the Menu, the footer at 320 and 390px, and the breakpoint. Check in the browser at 320, 390 and 1440px.
- [x] 3.2 Run the affected tests, `pnpm test:app-shell`, `pnpm test:e2e`, `pnpm validate:editor`, strict OpenSpec validation and a final `pnpm validate`. Record the evidence in `validation.md`.
