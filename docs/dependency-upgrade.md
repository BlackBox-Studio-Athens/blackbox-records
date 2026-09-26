# Dependency upgrade — 2026-09-26

LTS runtimes and the newest compatible stable libraries, including major upgrades. Versions were checked against npm, PyPI and official GitHub release metadata. Prereleases are excluded from direct dependencies even when tagged latest. This is a local repository upgrade; hosted rollout, migrations, provider configuration and PRD checkout remain separate.

## Toolchain and workflow pins

| Dependency                 | Before  | After     |
| -------------------------- | ------- | --------- |
| Node LTS                   | 24.21.0 | 24.21.0   |
| pnpm                       | 12.0.0  | 12.6.0    |
| Renovate validator         | 44.52.0 | 44.115.10 |
| pnpm/action-setup          | v6.0.10 | v6.1.0    |
| cloudflare/wrangler-action | v4.0.0  | v4.1.3    |

The checkout, setup-node, cache, upload-artifact and download-artifact actions already match their current stable releases. The local stripe-mock launcher already selects the upstream latest release through Go.

## Workspace packages

Repeated declarations are aligned across workspaces. Existing exact/caret conventions and internal workspace links are preserved.

| Package                           | Before       | After        | Selection                                                                                    |
| --------------------------------- | ------------ | ------------ | -------------------------------------------------------------------------------------------- |
| @astrojs/check                    | 0.9.10       | 0.9.10       | Already latest stable.                                                                       |
| @astrojs/cloudflare               | 14.3.1       | 14.3.3       | Latest stable.                                                                               |
| @astrojs/react                    | 6.0.4        | 7.0.0        | Latest stable.                                                                               |
| @cloudflare/flagship              | 0.5.0        | 0.5.0        | Already latest stable.                                                                       |
| @cloudflare/vitest-pool-workers   | 0.22.0       | 0.22.0       | Already latest stable.                                                                       |
| @cloudflare/workers-types         | 5.20260911.1 | 5.20260926.1 | Latest stable.                                                                               |
| @emdash-cms/admin                 | 0.40.1       | 0.41.0       | Latest stable.                                                                               |
| @emdash-cms/cloudflare            | 0.40.1       | 0.41.0       | Latest stable.                                                                               |
| @eslint/js                        | 10.0.1       | 10.0.1       | Already latest stable.                                                                       |
| @hono/zod-openapi                 | 1.6.1        | 1.6.3        | Latest stable.                                                                               |
| @lingui/core                      | 5.9.5        | 5.9.5        | Shared provider must match EmDash admin Lingui 5.                                            |
| @lingui/react                     | 5.9.5        | 5.9.5        | Shared provider must match EmDash admin Lingui 5.                                            |
| @openfeature/server-sdk           | 1.23.0       | 1.23.0       | Already latest stable.                                                                       |
| @portabletext/react               | 8.0.1        | 8.0.1        | Already latest stable.                                                                       |
| @portabletext/toolkit             | 5.0.2        | 6.0.0        | Latest stable.                                                                               |
| @prisma/adapter-d1                | 7.10.0       | 7.10.0       | Already latest stable.                                                                       |
| @prisma/client                    | 7.10.0       | 7.10.0       | Already latest stable.                                                                       |
| @radix-ui/react-dialog            | 1.1.23       | 1.1.23       | Already latest stable.                                                                       |
| @radix-ui/react-slot              | 1.3.3        | 1.3.3        | Already latest stable.                                                                       |
| @sindresorhus/slugify             | 3.0.0        | 3.0.1        | Latest stable.                                                                               |
| @t3-oss/env-core                  | 0.13.11      | 0.13.11      | Already latest stable.                                                                       |
| @tailwindcss/vite                 | 4.3.3        | 4.3.3        | Already latest stable.                                                                       |
| @tanstack/react-query             | 5.90.21      | 5.90.21      | Shared QueryClientProvider must match EmDash admin exact 5.90.21.                            |
| @types/node                       | 24.13.3      | 24.19.0      | Track the Node 24 LTS runtime, not Node 26 Current.                                          |
| @types/react                      | 19.2.18      | 19.3.0       | Latest stable.                                                                               |
| @types/react-dom                  | 19.2.5       | 19.3.0       | Latest stable.                                                                               |
| @vitejs/plugin-react              | 6.1.1        | 6.1.1        | Already latest stable.                                                                       |
| astro                             | 7.3.2        | 7.3.5        | Latest stable.                                                                               |
| astro-portabletext                | 0.11.4       | 1.0.1        | Latest stable.                                                                               |
| class-variance-authority          | 0.7.1        | 0.7.1        | Already latest stable.                                                                       |
| clsx                              | 2.1.1        | 2.1.1        | Already latest stable.                                                                       |
| cmdk                              | 1.1.1        | 1.1.1        | Already latest stable.                                                                       |
| cookie                            | 2.0.1        | 2.0.1        | Already latest stable.                                                                       |
| dependency-cruiser                | 18.2.0       | 18.4.0       | Latest stable.                                                                               |
| emdash                            | 0.40.1       | 0.41.0       | Latest stable.                                                                               |
| eslint                            | 10.9.1       | 10.11.0      | Latest stable.                                                                               |
| eslint-config-prettier            | 10.1.8       | 10.1.8       | Already latest stable.                                                                       |
| eslint-import-resolver-typescript | 4.4.5        | 4.4.5        | Already latest stable.                                                                       |
| eslint-plugin-astro               | 3.1.0        | 3.2.1        | Latest stable.                                                                               |
| eslint-plugin-boundaries          | 7.2.0        | 7.2.0        | Already latest stable.                                                                       |
| execa                             | 10.0.1       | 10.0.1       | Already latest stable.                                                                       |
| fuse.js                           | 7.5.0        | 7.5.0        | Already latest stable.                                                                       |
| hono                              | 4.13.5       | 4.13.9       | Latest stable.                                                                               |
| jose                              | 6.2.3        | 6.2.12       | Latest stable.                                                                               |
| knip                              | 6.33.0       | 6.38.0       | Latest stable.                                                                               |
| lucide-react                      | 1.38.0       | 1.48.0       | Latest stable.                                                                               |
| msw                               | 2.15.0       | 2.15.0       | Already latest stable.                                                                       |
| openapi-typescript                | 7.13.0       | 7.13.0       | Already latest stable.                                                                       |
| openapi-typescript-fetch          | 2.2.1        | 2.2.1        | Already latest stable.                                                                       |
| playwright                        | 1.62.1       | 1.63.0       | Latest stable.                                                                               |
| prettier                          | 3.9.6        | 3.9.9        | Latest stable.                                                                               |
| prettier-plugin-astro             | 0.14.1       | 1.1.0        | Latest stable.                                                                               |
| prisma                            | 7.10.0       | 7.10.0       | Newest stable matching CLI/client/D1 adapter; latest tag points to an 8.x release candidate. |
| radix-ui                          | 1.6.7        | 1.6.7        | Already latest stable.                                                                       |
| react                             | 19.2.8       | 19.3.0       | Latest stable.                                                                               |
| react-dom                         | 19.2.8       | 19.3.0       | Latest stable.                                                                               |
| react-resizable-panels            | 4.12.4       | 4.13.3       | Latest stable.                                                                               |
| resend                            | 6.25.0       | 6.30.0       | Latest stable.                                                                               |
| robot3                            | 1.2.0        | 1.2.0        | Already latest stable.                                                                       |
| shadcn                            | 4.19.1       | 4.21.0       | Latest stable.                                                                               |
| sharp                             | 0.35.4       | 0.35.4       | Already latest stable.                                                                       |
| stripe                            | 22.6.0       | 22.6.2       | Latest stable.                                                                               |
| tailwind-merge                    | 3.6.0        | 3.7.0        | Latest stable.                                                                               |
| tailwindcss                       | 4.3.3        | 4.3.3        | Already latest stable.                                                                       |
| tsx                               | 4.23.13      | 4.23.15      | Latest stable.                                                                               |
| tw-animate-css                    | 1.4.0        | 1.4.0        | Already latest stable.                                                                       |
| typescript                        | 5.9.3        | 5.9.3        | OpenAPI generator requires TypeScript ^5.x.                                                  |
| typescript-eslint                 | 8.68.0       | 8.70.1       | Latest stable.                                                                               |
| unique-names-generator            | 4.7.1        | 4.7.1        | Already latest stable.                                                                       |
| vitest                            | 4.1.11       | 4.1.11       | Cloudflare Worker pool requires Vitest ^4.1.0.                                               |
| wrangler                          | 4.131.1      | 4.141.0      | Latest stable.                                                                               |
| yaml                              | 2.9.0        | 2.9.1        | Latest stable.                                                                               |
| zod                               | 4.5.4        | 4.6.5        | Latest stable.                                                                               |

