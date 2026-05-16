---
plan_id: 12-35
phase: 12
status: completed
completed: 2026-05-16
---

# 12-35 Summary - AppShellRoot Refactor Strategy

## Completed

- Measured `AppShellRoot.tsx` at 1,207 lines after `12-34`.
- Used Serena symbol overview to confirm the root still owns shell page application, overlay opening, shell-section
  navigation, player lifecycle coordination, StoreCart state application, route loading, and effect/event wiring.
- Inventoried the flat `apps/web/src/components/app-shell/` helper/test folder.
- Added `12-APP-SHELL-ROOT-STRATEGY.md` with:
  - a Phase 12 target of 800-900 lines for `AppShellRoot.tsx`;
  - a stretch target near 750 lines only if readability improves;
  - explicit root responsibilities that should remain in the composition root;
  - target app-shell internal folders for `navigation`, `overlay`, `player-shell`, `store-cart`, and `dom`;
  - an extraction order that starts with folder organization before deeper navigation, overlay, player, and StoreCart
    coordination moves.
- Reconfirmed that `eslint-plugin-boundaries` remains the import/entrypoint gate through `pnpm check`.

## Verification

- AppShellRoot line-count measurement
- Serena `get_symbols_overview` on `AppShellRoot.tsx`
- app-shell helper/test inventory
- `pnpm check`
