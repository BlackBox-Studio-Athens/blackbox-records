# BlackBox Records

Static Astro site for the BlackBox Records label.

## Stack

- Astro 5 (static output)
- React integration (for shadcn-ui primitives)
- Tailwind CSS v4 + shadcn-ui setup
- Legacy visual system preserved through imported site styles (`src/styles/site-styles.scss`)
- Type-safe content collections (`src/content`)

## URL model

The production deployment is configured for GitHub Pages project hosting:

- `site`: `https://zantoichi.github.io`
- `base`: `/blackbox-records/`

This is configured in `astro.config.mjs`.

## Prerequisites

- Node.js 20+
- pnpm 10+

## Setup

```sh
pnpm install
```

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
pnpm check
pnpm build
```

## Content model

Content is managed directly in the repo (no CMS in this phase).

- Artists: `src/content/artists/*.md`
- Releases: `src/content/releases/*.md`
- News: `src/content/news/*.md`
- Site data: `src/data/*.ts`

Collection schemas are defined in `src/content.config.ts`.

## Project structure

- `src/layouts/`: document and page shell layouts
- `src/components/`: shared sections, cards, player modal, UI primitives
- `src/pages/`: routed Astro pages and endpoints
- `src/styles/`: global Tailwind/shadcn layer + imported legacy style system
- `public/assets/`: static images, JS, and 404 assets

## Build output

`pnpm build` outputs static files to `dist/`.

## WebStorm run configuration

- `.run/Astro Dev.run.xml` is included.
- In WebStorm: Run/Debug Configurations -> `Astro Dev`.
- It runs `pnpm run dev:clean` with the project Node interpreter and browser debugger enabled.
