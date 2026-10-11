# Fit Local Durable Object storage within the Windows path limit

## Why

On 2026-09-30, `pnpm dev` in the Claude Code worktree `.claude/worktrees/black-bar-photo-issue-8ef67b` answered every Worker commerce read with `500 Error: internal error; reference = …`. The store item page showed "Currently Unavailable" and nothing could be added to the cart. The same code works from the main checkout, and from fresh state in a worktree with a shorter name.

On Windows, workerd 1.20260925.1 (miniflare 5.20260925.0-alpha, wrangler 4.141.0) cannot open SQLite files whose absolute path reaches 256 characters. Every public `/api/*` request reaches the Hono app through the SQLite-backed `CommerceRuntime` Durable Object. Its storage is `apps/backend/.wrangler/state/v3/do/<Worker name>-<class>/<64-hex id>.sqlite`. With the Local Worker name `blackbox-records-backend-local-mock`, the object's `-wal` file needs 163 characters below the checkout root, so that worktree reached 258. The object's first write cannot commit and workerd discards the actor with an opaque internal error. The database file stays at zero bytes, so every later request fails the same way. `CmsRuntime` and `PublicSiteRuntime` have shorter directory names and stayed just under the limit, which is why staff and public pages kept working.

## What changes

- The Local Worker names become `blackbox-local`, `blackbox-local-mock`, `blackbox-local-mock-api` and `blackbox-public-local`. One helper supplies the public Worker name to both the CMS service binding and the public runtime. UAT and PRD names are unchanged.
- Every Local Durable Object then fits a checkout path of up to 104 characters, which allows Claude Code worktree names of up to 37 characters on the development machine.
- `start-local-cms.mjs` and `local-public-runtime.mjs` refuse to start on Windows when a Durable Object storage path would reach 256 characters. The error names the class, the path length and how much shorter the checkout path must be.
- Tests pin the limit and assert that every Local Worker fits a 104-character Windows checkout. README and the local-runtime reference record the constraint.

## Scope

Local tooling only. Hosted Workers, D1 and R2 names, commerce data and the Local state location are unchanged. Existing Local Durable Object storage moves to new directories once. It held only `__miniflare_do_name` rows and ephemeral CMS preview chunks. The workerd limit itself is upstream; reporting it there and dependency upgrades are outside this change.

## Acceptance

At the failing worktree's persistence-root length (124 characters), the previous build stops before the Worker starts with the new message. The renamed build answers `GET /api/store/items/disintegration-black-vinyl-lp` and `GET /api/store/listing-prices` with 200, and the store item page offers Add To Cart and adds the item. Focused tests, strict OpenSpec validation and `pnpm validate` pass.
