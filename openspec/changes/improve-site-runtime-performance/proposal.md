## Why

The site is functionally correct but measured runtime work keeps it from feeling immediate: homepage scroll continuously repaints animated full-viewport effects, Store eagerly hydrates 82 price islands and issues 82 uncached Store Offer reads, long catalog routes render large offscreen trees, and every route preloads a 312 KB brand font plus the full app-shell graph. Controlled profiling showed that reduced motion cut homepage paint time per frame by 94%, while the deployed Store Offer fan-out returned 82 HTTP 500 responses over about four seconds, so the highest-cost paths now have direct evidence and a clear order of attack.

This change turns that evidence into one staged performance program with measurable stop conditions. It preserves the static Astro architecture, commerce authority, visual identity, accessibility, and player/navigation contracts while addressing each proven bottleneck one at a time.

## What Changes

- Establish repeatable Home, Store, and Distro baselines, route budgets, narrow-viewport CPU-stress checks, and field Core Web Vitals review using privacy-approved data when available.
- Stop or remove continuous homepage hero grain and Ken Burns work once it is no longer visible, pre-bake the static hero color treatment, and retain the existing coarse scroll-state and reduced-motion contracts.
- Make Store price work proportional to visible content: handle disabled PRD capability once, defer below-fold price islands, preserve stable pending space, and eliminate repeated failed offer reads. Add a batch read/controller only if remeasurement proves visibility scheduling insufficient.
- Skip offscreen rendering for long Store and Distro sections with native CSS containment and tested intrinsic-size estimates. Do not add list virtualization unless containment misses the frame budget.
- Reduce global font and brand-asset cost by subsetting only with verified Greek and Latin Extended coverage, removing unused font weights, and routing optimized assets through the existing fingerprinted immutable-cache policy.
- Keep shell navigation interception eager while lazy-loading dormant cart, player UI, overlay UI, and route-specific portals on first intent; preserve persistent player behavior and focus/scroll routing semantics.
- Remove off-home hero scroll work and other duplicate navigation work only after the higher-priority slices are measured; defer blur removal, partial-document routing, and low-value decorative animation changes unless traces still identify them as material.
- Re-profile after every slice and stop when its acceptance threshold is met, preventing speculative rewrites, new performance frameworks, CDN/DAM adoption, or unrelated visual redesign.

## Capabilities

### New Capabilities

- `frontend-runtime-performance`: Defines route-level load and scroll budgets, long-page rendering containment, font-delivery constraints, staged measurement, and evidence-based escalation rules.

### Modified Capabilities

- `app-shell-and-player`: Bounds homepage hero animation lifetime and initial shell work while preserving same-document navigation, focus/scroll reset, overlays, and player persistence.
- `commerce-checkout`: Makes Store Offer presentation work visible-content-aware and handles browser-safe disabled capability without per-card failure fan-out while preserving Worker/Stripe authority and fresh reads.
- `site-images`: Adds preprocessed hero treatment and right-sized fingerprinted Public Brand Assets without weakening current responsive image and first-viewport priority rules.
- `tooling-validation`: Adds repeatable browser performance profiles, fixed stress conditions, error/request-count checks, and per-slice regression evidence.

## Impact

- Frontend surfaces: homepage hero CSS/markup, persistent app shell and its dormant UI imports, Store price display, Store and Distro grouping, font loading, and public brand assets.
- Validation: Browser Use remains the rendered-check authority; focused unit/build-output checks and bounded hosted diagnostics supplement it. Existing `pnpm test:unit`, `pnpm check`, and `pnpm build` gates remain mandatory for behavior changes.
- Commerce: Store Offer freshness, fail-closed behavior, checkout revalidation, and browser-safe response shapes remain unchanged. A collection/batch endpoint is conditional and would require focused Worker/client contract work only if the simpler visible-card strategy misses its budget.
- Hosting: the existing static Astro output and fingerprinted Cloudflare Pages asset policy remain. No Pages Functions, SSR, service worker, image CDN, DAM, cache-authority change, or new runtime observability backend is introduced.
- Coordination: shared asset changes must preserve the active PRD holding-page asset-copy contract; the full Distro catalog is the stress fixture, not a reason to weaken catalog or provider-authority requirements.
