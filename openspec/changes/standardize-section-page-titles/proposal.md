## Why

Primary section pages currently use three unrelated responsive title scales, so Services and Releases do not match Artists, Store, and About. Store and Services also repeat the same word as both supporting label and level-one heading, weakening rather than clarifying page identity.

## What Changes

- Give Artists, Releases, Store, Services, and About one shared responsive level-one title scale based on the current Artists/Store/About treatment.
- Keep the existing Releases showcase intro and Services intro surface; align only their title typography and identity copy.
- Present the base Store route as `Store` / `All`, while category routes remain `Store` / their category name.
- Present Services as `What We Do` / `Services`.
- Make the shared page hero omit a supporting label when it repeats its title after whitespace and case normalization, so content-driven callers cannot render duplicate hero copy.
- Add focused regression coverage for the shared-hero safeguard and for the distinct custom Releases and Services headers.
- Verify equal rendered title sizing and non-repeating identities on direct loads and app-shell navigation at desktop and narrow viewports.

## Capabilities

### New Capabilities

- `section-page-identity`: Defines shared primary-section title sizing, distinct supporting-label and heading semantics, Store and Services copy, and duplicate prevention for shared and custom page heroes.

### Modified Capabilities

None.

## Impact

- Primary implementation surfaces: `apps/web/src/components/InternalPageHero.astro`, a small pure resolver in `apps/web/src/lib/page-identity.ts`, `apps/web/src/components/store/StoreCollectionPage.astro`, `apps/web/src/lib/store-categories.ts`, `apps/web/src/pages/releases/index.astro`, `apps/web/src/pages/services/index.astro`, and title rules in `apps/web/src/styles/global.css`.
- Focused coverage will exercise the resolver's normalization and omission behavior directly, extend the existing Store and Releases contracts, and cover the custom page-title pairs.
- The completed but unarchived `redesign-releases-evolved-split-showcase` change owns the current Releases intro. Archive it before applying this change, then preserve its layout, transition identity, and catalog hierarchy.
- No route, metadata-title, navigation, content schema, CMS field, API, dependency, asset, deployment, or commerce behavior changes.
