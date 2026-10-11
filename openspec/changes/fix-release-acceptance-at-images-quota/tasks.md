## 1. Local repair

- [x] 1.1 Add regression coverage for missing/disconnected overlay roots and guard delayed content-focus execution without changing normal focus or document scrolling APIs.
- [x] 1.2 Resolve public-assets smoke media to trusted published originals; retain strict transformation checks and source-boundary regression coverage.
- [x] 1.3 Verify controlled image failure fallback and original shell/player, overlay and mobile cart behavior in focused browser checks.
- [x] 1.4 Preserve the missing-page probe's expected HTTP 404 in scenario status aggregation and regress success, soft-404 and invalid-document cases.

## 2. Release

- [ ] 2.1 Record evidence, pass strict OpenSpec, final `pnpm validate` and `pnpm build:web`, then commit the prepared release tree on main.
- [ ] 2.2 Close the captured UAT checkout test window, push main and obtain a fully successful UAT workflow including browser and hosted smoke gates.
- [ ] 2.3 Promote that accepted candidate to PRD, verify both release identities and preserved accepted content/PRD controls, and restore UAT's original checkout state.
