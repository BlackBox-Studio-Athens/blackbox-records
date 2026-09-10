## Context

See `proposal.md`. Coverflow preview is enabled synchronously before first paint, but Distro controller ownership currently sits behind a `window.load` gate and a route-lazy React mount. Catalog disclosure then awaits a rail-fill animation before changing mode. Existing server-rendered nodes, shared controller, shell prefetch, and snapshot sanitation are the required seams.

## Goals / Non-Goals

**Goals:**

- Close the interval where a visible disclosure control has no listener.
- Overlap the existing Distro module request with route fetch and transition work.
- Make catalog state immediate while preserving one restrained reveal.
- Keep direct loads, shell snapshots, search, format selection, and reduced motion coherent.

**Non-Goals:**

- Changing catalog rendering, image loading, containment, commerce reads, or content.
- Adding a controller registry, second React island, state library, virtualization, or pagination.
- Eagerly loading Distro search for unrelated navigation.

## Decisions

### Retain one activation at the progressive-enhancement boundary

Extend the existing synchronous capability bootstrap with one capture-phase click handler. If a Coverflow toggle belongs to a group without the readiness marker, set one transient pending-disclosure attribute. Native keyboard activation also produces a click, so no document-level keydown listener is needed.

After the shared controller attaches every group listener and performs initial rendering, it removes and consumes the first pending marker. A marker is a one-bit handoff, not a general event queue; repeated early activations coalesce. Cleanup, snapshot sanitation, and enhancement fallback remove it.

Alternative: hide or disable the control until readiness. Rejected because it delays access and does not honor the visitor's first visible activation. Alternative: move controller ownership from Distro search into the shell. Rejected because it introduces shared controller state and lifecycle plumbing across components.

### Start the existing route-lazy import earlier

Use the same dynamic import path already owned by `React.lazy` during Distro link prefetch and Store activation. Browser module caching deduplicates the request. The portal connects immediately when its server-rendered target exists; mounting still occurs only while Distro is active.

Alternative: make Distro search part of the initial shell bundle. Rejected because it weakens route-proportional JavaScript loading.

### Apply state before animation

Disclosure sets catalog state, accessible toggle state, focus, and nearest-block scroll before collecting reveal animations. Remove the `catalog-pending` rail-fill phase and shorten the existing hard-edged reveal to 180ms. Cover navigation and collapse timing remain unchanged.

Alternative: keep the 180ms rail prelude and only preload the module. Rejected because measured wall time remains dominated by authored delay after readiness.

Reduced motion retains the existing static grid and animation suppression, but keeps the overview controls and counts visible as required by the disclosure spec. Remove the reduced-motion selector that hides the controls; reuse the existing controller and accessible actions.

### Extend existing checks

Add focused controller/bootstrap tests and extend the established runtime-performance script instead of adding a new runner. The delayed-module profile proves first-click retention; fixed ready-controller profiles measure state and reveal milestones.

## Risks / Trade-offs

- [Speculative preload runs on unrelated navigation] → Gate both preload sites by normalized `/store/distro/` pathname and retain code-splitting source contracts.
- [Pending intent survives cached HTML] → Sanitize it with existing Coverflow transient attributes and remove it during all fallback and cleanup paths.
- [Immediate focus or scroll causes layout instability] → Keep instant nearest-block behavior and verify desktop, mobile, zoom, search, and format-selection flows.
- [Short reveal loses intended character] → Preserve the existing hard-edged reveal surface; remove only the serial rail prelude.

## Migration Plan

1. Land contract tests and lifecycle changes together.
2. Run focused unit tests, full repository gates, production-output runtime profiles, and Browser Use acceptance.
3. If intent preloading regresses route budgets or loads on unrelated routes, remove only speculative prefetch while retaining immediate portal connection and first-click handoff.
4. Deploy through the normal static frontend workflow; no data migration or feature flag is required.
