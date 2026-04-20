# BlackBox Records

Static Astro site for the BlackBox Records label.

## Stack

- Astro 6 (static output)
- React integration (for shadcn-ui primitives)
- Tailwind CSS v4 + shadcn-ui setup (design implemented in Astro templates + `apps/web/src/styles/global.css`)
- Type-safe content collections (`apps/web/src/content`)
- Separate Cloudflare Worker backend scaffold (`apps/backend/src/index.ts`) using TypeScript + Hono
- Code-first OpenAPI documents and a generated `@blackbox/api-client` workspace package

## URL model

The production deployment is configured for GitHub Pages project hosting:

- `site`: `https://blackbox-studio-athens.github.io`
- `base`: `/blackbox-records/`

This is configured in `apps/web/astro.config.mjs`.

## Navigation model

- Top-level sections (`/`, `/distro/`, `/artists/`, `/releases/`, `/services/`, `/about/`) are shell-routed in the browser and swapped in-place.
- Release, artist, and news detail routes remain direct-load Astro pages, but in-site clicks open them through the app-shell overlay.
- The Bandcamp/Tidal player stays mounted in the persistent shell so playback can survive top-level section switches.
- The minimized player is only shown after the user interacts with the embed area; a loaded embed alone does not create the pill.
- Real document navigations still occur for direct loads, refreshes, new tabs, and the external shop redirect.

## Prerequisites

- Node.js 22.12+
- pnpm 10+

## Setup

```sh
pnpm install
```

## shadcn MCP registries

`apps/web/components.json` is configured with a curated multi-registry set:

- `@21st`: `https://21st.dev/r/shadcn/{name}`
- `@magicui`: `https://magicui.design/r/{name}`
- `@aceternity`: `https://ui.aceternity.com/registry/{name}.json`
- `@blocks`: `https://blocks.so/r/{name}.json`
- `@hextaui`: `https://hextaui.com/r/{name}.json`

Quick checks:

```sh
pnpm --dir apps/web dlx shadcn@latest search '@magicui' -q hero -l 5
pnpm --dir apps/web dlx shadcn@latest search '@blocks' -q dashboard -l 5
```

Notes:

- `@21st` can be used directly for item installs (for example `@21st/accordion`), but listing/search from its registry endpoint is currently unstable.
- Keep third-party registry usage on a curated allowlist and review dependency/file diffs before accepting generated code.
- Shared policy and new-project checklist: `../SHADCN-MCP-REGISTRY-PLAYBOOK.md`.

## Local development

```sh
pnpm dev
```

Run the Astro frontend explicitly:

```sh
pnpm dev:web
```

Run the separate Worker backend scaffold locally:

```sh
pnpm dev:backend
```

Deploy the sandbox Worker manually:

```sh
pnpm deploy:backend:sandbox
```

When the frontend starts consuming Worker APIs, point it at the local backend with:

```sh
PUBLIC_BACKEND_BASE_URL=http://127.0.0.1:8787 pnpm dev:web
```

Compatibility alias:

```sh
pnpm worker:dev
```

Current Worker scope:

- no probe endpoints such as `healthz`, `status`, or `readyz`
- Hono owns the HTTP interface layer; unmatched routes currently return JSON `404`
- no Stripe, D1, Prisma, or frontend wiring yet
- no production deployment path yet
- backend-owned OpenAPI documents are emitted to `apps/backend/openapi/`
- generated frontend-facing types and `openapi-typescript-fetch` wrappers live in `packages/api-client/`
- frontend discovers the backend only through `PUBLIC_BACKEND_BASE_URL`
- the dedicated sandbox deploy target is the `blackbox-records-backend-sandbox` Worker on `workers.dev`

Clean dev run (mirrors the `ateleia` workflow):

```sh
pnpm dev:clean
```

## Verification

```sh
pnpm test:unit
pnpm check
pnpm build
```

Backend-only verification:

```sh
pnpm test:backend
pnpm check:backend
```

Generate backend OpenAPI documents and refresh the generated client package:

```sh
pnpm generate:api
```

## Backend contract model

- The backend owns the HTTP contract through code-first OpenAPI definitions.
- Public shopper APIs and staff-only internal APIs are emitted as separate OpenAPI documents:
  - `apps/backend/openapi/public-openapi.json`
  - `apps/backend/openapi/internal-openapi.json`
- Frontend code must consume backend API types through `@blackbox/api-client`, not by importing backend runtime modules.
- `@blackbox/api-client` uses `openapi-typescript-fetch` as the runtime client layer on top of the generated schema types.

## Frontend-to-Worker URL contract

- The browser-facing Astro app owns only `PUBLIC_BACKEND_BASE_URL`.
- Local development uses:
  - `pnpm dev:web`
  - `pnpm dev:backend`
  - `PUBLIC_BACKEND_BASE_URL=http://127.0.0.1:8787`
