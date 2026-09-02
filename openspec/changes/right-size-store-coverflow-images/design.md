## Context

See `proposal.md` for motivation. Commit `81ce9976` produced repeatable mobile-stress LCP around 3.26 seconds for Store All and Store Distro, with roughly 5.5–5.8 MB transferred. Commit `46a78e3f` corrected the Coverflow `sizes` metadata and reduced transfer to 3.05 MB and 3.33 MB, with LCP improving to 2.68 and 2.76 seconds. Browser Use still found the complete canonical card graph and visually sharp positioned covers, but both routes remain above the 2.5-second gate and Distro retains isolated first-traversal long-task/layout outliers.

The current Coverflow CSS renders covers near `56vw` below 40 rem and caps desktop covers at 16 rem. Existing card width ladders already contain useful 320, 480, and 640 pixel candidates.

## Goals / Non-Goals

**Goals:**

- Make the browser select candidates from the actual Coverflow slot geometry.
- Remove initial competition between three eager Coverflow covers without adding a runtime loader.
- Keep Store Item and Distro Coverflow image behavior aligned.
- Preserve server-rendered catalog completeness and all current interaction semantics.
- Stop after the smallest responsive-metadata change that passes the measured gates.

**Non-Goals:**

- No new image loader, client hydration, preload manager, observer, carousel dependency, or generated asset.
- No card removal, virtualization, pagination, batching, static price, or commerce-authority change.
- No source-image edits, width-ladder expansion, controller change, or visual Coverflow redesign.
- No optimization of Home, Artists, or unrelated route findings in this child.

## Decisions

### Use one conditional `sizes` value in each existing card component

When `coverflowPreview` is true, both card components use `(min-width: 40rem) 16rem, 56vw`. Otherwise they retain their existing catalog-grid `sizes`.

This is the smallest change that tells the browser the truth while preserving Astro image handling and current source sets. The same literal is deliberately repeated at the two image-owning components and protected by one parity test; a shared module for one static HTML hint would add a dependency edge without removing meaningful behavior.

Alternative considered: add a deferred-image template/controller. Rejected because Browser Use proves hidden cards already remain unloaded, so request cardinality is not the cause. Alternative considered: shrink width ladders. Rejected because the same cards need larger candidates in complete catalog mode.

### Represent Store card loading as one three-state mode

The existing Store collection module exports `StoreCardImageLoadingMode = 'priority' | 'eager' | 'lazy'`. Both image-owning card components accept that single mode and derive browser attributes from it: `priority` becomes eager loading with high fetch priority, `eager` becomes eager loading with automatic fetch priority, and `lazy` becomes lazy loading with automatic fetch priority.

This keeps eager discovery and fetch priority coherent without adding an independently configurable boolean. The type lives in an existing module already imported by both cards, so sharing it adds no new dependency edge.

Alternative considered: retain `imageLoading` and add an `imagePriority` boolean. Rejected because callers could represent contradictory states such as lazy plus high priority. Alternative considered: add a new image-policy module. Rejected because one type in the existing Store collection module is sufficient.

### Give high priority only to the initial first-viewport cover

An eligible Store category gives `priority` only to entry zero and marks every other entry lazy. A non-Coverflow category preserves its current first-three-eager behavior.

Store Distro gives `priority` only to the first entry when its first rendered group is Coverflow-eligible. Every other cover in that group and every later group remains lazy. When the first group is not Coverflow-eligible, the existing global leading-three eager set remains unchanged and later below-fold Coverflows receive no high priority.

Native lazy loading handles neighboring covers as they become relevant. Next/Previous interaction does not rewrite loading or fetch-priority attributes, so the existing controller remains unchanged.

### Measure the current route shape

The archived vertical traversal profiles still run for comparability, but Store acceptance also uses the existing same-document Store activation profile and direct Coverflow interaction. The report must classify static-only local listing-price `404` responses separately from Store 5xx and provider behavior.

The accurate slot metadata result is retained as a successful first rung. The active-cover-only priority pass is measured separately against the same route shape and profiles. If it still misses a gate, retain the evidence and amend the child only after identifying the remaining responsible work.

## Risks / Trade-offs

- **A slot hint is too small for high-DPR active covers** → Keep the existing 480 and 640 candidates and verify mobile/desktop sharpness through Browser Use.
- **The two card components drift** → Add one focused source/markup parity assertion for the exact preview contract and unchanged catalog sizes.
- **A lazy neighboring cover is not ready during immediate traversal** → Verify first and repeat Next/Previous traversal in Browser Use; keep native lazy loading unless a measured failure proves it insufficient.
- **Active-only priority does not fix the trace** → Retain before/after evidence and amend rather than layering speculative loading code.
- **Static preview returns listing-price 404** → Record it as frontend-only API unavailability; require zero Store 5xx and unchanged one-projection/zero-per-card counts.

## Migration Plan

1. Preserve raw evidence for `81ce9976` and `46a78e3f` under the ignored runtime-performance folder.
2. Add focused failing coverage for the three-state mode and initial-priority policies.
3. Add the shared type, update the two image-owning cards, and update only their existing Store renderers.
4. Commit the implementation, rebuild, and rerun Store/Distro mobile load, Store activation, fixed traversal, and Browser Use against that exact commit.
5. When every gate passes, record accepted evidence in the parent readiness README, sync the delta, and archive this child. When any gate fails, keep the child active and record the exact miss before another amendment.

Rollback is one code commit plus its focused tests. No data, provider, dependency, content, or infrastructure rollback is required.
