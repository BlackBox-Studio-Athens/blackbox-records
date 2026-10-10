## Why

The public web catch-all module `storefront-catalog` owns most of `apps/web/src`. Any storefront edit reruns its 41-file Vitest suite (about 16s of per-file overhead) and `pnpm test <file>` takes about 29s. Split it into acyclic closed feature modules, as the staff frontend was, so a feature edit reruns only that feature's tests.

## What Changes

- Carve `web-editorial` (news and releases presentation), then `web-artists`, then `web-store` out of `storefront-catalog` as closed Nx modules with their own tests. `storefront-catalog` remains the shared data, content and presentation core.
- Slice 1 moves `NewsCard`, `ReleaseCard`, `NewsDetailContent`, `ReleaseDetailContent`, `HomeHero`, `release-commerce.ts` and its test to `apps/web/src/components/editorial/`. `release-feature.ts` stays in `storefront-catalog` because `ArtistDetailContent` also imports it and `web-editorial` depends on `storefront-catalog`.
- Between slices, a measurement gate decides whether to continue.
- Package-level `astro check`, eslint and the build stay unchanged.

## Capabilities

### Modified Capabilities

- `module-boundaries`: web storefront ownership is split between the `storefront-catalog` core and nested closed feature modules with a fixed layering.

## Impact

`apps/web/src/**` (file moves and import paths only, no behavior change), new `project.json` files, `web-pages` dependencies and two source-reading tests' paths. Backend, staff, hosted environments and release flow are unaffected.