- Sandbox will use the same env var with a future stable Worker hostname from Phase `05-05`.
- The sandbox backend target is the dedicated `workers.dev` Worker named `blackbox-records-backend-sandbox`.
- Its stable URL shape is `https://blackbox-records-backend-sandbox.<your-account-subdomain>.workers.dev`.
- The account-level `workers.dev` subdomain is owned in Cloudflare, not in this repo, so the Worker name is the repo-controlled stable portion of the sandbox hostname.
- The frontend must not guess production or sandbox backend origins in code.
- Worker secrets, D1 bindings, Stripe secrets, Cloudflare Access config, and CI credentials remain backend/server-side only.

## Sandbox backend CI/CD

- The static Astro site continues to deploy only through `.github/workflows/pages.yml`.
- The separate Worker sandbox deploy path is isolated in `.github/workflows/cloudflare-sandbox.yml`.
- That workflow:
  - runs on pushes to `sandbox`
  - can also be triggered manually
  - runs `pnpm generate:api`
  - runs `pnpm test:backend`
  - runs `pnpm check:backend`
  - deploys only the backend workspace to Cloudflare Workers

## GitHub Pages CI/CD

- Deployment is handled by `.github/workflows/pages.yml`.
- The workflow uses `withastro/action@v5` and only deploys if all of these succeed:
  - `pnpm test:unit`
  - `pnpm check`
  - `pnpm build`
- Pushes go directly to `main` in this repo.
- If CI fails on `main`, GitHub Pages does not publish the broken revision; fix it with a follow-up commit or revert the bad commit on `main`.
- The Astro frontend remains the active Pages deployment target. The Worker scaffold is separate and currently local-only until later commerce infrastructure phases land.

## Content model

Content is managed in the repo through Astro content collections, and Decap CMS now provides an editing layer on top of the same `apps/web/src/content/**` files.

- Artists: `apps/web/src/content/artists/*.md`
- Releases: `apps/web/src/content/releases/*.md`
- Distro items: `apps/web/src/content/distro/*.json`
- News: `apps/web/src/content/news/*.md`
- Home copy: `apps/web/src/content/home/*.json`
- About copy: `apps/web/src/content/about/*.json`
- Services copy: `apps/web/src/content/services/*.json`
- Navigation: `apps/web/src/content/navigation/*.json`
- Social links: `apps/web/src/content/socials/*.json`
- Site settings: `apps/web/src/content/settings/*.json`
- Collection-owned images live next to their Markdown entries and are validated by Astro content schemas.
- JSON collection entries include `$schema` references to Astro-generated collection schemas for editor/CMS validation.
- Artists and releases may include an optional `shop_collection_handle` for future Fourthwall collection linking.
- Home/about decorative images are now validated as Astro image fields.
- Home, About, and Services now store their page sections as editable block lists in Decap so whole sections can be deleted or reordered when needed.

Collection schemas are defined in `apps/web/src/content.config.ts`.

## Decap CMS

BlackBox now ships with an Astro-hosted Decap CMS at `/admin/`.

- Admin entry: `apps/web/src/pages/admin/index.astro`
- Generated config: `apps/web/src/pages/admin/config.yml.ts`
- Admin styling: `apps/web/public/admin/admin.css`
- Preview styling/runtime: `apps/web/public/admin/preview.css`, `apps/web/public/admin/init.js`
- Local Decap proxy: `apps/web/scripts/start-decap-proxy.mjs`
- Combined local CMS dev server: `apps/web/scripts/start-cms-dev.mjs`
- Global Decap media browser root: `apps/web/src/content/uploads/`

### Local CMS development

Start Astro on a dedicated CMS port and the local Decap proxy together:

```sh
pnpm cms:dev
```

Run only the local Decap proxy:

```sh
pnpm cms:proxy
```

Default local ports:

- Astro CMS dev server: `4322`
- Decap proxy: `8082`

### Decap environment variables

- `DECAP_SITE_URL`
  - Optional production override for the published site root used by Decap.
- `DECAP_REPOSITORY`
  - GitHub repository slug used by DecapBridge in production.
- `DECAP_BRANCH`
  - Branch Decap writes to. Defaults to `main`.
- `DECAPBRIDGE_BASE_URL`
  - DecapBridge auth base URL.
- `DECAPBRIDGE_AUTH_ENDPOINT`
  - PKCE auth endpoint path.
- `DECAPBRIDGE_AUTH_TOKEN_ENDPOINT`
  - PKCE token endpoint path.
- `DECAPBRIDGE_GATEWAY_URL`
  - DecapBridge gateway URL.
- `DECAP_LOCAL_PROXY_PORT`
  - Local Decap proxy port. Defaults to `8082`.
- `CMS_DEV_PORT`
  - Astro port used by `pnpm cms:dev`. Defaults to `4322`.

### GitHub Pages + DecapBridge setup

