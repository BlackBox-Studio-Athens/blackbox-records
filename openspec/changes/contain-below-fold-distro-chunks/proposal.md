## Why

Store Distro still misses the mobile LCP and first-traversal performance gates because its complete multi-group catalog creates avoidable initial layout work. Existing six-card chunks and native CSS containment can defer only the below-fold work without changing catalog behavior or adding client rendering.

## What Changes

- Keep the first six-card chunk of the first Distro group eagerly rendered.
- Apply native `content-visibility` containment to every later chunk and to the first chunk of every later Distro group.
- Preserve group headers, navigation, search, Coverflow, card markup, canonical source order, image loading, and complete server rendering.
- Extend the existing containment source-contract test and rerun the established performance and Browser Use acceptance profiles.
- Add no JavaScript activation system, observer, pagination, virtualization, batching, node recycling, dependency, API, or type.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `frontend-runtime-performance`: Make the measured Distro offscreen-rendering boundary include all below-fold chunks while preserving the first viewport and complete server-rendered catalog.

## Impact

- `apps/web/src/styles/global.css`
- Existing Store/Distro containment source-contract test
- Runtime performance evidence and production-readiness evidence
- No backend, Stripe, D1, checkout, CMS, content, DNS, provider, or public-launch surface changes
