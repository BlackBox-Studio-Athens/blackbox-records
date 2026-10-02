# Tasks

## 1. Reproduce and fix

- [x] 1.1 Include the cart spec in the mobile project and add small-phone overflow, delivery-state and repeated-purchase checks; capture a failing regression before changing the cart.
- [x] 1.2 Bound one cart content scroll pane and keep shopping actions in a nonshrinking footer for filled and empty carts; verify the regression and focused cart tests pass.

## 2. Verify integration

- [x] 2.1 Run the cart browser spec at 390x844, 390x667 and 320x568, verify touch scrolling, quantities, persistence, focus return and resumed Store scrolling, and run existing shell/player continuity checks.
- [x] 2.2 Run strict OpenSpec validation and pnpm validate on the final tree; record source-bound Local evidence and any uncovered acceptance.
- [x] 2.3 Verify the Playwright-owned dev server disables Astro's toolbar and the cart checks pass without forced clicks; repeat the release acceptance after the CI toolbar collision.

## 3. Release

- [x] 3.1 Commit only this change's files and deploy through the normal UAT candidate workflow; verify hosted release identity and repeat the mobile cart checks.
- [x] 3.2 Promote the verified retained candidate through the PRD acceptance gates and confirm PRD mobile cart behavior; record the candidate, promotion and browser evidence.
