## Task 1.2 — CMS admin unit baseline

- Run: July 22, 2026 at 20:09 local time
- Command: `pnpm test:cms-admin`
- Checkout: `C:\Users\SVall\WebstormProjects\blackbox-records`
- Result: exit 0; Vitest 4.1.7; 14 test files passed; 28 tests passed; duration 8.11s
- Pre-existing failures: none

The canonical checkout had no Decap implementation or dependency differences from required base `7c77d07d51e9dc82a03d963156f1ef29ac20e4af` across the focused admin paths and package metadata.

## Task 1.3 — Local CMS Smoke baseline

- Run: July 22, 2026 at 20:26 local time
- Requested command: `pnpm smoke:cms-local -- --screenshots never`
- Checkout: `C:\Users\SVall\WebstormProjects\blackbox-records`
- Canonical HEAD: `554ab618f4dc01bcdec1d4d5ed06500bf20f83c5`
- Equivalence: no committed or dirty differences from required base `7c77d07d51e9dc82a03d963156f1ef29ac20e4af` across the focused Decap admin, runtime, smoke, package, workspace, and lockfile paths
- Requested-command result: exit 1 before CMS startup because the canonical root install had no `node_modules/.bin/tsx` command link
- Direct installed-package diagnostic: exit 0; Local CMS Smoke passed 4 checks with 0 console errors and 0 page errors; screenshots were disabled
- Checked editors: Home and About fresh loads plus Home-to-About route transitions
- Cleanup: removed transient run `20260722172613`; proxy port `8083` closed; existing Astro PID `55568` on port `4323` was left running because it predated the smoke and reported itself as already running
- Pre-existing failures: root smoke-script launcher cannot resolve `tsx`; no CMS behavior failure was observed through the installed-package diagnostic

## Task 1.4 — Decap version inventory

- Recorded: July 22, 2026
- Dependency graph command: `pnpm --filter @blackbox/web list decap-server --depth 0 --lockfile-only --json`
- Installed/resolved `decap-server`: `3.7.0`
- Declared `decap-server` range: `^3.7.0`
- Browser `decap-cms` pin: exact `3.10.1`, loaded from `https://unpkg.com/decap-cms@3.10.1/dist/decap-cms.js`
- Worktree install state: `apps/web/node_modules/decap-server/package.json` is absent, so installed-version evidence comes from the lockfile-only pnpm dependency graph and lockfile resolution rather than an on-disk package copy

### Version-bearing operational occurrences

| Classification | Repository occurrence | Embedded value | Meaning |
| --- | --- | --- | --- |
| Dependency declaration | `apps/web/package.json:58` | `"decap-server": "^3.7.0"` | Web workspace dev dependency; range is not an exact pin. |
| Lockfile importer | `pnpm-lock.yaml:203-205` | `specifier: ^3.7.0`; `version: 3.7.0(supports-color@10.2.2)` | Importer preserves the declared range and selects `3.7.0`. |
| Lockfile package resolution | `pnpm-lock.yaml:3219-3222` | `decap-server@3.7.0` | Resolved package record and integrity metadata. |
| Lockfile snapshot | `pnpm-lock.yaml:8803-8813` | `decap-server@3.7.0(supports-color@10.2.2)` | Installed dependency snapshot with peer context and runtime dependencies. |
| Browser runtime source | `apps/web/src/pages/admin/index.astro:49` | `decap-cms@3.10.1` | Exact CDN version loaded by `/admin/`; `decap-cms` is not a package dependency or lockfile entry. |

### References that do not embed a version

- `apps/web/scripts/start-decap-proxy.mjs:7-12` and `apps/web/scripts/start-cms-dev.mjs:7-12` resolve the workspace `decap-server` executable by package name only.
- `scripts/smoke-cms-local.ts:274,286` resolves and labels the same executable by package name only.
- `knip.jsonc:27` ignores the declared `decap-server` dependency by package name only.
- `README.md:777` describes local `decap-server` use without a version.
- No executable test file under `apps/`, `scripts/`, or `packages/` matching `*.test.*` or `*.spec.*` embeds either package name or current version; no current test assertion checks either numeric pin.

### Existing planning references

- `openspec/changes/harden-decap-editorial-operations/design.md:9` records the current `decap-cms@3.10.1` / `decap-server@3.7.0` mismatch.
- `openspec/changes/harden-decap-editorial-operations/tasks.md:66` names `3.10.1` and `3.7.0` as stale values to remove during task 6.5.
- This baseline section intentionally repeats both values as task 1.4 evidence; it is not a dependency, runtime source, script, test, or assertion.
