# BlackBox Records

Static Astro site for the BlackBox Records label.

## Stack

- Astro 5 (static output)
- React integration (for shadcn-ui primitives)
- Tailwind CSS v4 + shadcn-ui setup (design implemented in Astro templates + `src/styles/global.css`)
- Type-safe content collections (`src/content`)

## URL model

The production deployment is configured for GitHub Pages project hosting:

- `site`: `https://zantoichi.github.io`
- `base`: `/blackbox-records/`

This is configured in `astro.config.mjs`.

## Navigation model

- Top-level sections (`/`, `/news/`, `/artists/`, `/releases/`, `/services/`, `/about/`) are shell-routed in the browser and swapped in-place.
- Release, artist, and news detail routes remain direct-load Astro pages, but in-site clicks open them through the app-shell overlay.
- The Bandcamp/Tidal player stays mounted in the persistent shell so playback can survive top-level section switches.
- The minimized player is only shown after the user interacts with the embed area; a loaded embed alone does not create the pill.
- Real document navigations still occur for direct loads, refreshes, new tabs, and the external shop redirect.

## Prerequisites

- Node.js 20+
- pnpm 10+

## Setup

```sh
pnpm install
```

## shadcn MCP registries

`components.json` is configured with a curated multi-registry set:

- `@21st`: `https://21st.dev/r/shadcn/{name}`
- `@magicui`: `https://magicui.design/r/{name}`
- `@aceternity`: `https://ui.aceternity.com/registry/{name}.json`
- `@blocks`: `https://blocks.so/r/{name}.json`
- `@hextaui`: `https://hextaui.com/r/{name}.json`

Quick checks:

```sh
pnpm dlx shadcn@latest search '@magicui' -q hero -l 5
pnpm dlx shadcn@latest search '@blocks' -q dashboard -l 5
```

Notes:

- `@21st` can be used directly for item installs (for example `@21st/accordion`), but listing/search from its registry endpoint is currently unstable.
- Keep third-party registry usage on a curated allowlist and review dependency/file diffs before accepting generated code.
- Shared policy and new-project checklist: `../SHADCN-MCP-REGISTRY-PLAYBOOK.md`.

## Local development

```sh
pnpm dev
```

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

## GitHub Pages CI/CD

- Deployment is handled by `.github/workflows/pages.yml`.
- The workflow uses `withastro/action@v5` and only deploys if all of these succeed:
  - `pnpm test:unit`
  - `pnpm check`
  - `pnpm build`
- Pushes go directly to `main` in this repo.
- If CI fails on `main`, GitHub Pages does not publish the broken revision; fix it with a follow-up commit or revert the bad commit on `main`.

## Content model

Content is managed directly in the repo (no CMS in this phase), but site-editable data now also lives in Astro content collections.

- Artists: `src/content/artists/*.md`
- Releases: `src/content/releases/*.md`
- News: `src/content/news/*.md`
- Home copy: `src/content/home/*.json`
- About copy: `src/content/about/*.json`
- Services copy: `src/content/services/*.json`
- Navigation: `src/content/navigation/*.json`
- Social links: `src/content/socials/*.json`
- Site settings: `src/content/settings/*.json`
- Collection-owned images live next to their Markdown entries and are validated by Astro content schemas.
- JSON collection entries include `$schema` references to Astro-generated collection schemas for editor/CMS validation.
- Artists and releases may include an optional `shop_collection_handle` for future Fourthwall collection linking.
- Home/about decorative images are now validated as Astro image fields.

Collection schemas are defined in `src/content.config.ts`.

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
- In WebStorm: Run/Debug Configurations -> `Astro Dev`.
- It runs `pnpm run dev:clean` with the project Node interpreter and browser debugger enabled.
