# Implementation notes

## Local acceptance — July 23, 2026

- `pnpm test:cms-admin`: passed, 20 files and 316 tests.
- Focused lifecycle and UAT Static Smoke tests: passed, 2 files and 17 tests.
- `pnpm smoke:cms-local -- --screenshots never`: passed five representative editor checks with zero console errors and zero page errors.
- Local smoke cleanup left no matching Astro, Decap proxy, browser, or parent smoke process running.
- `pnpm test:unit`: passed — web 807 tests, backend Worker 213 tests, backend Node 228 tests, and API client 6 tests.
- `pnpm check`: passed with zero errors and the pre-existing `ZodIssueCode` deprecation hint only.
- `pnpm build`: passed with 350 pages; disabled CMS mode, cache policy, brand font, and generated image markup checks passed.
- `git diff --check`: passed.

The ordinary secret-free build renders `/admin/` in disabled mode, does not advertise a writable CMS config, and rejects localhost or placeholder values in generated admin assets.

## Remaining acceptance

- Task 19.9 remains open because guarded OpenSpec validation must run from the canonical `main` worktree after integration.
- Task 19.10 remains open because the exact implementation commit has not been pushed to an authorized remote ref or deployed to UAT. No UAT evidence is claimed.
