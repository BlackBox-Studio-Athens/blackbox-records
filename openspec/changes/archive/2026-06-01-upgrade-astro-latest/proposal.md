## Why

The web app is pinned to Astro 6.3.7 while the latest stable Astro release is 6.4.2. Upgrading now keeps the static frontend build current without changing the repo's Local, UAT, and PRD hosting model.

This change also records the dependency-compatibility checks required for Astro upgrades so future package updates do not accidentally introduce SSR, Cloudflare adapter routing, or broad frontend dependency churn.

## What Changes

- Upgrade the Astro frontend build/runtime packages from `astro@6.3.7` to `astro@6.4.2`.
- Update the official React integration from `@astrojs/react@5.0.5` to `@astrojs/react@5.0.6`.
- Keep `@astrojs/check`, `eslint-plugin-astro`, `prettier-plugin-astro`, and `@tailwindcss/vite` unchanged unless validation exposes a compatibility issue.
- Preserve the static Astro output, GitHub Pages UAT, Cloudflare Pages PRD, and separate Worker backend boundary.
- Do not adopt `@astrojs/cloudflare`, Astro SSR, Pages Functions, or experimental advanced routing as part of this upgrade.

## Capabilities

### New Capabilities

### Modified Capabilities

- `tooling-validation`: Astro upgrades must verify peer/runtime compatibility across Astro, React integration, type checking, formatting/linting, Vite/Tailwind, Node, and CI gates.
- `static-site-and-deployment`: Astro upgrades must preserve static frontend hosting and the separate Worker backend boundary.

## Impact

- Dependency manifests and `pnpm-lock.yaml`.
- Astro build, check, lint/format, and unit-test gates.
- Local Browser Use smoke validation for the static app routes.
- No public API, content schema, Worker API, D1, Stripe, checkout, or deployment URL changes.