Production `/admin/config.yml` is generated during the GitHub Pages build, so the DecapBridge values must be present in the Pages workflow environment.

Add these in GitHub:

- Repository `Settings -> Secrets and variables -> Actions -> Variables`
  - `DECAP_SITE_URL`
    - `https://blackbox-studio-athens.github.io/blackbox-records/`
  - `DECAP_REPOSITORY`
    - `BlackBox-Studio-Athens/blackbox-records`
  - `DECAP_BRANCH`
    - `main`
  - `DECAPBRIDGE_BASE_URL`
    - `https://auth.decapbridge.com`
  - `DECAPBRIDGE_GATEWAY_URL`
    - `https://gateway.decapbridge.com`
- Repository `Settings -> Secrets and variables -> Actions -> Secrets`
  - `DECAPBRIDGE_AUTH_ENDPOINT`
    - The exact PKCE auth endpoint path DecapBridge generated for this site
  - `DECAPBRIDGE_AUTH_TOKEN_ENDPOINT`
    - The exact PKCE token endpoint path DecapBridge generated for this site

Notes:

- Keep the endpoint values in GitHub `Secrets`, not `Variables`.
- The workflow now injects these values during the Pages build, so the published `/admin/config.yml` can emit the real `git-gateway` PKCE config.
- Local `pnpm cms:dev` remains on the proxy backend unless you explicitly provide real DecapBridge values in your local environment.
- For hosted production access, keep the DecapBridge site on `pkce` and leave only Google enabled as a login provider.

### Production auth model

- Local development uses `decap-server` with the `proxy` backend. No DecapBridge login is required.
- When the DecapBridge PKCE endpoints are not configured yet, the generated config stays on the local `proxy` backend instead of emitting broken placeholder login URLs.
- Production `/admin/` only builds a DecapBridge PKCE config once the DecapBridge environment values above are set correctly.
- The published `/admin/` is intended to be Google-only through DecapBridge social login. The repo does not emit Decap `classic` username/password auth.
- The local `pnpm cms:dev` flow is intentionally different from production and continues using the unauthenticated proxy backend for editing convenience.

### Hosted login troubleshooting

- If the published `/admin/` still shows a password form, the cause is DecapBridge dashboard/provider configuration, not the generated repo config.
- In DecapBridge, keep the site on `pkce`, disable any non-Google providers, and turn off any optional password or email/password login toggles.
- The published `/admin/config.yml` should show `backend.name: git-gateway` and `auth_type: pkce`. If it does, the repo side is already configured for Google-only social login.

### Media assets behavior

- The Decap `Media assets` drawer is rooted at `apps/web/src/content/uploads/`.
- That folder acts as a mirrored library of the images currently in use across the site, including the brand assets that otherwise live in `public/assets/images/brand/`.
- Decap’s global media drawer does not aggregate collection-local image folders into one repo-wide browser, so the mirrored uploads folder exists specifically to make those current assets appear in the drawer.
- Collection image fields still keep their per-collection `media_folder` / `public_folder` overrides, so editing existing content continues to save files beside the relevant entries and remains compatible with Astro `image()` fields.

### Collection coverage

The CMS edits the same Astro content files already used by the site:

- Single-file collections:
  - `home`
  - `about`
  - `services`
  - `settings`
- Folder collections:
  - `navigation`
  - `socials`
  - `artists`
  - `releases`
  - `distro`
  - `news`

Image widgets are scoped per collection so saved paths stay compatible with Astro `image()` fields and collection-local assets.

## Artist image standard

Featured artist imagery is currently designed around a strict portrait crop on the homepage roster.

- Ideal source delivery: `1800 x 2400`
- Acceptable minimum: `1200 x 1600`
- Composition guidance:
  - keep the subject centered
  - leave headroom and side breathing room for hard crops
  - avoid tiny logos or overly distant subjects for roster usage
- Current UI behavior:
  - homepage featured roster uses a strict `3:4` crop
  - images use `object-fit: cover`
  - images are center-cropped by default

If a source crops badly, replace the source image rather than adding focal-point config by default.

## Project structure

- `src/layouts/`: document and page shell layouts
- `src/components/`: shared sections, cards, shell/player UI, UI primitives
- `src/pages/`: routed Astro pages and endpoints
- `src/styles/`: global Tailwind/shadcn layer
- `public/assets/`: static brand assets and 404 assets

## Build output

`pnpm build` outputs static files to `dist/`.

## WebStorm run configuration

- `.run/Astro Dev.run.xml` is included.
- `.run/Astro Site.run.xml` is included.
- In WebStorm: Run/Debug Configurations -> `Astro Dev`.
- `Astro Dev` runs `pnpm run cms:dev`, so the site dev server and Decap proxy both start and `/admin/` works locally.
- `Astro Site` runs `pnpm run dev:clean` when you only want the site dev server without the CMS proxy.
