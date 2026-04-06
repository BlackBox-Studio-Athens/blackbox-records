# Technology Stack

**Analysis Date:** 2026-04-06

## Languages

**Primary:**
- TypeScript 5.9.3 - main application language for Astro pages, React components, admin config generation, local dev scripts, and tests in `src/**`, `scripts/*.mjs`, and `src/lib/admin/decap-config.test.ts`. The repo extends `astro/tsconfigs/strictest` in `tsconfig.json`.
- Astro templates - page, layout, and component layer in `src/pages/**`, `src/layouts/**`, and `src/components/**/*.astro`.

**Secondary:**
- JavaScript (ES modules) - browser-admin bootstrap in `public/admin/init.js` and local CMS/dev orchestration in `scripts/start-cms-dev.mjs` and `scripts/start-decap-proxy.mjs`.
- Markdown with frontmatter - collection content in `src/content/artists/*.md`, `src/content/releases/*.md`, and `src/content/news/*.md`.
- JSON - structured content collections in `src/content/distro/*.json`, `src/content/navigation/*.json`, `src/content/socials/*.json`, `src/content/settings/*.json`, `src/content/home/*.json`, `src/content/about/*.json`, and `src/content/services/*.json`.
- CSS - global site styling in `src/styles/global.css` and admin-specific styling in `public/admin/admin.css` and `public/admin/preview.css`.

## Runtime

**Environment:**
- Node.js 20+ for local development per `README.md`.
- Node.js 22 in CI via `.github/workflows/pages.yml`.
- Production runtime is static hosting on GitHub Pages from `astro.config.mjs`; there is no long-lived server runtime in the deployed app.

**Package Manager:**
- pnpm 10.29.3 from the `packageManager` field in `package.json`.
- Lockfile: present in `pnpm-lock.yaml`.

## Frameworks

**Core:**
- Astro 5.18.0 - static site generation, content collections, API routes, partial routes, and project URL/base handling in `astro.config.mjs`, `src/content.config.ts`, and `src/pages/**`.
- React 19.2.0 with `@astrojs/react` 4.4.2 - client-loaded app shell, overlays, mobile nav, filters, inquiry form, and shadcn primitives in `src/components/app-shell/AppShell.astro`, `src/components/app-shell/AppShellRoot.tsx`, and `src/components/ui/**`.
- Astro content collections - 10 typed collections defined in `src/content.config.ts` and queried through `src/lib/site-data.ts` and `src/lib/catalog-data.ts`.
- Custom app-shell routing - same-document top-level section swaps plus overlay fragment fetching in `src/lib/app-shell/routing.ts` and `src/components/app-shell/AppShellRoot.tsx`.

**Testing:**
- Vitest 4.0.18 - unit tests for CMS config logic and player/session logic in `src/lib/admin/decap-config.test.ts` and `src/components/app-shell/player-session-machine.test.ts`.

**Build/Dev:**
- Tailwind CSS 4.1.18 with `@tailwindcss/vite` 4.1.18 - styling pipeline configured in `astro.config.mjs` and applied through `src/styles/global.css`.
- shadcn CLI 3.8.4 - component registry/bootstrap metadata in `components.json`, with generated primitives under `src/components/ui/**`.
- Radix UI primitives - dialog/select/slot primitives used by shadcn-based UI in `src/components/ui/sheet.tsx`, `src/components/ui/select.tsx`, and `src/components/ui/button.tsx`.
- Sharp 0.34.5 - Astro image processing backing `image()` collection fields in `src/content.config.ts` and `astro:assets` usage such as `src/components/cards/DistroCard.astro`.
- `@astrojs/check` 0.9.6 - content/type verification behind `pnpm check` in `package.json`.

## Key Dependencies

