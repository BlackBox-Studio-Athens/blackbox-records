## Why

Homepage scrolling feels slow on the hero-to-content transition. UAT mobile tracing showed a 900 ms hero scroll window produced 105 scroll events, 105 `--homepage-hero-scroll-progress` writes, and hundreds of opacity transition start/cancel events, so the first fix should remove the transition churn without changing the visual direction.

## What Changes

- Remove CSS `transition: opacity ...` from homepage hero elements whose opacity was driven continuously by scroll progress.
- Replace continuous `--homepage-hero-scroll-progress` writes with a coarse threshold class on the homepage hero.
- Preserve the fixed hero composition, hero image, image filter, grain layer, Ken Burns animation, scroll cue animation, and reduced-motion behavior.
- Keep the fix scoped to the homepage hero and app-shell scroll progress path; do not add dependencies, new animation libraries, runtime feature flags, or broader visual redesign.
- Add/adjust the smallest relevant regression checks so the scroll-driven hero layers no longer declare opacity transitions and the scroll sync only mutates the hero when the threshold state changes.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `app-shell-and-player`: Homepage hero scroll state must not continuously start/cancel CSS opacity transitions or write per-scroll CSS variables while scrolling.

## Impact

- Affected frontend files: `apps/web/src/styles/global.css`, `apps/web/src/components/app-shell/dom/shell-hero-scroll-progress.ts`, and existing focused tests.
- No public APIs, content schemas, route contracts, commerce behavior, dependencies, or deployment configuration change.
- Validation requires `pnpm test:unit`, `pnpm check`, `pnpm build`, plus Browser Use verification of homepage scroll on mobile-first viewport.
