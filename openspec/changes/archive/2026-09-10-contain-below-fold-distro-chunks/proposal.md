## Why

Store Distro's native containment fails first traversal, while eager rendering alone moves the stall into View all. The measured causes are expensive title/font work, discarded preview layout, and synchronous disclosure style/layout. The user authorized the bounded revisions needed to close the change.

## What Changes

- Keep all six-card chunks server-rendered once in canonical order.
- Render Store listings and Distro catalogs eagerly, including search and fallback, and retain invisible catalog layout during enhanced Coverflow preview.
- Use the existing UI display font for Store and Distro card titles, preserve brand headings/font assets, and bound Google font replacement with optional display.
- Use native card stretch sizing and explicit outer grid columns.
- Apply disclosure state immediately, then perform cancellable focus/layout on the next animation frame after resolving styles.
- Extend the existing runner with reproducible tree/build identity, readiness/mode checks, first/repeat profiles, and raw setup/traversal traces.
- Add no observer, virtualization, pagination, duplicate catalog, dependency, API, or commerce-authority change. Retain the existing budgets.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `frontend-runtime-performance`: Measure actual Distro rendering modes, retain preview layout, and bound catalog traversal and disclosure without hidden long slices.

## Impact

- Store and Distro card layout CSS/classes and the existing Coverflow controller
- Existing Google font stylesheet delivery in SiteLayout
- Existing Store/Distro regression tests and performance runner
- Runtime performance and production-readiness evidence
- No backend, Stripe, D1, checkout, CMS, content, DNS, provider, or launch surface changes