**Critical:**
- `astro` `^5.18.0` - powers the static storefront, content collections, partial overlay routes, sitemap generation, and admin config/media routes in `astro.config.mjs`, `src/content.config.ts`, `src/pages/app-shell-overlay/**`, `src/pages/sitemap.xml.ts`, and `src/pages/admin/**`.
- `react` `^19.2.0` and `react-dom` `^19.2.0` - keep the persistent app shell, player session, overlay UI, and mobile sheet mounted across shell-managed navigation in `src/components/app-shell/AppShellRoot.tsx`.
- `sharp` `^0.34.5` - required for collection-owned image assets referenced through `image()` fields in `src/content.config.ts`.
- `decap-server` `^3.5.2` - local CMS proxy backend launched by `scripts/start-decap-proxy.mjs` and `scripts/start-cms-dev.mjs`.

**Infrastructure:**
- `@astrojs/react` `^4.4.2` - Astro/React bridge for client-loaded islands in `astro.config.mjs`.
- `tailwindcss` `^4.1.18` and `@tailwindcss/vite` `^4.1.18` - styling/build integration via `astro.config.mjs` and `src/styles/global.css`.
- `shadcn` `^3.8.4` plus `@radix-ui/react-dialog`, `@radix-ui/react-select`, and `@radix-ui/react-slot` - component system configuration in `components.json` and implementation in `src/components/ui/**`.
- `class-variance-authority`, `clsx`, `tailwind-merge`, and `tw-animate-css` - utility-driven component styling in `src/components/ui/**`, `src/lib/utils.ts`, and `src/styles/global.css`.
- `lucide-react` `^0.563.0` - icon system used across navigation, footer, and shell UI in `src/components/Header.astro`, `src/components/Footer.astro`, and `src/components/app-shell/AppShellRoot.tsx`.
- `fuse.js` `^7.1.0` - client-side artist search in `src/components/artists/artist-roster-search.ts`.

## Configuration

**Environment:**
- Site deployment settings are defined in `astro.config.mjs` with `site: 'https://blackbox-studio-athens.github.io'`, `base: '/blackbox-records/'`, `output: 'static'`, React integration, and Tailwind's Vite plugin.
- TypeScript path aliasing is configured in `tsconfig.json` with `@/* -> src/*`.
- shadcn registry/style aliases are configured in `components.json`, including the `new-york` style, CSS variables, `src/styles/global.css`, and curated external registries.
- CMS environment handling lives in `src/pages/admin/config.yml.ts` and `src/lib/admin/decap-config.ts`; local CMS scripts consume `CMS_DEV_PORT` and `DECAP_LOCAL_PROXY_PORT`.
- No `.env`, `.env.*`, `.nvmrc`, `.node-version`, `vite.config.*`, or `tailwind.config.*` files were detected from repo file listing. Tailwind is configured through the Astro/Vite plugin and `components.json` instead of a separate Tailwind config file.

**Build:**
- `package.json` - install scripts, dev/build/check/test commands, dependency versions.
- `astro.config.mjs` - Astro static build, base path, React integration, Vite plugin stack.
- `.github/workflows/pages.yml` - CI build and Pages deployment.
- `tsconfig.json` - strict TS baseline and path aliases.
- `components.json` - shadcn component system metadata and registries.
- `src/pages/admin/config.yml.ts` - build-time generation of the CMS config consumed by `/admin/`.

## Platform Requirements

**Development:**
- Node.js 20+ and pnpm 10+ per `README.md`.
- `pnpm dev` runs Astro locally; `pnpm cms:dev` runs the site on port `4322` plus `decap-server` on port `8082` through `scripts/start-cms-dev.mjs`.
- Local content editing assumes the repo filesystem is writable under `src/content/**` and `src/content/uploads/**`.

**Production:**
- GitHub Pages project hosting with static output, site URL `https://blackbox-studio-athens.github.io`, and base path `/blackbox-records/` from `astro.config.mjs`.
- Store commerce remains external on Fourthwall via links and redirects from `src/config/site.ts`, `src/pages/shop/index.astro`, and distro/release content in `src/content/distro/*.json` and `src/content/releases/*.md`.

---

*Stack analysis: 2026-04-06*
