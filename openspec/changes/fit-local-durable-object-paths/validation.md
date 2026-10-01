# Validation and handoff

## Scope

- Product Environment: Local. Local Worker names, the two Local Worker launchers, tests and documentation changed. Hosted Workers, data and provider behavior did not change.
- Acceptance rows: boundaries/tooling/instructions (focused tests, `pnpm agent:check`, strict OpenSpec validation, `pnpm validate`) and the Local mock commerce path, observed in the browser. Shell/player and hosted release rows do not apply because no shell code or hosted configuration changed.

## Reproduction

- Main checkout (48-character path) with existing Local state: `pnpm dev` started and both `GET /api/store/items/disintegration-black-vinyl-lp` and `GET /api/store/listing-prices` returned 200.
- Session worktree with a 25-character name (92-character path), fresh state, full first-run bootstrap: item read 200. The `CommerceRuntime` `-wal` path was exactly 255 characters.
- Failing worktree from 2026-09-30 (95-character path): its Wrangler log, the 0-byte `CommerceRuntime` database and the timings are recorded in the design.
- Minimal probe, one SQLite-backed Durable Object through `unstable_dev`: `-wal` paths of 250 and 255 characters returned 200; 256, 257 and 258 returned 500 `internal error; reference = …` and left a 0-byte database without `-wal` or `-shm`. A trace-store path of 260 characters still served 200.
- `WRANGLER_LOG=debug`, which runs workerd with `--verbose`, still shows only `internal error; reference = …`; miniflare does not surface the underlying SQLite error.
- Ruled out by the same runs: fresh state alone, a second workerd process sharing the state directory, four concurrent first requests, the dev-registry reconnect and D1 access.

## Fix verification at the failing path length

The Worker persisted to a real directory of 124 characters, identical to the failing worktree's `apps/backend/.wrangler/state`.

- Previous build (`blackbox-records-backend-local-mock`): the launcher stopped before the Worker started with `Local CommerceRuntime storage needs a 258-character path, but workerd on Windows cannot open SQLite files past 255 characters. Use a checkout path at least 3 characters shorter.`
- Renamed build (`blackbox-local-mock`): item read 200 with `canCheckout: true`, `catalogStatus: ready`, €28.00 and the checkout action; listing prices 200. The new storage files are 238 and 242 characters long.
- Public site on port 4321 (`blackbox-public-local`): the CMS Worker's `PUBLIC_SITE` binding reported `[connected]` and the store item page returned 200. In the built-in browser the page offered Add To Cart. Clicking it put Disintegration (Black Vinyl LP, €28.00, Available, quantity 1) in the cart. The page called the Worker for the item read (200, twice) and the delivery quote (204 preflight, 200), with no console errors. The test item was removed afterwards.

## Checks

- `vitest run --project=backend-tooling test/scripts/cms-resources.test.ts`: 5 passed, including the 2 new tests. `nx run backend-tooling:test --skip-nx-cache`: 35 files and 187 tests passed.
- ESLint and Prettier pass for the changed files; `pnpm agent:check` passes; `pnpm openspec -- validate fit-local-durable-object-paths --type change --strict` passes.
- The final `pnpm validate` summary for this tree is retained under `.codex-artifacts/validation/`.

## Notes

- Prepared in the session worktree `.claude/worktrees/site-design-system-b78ede`, with OpenSpec commands run under `--allow-worktree`. That worktree was at main's commit. The main checkout held another session's uncommitted `unify-site-navigation` work, so this change was landed on `main` touching only its own files.
- Existing Local states keep the old `blackbox-records-*-local*` Durable Object directories, which are unused and can be deleted.
- Found on the way, not changed: on a cold first run in the failing worktree, the public site came up about 4 minutes 20 seconds into the stack launcher's 5-minute wait for port 4321. With debug logging, that wait expired in this session.
- Upstream: workerd's Windows SQLite path limit should be reported to cloudflare/workerd. Not reported, because no external communication was authorized.
