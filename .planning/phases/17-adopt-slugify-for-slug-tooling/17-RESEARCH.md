# Phase 17 - Research: Slugify Slug Tooling

## Current State

- Slugs appear in Astro content frontmatter, content entry IDs, store item projections, route params, Decap config helpers, local mock commerce seed/readiness scripts, and tests.
- `pnpm view @sindresorhus/slugify version` returned `3.0.0` on 2026-05-22.
- The repo already has important slug invariants:
  - shopper-facing store URLs describe sellable item options;
  - legacy release IDs are not always the canonical store item slug;
  - public route changes need compatibility handling.

## Recommended Approach

Add a BlackBox slug utility and migrate generation, not identity:

- add `@sindresorhus/slugify` to the package that owns the wrapper;
- create a small wrapper with BlackBox defaults;
- expose explicit functions for generation, validation, and optional draft uniqueness;
- migrate admin/CMS config helpers and script-side fallback slug generation first;
- add tests for accented names, symbols, repeated whitespace, known item-option slugs, and collision reporting.

## Avoid

- Do not regenerate committed content slugs.
- Do not rename route folders or content files.
- Do not derive D1/Stripe mapping identities from generated slugs.
- Do not hide collisions by automatic suffixing for public route data.

## Verification

- Targeted slug utility tests.
- Existing catalog, store-page, Decap admin, and local mock commerce tests.
- `pnpm test:unit`
- `pnpm check`
- `pnpm build`
