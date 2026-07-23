# Implementation notes

## Local acceptance — July 23, 2026

- `pnpm test:cms-admin`: passed, 20 files and 317 tests.
- Focused final UAT Static Smoke validator test: passed, 1 file and 10 tests.
- `pnpm smoke:cms-local -- --screenshots never`: passed five representative editor checks with zero console errors and zero page errors.
- Local smoke cleanup left no matching Astro, Decap proxy, browser, or parent smoke process running.
- `pnpm test:unit`: passed — web 830 tests, backend Worker 284 tests, backend Node 235 tests, and API client 6 tests.
- `pnpm check`: passed with zero errors and the pre-existing `ZodIssueCode` deprecation hint only.
- `pnpm build`: passed with 350 pages; disabled CMS mode, cache policy, brand font, and generated image markup checks passed.
- `git diff --check`: passed.
- `pnpm openspec -- validate harden-decap-editorial-operations --type change --strict`: passed on canonical `main`.

The ordinary secret-free build renders `/admin/` in disabled mode, does not advertise a writable CMS config, and rejects localhost or placeholder values in generated admin assets.

## UAT acceptance — July 23, 2026

- Final behavioral commit: `48081722c2bea3ffd10e2c5cd9a85b3779de4249`.
- UAT-only static deployment run `30031559833` checked out that exact commit, passed hosted Decap preflight and build, deployed GitHub Pages successfully, and skipped both PRD jobs.
- The deployed `/admin/config.yml` returned HTTP 200 with `# blackbox-decap-mode: hosted`, `git-gateway`, repository `BlackBox-Studio-Athens/blackbox-records`, and branch `main`.
- `cms_admin` run `30031865141` checked out the exact commit and passed 2 read-only, unauthenticated checks with zero console errors and zero page errors.
- `cms_assets` run `30032025747` checked out the exact commit and passed 10 read-only, unauthenticated checks with zero console errors and zero page errors.
- GitHub Pages initially allowed only `main`; temporary policy `55440915` enabled the bounded UAT ref and was removed after acceptance. The temporary `codex/decap-harden-uat` remote branch was also deleted.
- `origin/main` remained `7c77d07d51e9dc82a03d963156f1ef29ac20e4af`; no PRD deployment occurred.
