## Why

The Releases page promotes one featured release and one upcoming release, then repeats both in the catalog grid immediately below. Removing those duplicates will give each release one clear page role while preserving enough artwork and information for the upcoming release to stand on its own.

## What Changes

- Exclude the featured release and the selected upcoming release from the catalog grid on `/releases/`.
- Expand the selected upcoming release treatment to include its existing cover art and core release information.
- Preserve release-date-based selection: newest out-now release is featured, and nearest future release is upcoming.
- Cover empty and small catalogs without rendering duplicate release entries or empty highlight regions.

## Capabilities

### New Capabilities

- `release-catalog-presentation`: Defines mutually exclusive featured, upcoming, and remaining-catalog roles on the Releases page, including the upcoming release's minimum visible artwork and information.

### Modified Capabilities

None.

## Impact

- Frontend selection and rendering in `apps/web/src/pages/releases/index.astro` and `apps/web/src/lib/release-feature.ts`.
- Regression coverage in `apps/web/src/lib/release-feature.test.ts`.
- Releases-page styling in `apps/web/src/styles/global.css`.
- Existing release content, routes, app-shell behavior, APIs, commerce authority, dependencies, and content schema remain unchanged.