## Compatibility and migrations

- Prettier's Astro plugin 1.1.0 reformats 44 templates. Those edits are formatter output, with no intended UI or behavior changes.
- Public money/cart validation disables Zod's JIT before constructing schemas, preserving the existing CSP without an eval probe. A regression check verifies validation when dynamic code is blocked.
- Preview comparisons wait for store availability to settle before comparing rendered content in Chromium and Firefox. The harness reuses real Google Font responses within each browser run because Playwright routing disables the HTTP cache; iframe replacement otherwise repeatedly cancels font downloads. Font, image and hydration readiness checks remain enforced.
- The architecture file scan excludes `.codex-artifacts`, so downloaded packages and isolated verification environments do not inflate its source inventory or cause timeout failures.
- The regenerated lockfile refreshes transitive dependencies within upstream ranges. Deprecated upstream dependencies remain upstream-owned; no forced major overrides are added.
- Astro/Vite/Rolldown, MSW and test-pool Wrangler overrides are removed. Cloudflare pool 0.22.0 still pins Miniflare 5.20260815.0-alpha, whose runtime cannot satisfy the Worker compatibility date. Its targeted override uses 5.20260925.0-alpha, matching current Wrangler. This alpha is an upstream test/runtime dependency, not an opt-in application prerelease.
- Release-age exceptions contain only explicitly selected fresh versions needed by this upgrade; the release-age policy remains enabled.
- EmDash 0.41.0 retains the existing save/delete concurrency patch, rebased across source and compiled exports. Its new relation migrations require backup and upgrade/restart checks; see [CMS migration ordering](../apps/backend/cms-migrations/README.md).
- Stripe 22.6.2 targets the already pinned 2026-08-26.dahlia API. No API version, webhook, account or checkout-gate changes are made.
- The Prisma family remains 7.10.0, so client regeneration is unnecessary. Regenerate OpenAPI and the browser client after Hono/Zod upgrades.

