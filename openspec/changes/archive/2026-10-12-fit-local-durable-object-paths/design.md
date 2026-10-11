# Design

## Evidence

- The failing worktree's Wrangler log (`wrangler-2026-09-30_20-43-24_478.log`) records `internal error; reference = 1tjk562mr63fibu3t4i315ik` at 20:48:40Z for the first commerce reads. The `CommerceRuntime` storage file `a2e40b….sqlite` was created at that moment and left at 0 bytes, with no `-wal` or `-shm` file.
- Main checkout with existing Local state: item and listing reads return 200. Fresh state in a worktree whose name has 25 characters: 200, because the `-wal` path is exactly 255 characters.
- A minimal probe runs one SQLite-backed Durable Object through `unstable_dev` with a chosen persistence path. With a `-wal` path of 255 characters it returns 200; at 256, 257 and 258 it returns 500 `internal error` and leaves a 0-byte database. The miniflare trace store at the same length loses local traces, but requests still succeed.
- Ruled out: the `COMMERCE_DB` binding (migrations and seeding succeed), fresh state alone, a second workerd process sharing the state directory, concurrent first requests and the dev-registry reconnect.

## Decisions

- **Shorten the Local Worker names.** The Durable Object directory is `<Worker name>-<class>`, so the name is the only Local lever that shortens every Durable Object path without moving state or touching hosted resources. Class names are fixed by hosted migrations.
- **Keep `apps/backend/.wrangler/state`.** Wrangler D1 commands, seeding, publication and documentation all depend on it.
- **One public Worker name.** `publicWorkerName()` in `scripts/cms-resources.ts`, which both Astro configurations already import, keeps the CMS `PUBLIC_SITE` binding and the public runtime name in step.
- **Guard at the Worker launchers.** The check reads the generated Wrangler configuration and the actual persistence root, so it does not duplicate names or classes. It runs only on Windows, where the limit applies. It precedes `unstable_dev`, so a failure names the cause instead of surfacing as `internal error` on each request.
- **Rejected.** Failing fast without renaming would leave worktrees like the failing one unable to run the stack. Relocating Local state outside the checkout would change many commands. No upstream workerd fix was found on 2026-10-01.

## Path budget

Characters below the checkout root to the longest `<64-hex id>.sqlite-wal` file. The checkout root may be at most 255 minus the longest entry.

| Storage                    | Before | After |
| -------------------------- | -----: | ----: |
| mock `CommerceRuntime`     |    163 |   147 |
| mock-api `CommerceRuntime` |    167 |   151 |
| plain `CommerceRuntime`    |    158 |   142 |
| `PublicSiteRuntime`        |    159 |   151 |
| D1 (miniflare, fixed)      |    138 |   138 |

The default stack previously allowed a 92-character checkout path, or 88 for `stripe-mock-api`. It now allows 104 for both.
