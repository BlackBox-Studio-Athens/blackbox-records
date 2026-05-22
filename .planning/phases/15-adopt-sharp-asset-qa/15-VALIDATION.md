# Phase 15 Validation

## Scope

Phase 15 added a read-only Sharp-backed asset QA command for committed web image assets.

The implementation does not change Astro image rendering, public image URLs, route-visible content paths, Cloudflare
Images, Worker routes, or runtime hosting behavior.

## Tooling Evidence

- `apps/web/scripts/check-assets.ts` inspects committed `apps/web/public` image assets and content-referenced local image
  fields with Sharp metadata.
- `apps/web/package.json` exposes `pnpm --filter @blackbox/web assets:check`.
- The root `package.json` exposes `pnpm assets:check` as a discoverable wrapper.
- Favicon coverage includes:
  - PNG size and alpha metadata through Sharp
  - SVG square viewbox metadata through Sharp
  - ICO directory size and bit-depth metadata through a read-only header parser because Sharp does not decode ICO input
- Content coverage resolves local `image` and `cover_image` references in Markdown frontmatter and JSON content entries.

## Current Asset Findings

`pnpm assets:check` passed on 2026-05-23 after inspecting 46 image references and static assets.

The command reported three non-blocking `artist-portrait-ratio` warnings for existing artist sources:

- `src/content/artists/481665433_641184112172905_3870068485311478607_n.jpg`
- `src/content/artists/Chronoboros-band-logo.jpg`
- `src/content/artists/Ouranopithecus-band-photo.jpg`

These warnings are intentionally advisory in the first read-only slice because replacing artist image assets requires
human content/design review. No image files or content image paths were changed.

## Verification Commands

- `pnpm --filter @blackbox/web exec vitest run test/assets/check-assets.test.ts` passed on 2026-05-23 with 1 file and 7 tests.
- `pnpm assets:check` passed on 2026-05-23 with 3 advisory artist portrait warnings and no skipped image classes.
- `pnpm --filter @blackbox/web check` passed on 2026-05-23 with no errors; the remaining output was existing Zod deprecation hints in `src/content.config.ts`.
- `pnpm test:unit` passed on 2026-05-23 for `@blackbox/web`, `@blackbox/backend`, and `@blackbox/api-client`.
- `pnpm check` passed on 2026-05-23, including format, lint, TypeScript/Astro checks, module boundary audit, dependency-cruiser boundary audit, and commerce boundary audit.
- `pnpm build` passed on 2026-05-23 and built 116 static pages.

## Browser Acceptance

Browser Use was not required for Phase 15 because the change is a local tooling command and tests only. No rendered UI,
layout, routing, player behavior, checkout behavior, or public URL behavior changed.