Stable upstream packages retain these prerelease dependencies; replacing them with unrelated stable majors would exceed their supported contracts:

| Dependency                                                                                                | Required by                                                                                         |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `miniflare@5.20260925.0-alpha`                                                                            | Wrangler 4.141.0 and the targeted Worker-pool runtime override                                      |
| `miniflare@5.20260923.0-alpha`                                                                            | Cloudflare Vite plugin 1.60.1                                                                       |
| `miniflare@5.20260815.0-alpha`                                                                            | Worker pool's upstream Wrangler 4.124.0 dependency; its direct test runtime uses the newer override |
| `unenv@2.0.0-rc.24`                                                                                       | Cloudflare's Vite plugin, Wrangler and unenv presets                                                |
| `youch@4.1.0-beta.10`                                                                                     | Miniflare error reporting                                                                           |
| `get-tsconfig@5.0.0-beta.4`                                                                               | Astro 7.3.5                                                                                         |
| `gensync@1.0.0-beta.2`                                                                                    | Babel 7.29.7                                                                                        |
| `@visx/{curve,event,grid,group,point,responsive,scale,shape}@4.0.1-alpha.0`, `@visx/vendor@4.0.0-alpha.0` | Prisma Studio core 0.33.0 and its chart dependency graph                                            |

## Approved bundle baselines

The user approved new JavaScript budgets on 2026-09-26 to retain the upgraded dependencies. React DOM's published production client grows from 536,016 to 625,168 unminified bytes between 19.2.8 and 19.3.0. The complete upgraded builds exceeded the previous budgets below. An experimental component split and manual chunk grouping did not resolve the limits and were discarded.

| Route          | Previous budget | Upgraded build (Brotli bytes) | Approved budget |
| -------------- | --------------: | ----------------------------: | --------------: |
| Home / shell   |          95 KiB |                 97,501 (Home) |          96 KiB |
| Staff overview |         116 KiB |                       122,234 |         120 KiB |
| Staff website  |         165 KiB |                       175,399 |         172 KiB |
| Staff stock    |         145 KiB |                       151,944 |         149 KiB |
| Staff orders   |         120 KiB |                       126,940 |         125 KiB |

These are local quality-11 Brotli measurements, not hosted transfer measurements. Route isolation, deferred feature checks, HTML budgets, stylesheet checks, and the requirement to fail over-budget builds remain enforced. Hosted performance acceptance is outside this repository-only upgrade.

## Python artwork tool

| Dependency         | Previous minimum | New minimum |
| ------------------ | ---------------- | ----------- |
| Python             | 3.11             | 3.12        |
| setuptools         | 69               | 84.0.0      |
| beautifulsoup4     | 4.12             | 4.15.0      |
| bandcamp_async_api | 0.2.2            | 0.2.6       |
| musicbrainzngs     | 0.7              | 0.7.1       |
| Pillow             | 10               | 12.3.0      |
| requests           | 2.31             | 2.34.2      |
| yt-dlp             | 2024.8.6         | 2026.8.19   |

The Bandcamp dependency already required Python 3.12; the declared minimum now reflects that constraint. Verify the editable install in an isolated environment with pip check and all local unittest tests.

## Required acceptance

Run a strict frozen install, full pnpm validate and pnpm validate:editor on the final source tree. Additional checks cover EmDash save/delete races, disposable database upgrade/restart, local publication and Chromium/Firefox preview acceptance. Verify the canonical mock stack and public/staff interactions using the native browser. Validation summaries live under .codex-artifacts/validation; task evidence is under .codex-artifacts/dependency-upgrade. Failed or incomplete checks do not establish completion.
