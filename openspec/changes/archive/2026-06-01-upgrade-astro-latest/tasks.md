## 1. OpenSpec Artifacts

- [x] 1.1 Run `pnpm openspec:guard` and confirm work is happening in the main worktree.
- [x] 1.2 Create `proposal.md`, `design.md`, `tasks.md`, and delta specs for `tooling-validation` and `static-site-and-deployment`.
- [x] 1.3 Validate the change with `pnpm openspec -- validate upgrade-astro-latest --strict`.

## 2. Dependency Upgrade

- [x] 2.1 Reconfirm npm latest versions for `astro` and `@astrojs/react`; stop and update the OpenSpec plan if latest Astro is no longer `6.4.2`.
- [x] 2.2 Update root `astro` to exact `6.4.2`.
- [x] 2.3 Update web `astro` to `^6.4.2` and `@astrojs/react` to `^5.0.6`.
- [x] 2.4 Regenerate `pnpm-lock.yaml` with pnpm 10.33.4.
- [x] 2.5 Confirm the lockfile resolves a single compatible Astro/Vite path and does not introduce `@astrojs/cloudflare`.

## 3. Validation

- [x] 3.1 Run `pnpm -r outdated astro @astrojs/react @astrojs/check eslint-plugin-astro prettier-plugin-astro @tailwindcss/vite --format json`.
- [x] 3.2 Run `pnpm test:unit`.
- [x] 3.3 Run `pnpm check`.
- [x] 3.4 Run `pnpm build`.
- [x] 3.5 Run `pnpm audit:unused`.
- [x] 3.6 Start the local static site and smoke these routes with Browser Use:
  - `http://127.0.0.1:4321/blackbox-records/`
  - `http://127.0.0.1:4321/blackbox-records/distro/`
  - `http://127.0.0.1:4321/blackbox-records/store/disintegration-black-vinyl-lp/checkout/`
- [x] 3.7 Verify `git status --short` shows only this change's files plus pre-existing unrelated dirty files.

Validation note: `pnpm check` initially failed on unrelated OpenSpec Prettier drift, then passed after formatting the final tree.
