## 1. Artists search threshold

- [x] 1.1 After item 1.3, guard the existing Artists search outlet inline with `artistProfiles.length > 5`, using the same collection that renders the roster and adding no helper, flag, configuration, or shell change.
- [x] 1.2 Extend the existing Artists roster layout test with one source-contract assertion that fails unless the outlet remains guarded at the five-to-six boundary; add no fixture framework or test file.

## 2. Verification

- [x] 2.1 Run `pnpm test:unit`, `pnpm check`, and `pnpm build`.
- [x] 2.2 Use Browser Use on direct and shell-managed Artists navigation with the current three-profile roster; confirm no search control or reserved gap, all three cards remain visible, and the console is clean.
