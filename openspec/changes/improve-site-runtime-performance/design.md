## Context

The frontend is a static Astro application with one eagerly hydrated React app shell. The shell owns same-document navigation, detail overlays, the persistent music player, cart UI, loading feedback, and route-specific portals. Store prices remain Worker-owned and are intentionally fetched with fresh-read semantics.

The audit isolated separate costs rather than one general "slow site" problem:

| Surface              | Measured evidence                                                                                                                                                         | Main mechanism                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Home scroll          | Reduced motion lowered main-thread time per frame from 1.80 ms to 0.74 ms and paint time from 0.70 ms to 0.04 ms; a narrow 4x-CPU trace contained 10 frames above 16.7 ms | Infinite Ken Burns and grain animation, runtime filter, blend mode, and fixed full-viewport layers continue after the hero is passed       |
| Store load           | 83 Astro islands, 82 no-store Store Offer reads, 1,984 elements, 2.24 MB transferred, and about 5.2 seconds until requests settled                                        | Every price island uses `client:load`; four-at-a-time reads and React updates continue during early scrolling                              |
| Hosted Store failure | 82 of 82 sampled Store Offer reads returned HTTP 500; a four-concurrency replay took 4.08 seconds                                                                         | Expected disabled/unready presentation is not resolved once before per-item work begins, and the underlying hosted failure is not isolated |
| Long catalogs        | Store is about 23,197 px tall; Distro is about 19,537 px with 79 cards; neither uses `content-visibility` or containment                                                  | The browser styles, lays out, and paints a large offscreen document tree                                                                   |
| Brand font           | A globally preloaded 312,816-byte WOFF2 triggered an observed 1,017 ms font-related layout event and repeated 1.03-1.12 second cold-load long tasks                       | Large global font, broad preload, and unhashed public delivery                                                                             |
| App shell            | The eager shell closure is 14 modules and about 130.8 KiB Brotli                                                                                                          | Cart, player UI, overlay UI, and route-specific portals are imported before intent on every route                                          |
| Images/assets        | Hero 2000w output is about 482 KiB; footer logo is about 101 KiB at a roughly 76 px slot                                                                                  | Runtime hero treatment and oversized unhashed Public Brand Assets remain after responsive image work                                       |

Several existing choices are already sound and stay in place: static Astro output, responsive/lazy card images, eager high-priority hero loading, passive/rAF-coalesced hero scroll state, immutable caching for fingerprinted assets, fail-closed commerce authority, and reduced-motion support.

The archived `remove-homepage-hero-scroll-opacity-transitions` change intentionally preserved the fixed hero effects. The new trace evidence supersedes that non-goal, but not its requirement to avoid opacity-transition churn and per-scroll CSS-variable writes.

## Goals / Non-Goals

**Goals:**

- Remove the measured continuous homepage scroll cost without redesigning the hero.
- Make Store hydration and Worker reads proportional to visible shopper demand.
- Keep long Store and Distro pages in the DOM while skipping offscreen render work.
- Reduce global font, hero, logo, and initial shell costs without weakening visual identity or behavior.
- Use fixed, repeatable profiles and stop after each slice meets its gate.
- Preserve accessibility, responsive images, same-document navigation, player persistence, Worker/Stripe authority, and fail-closed checkout behavior.

**Non-Goals:**

- Rebuild the app shell, adopt Astro SSR, replace React, or add a client router.
- Add list virtualization, a batch Store Offer API, partial-document routes, a service worker, a CDN/DAM, or a custom RUM backend before simpler measures are proven insufficient.
- Cache Store Offers, capability state, checkout state, stock, or provider mappings as static authority.
- Lazy-load the homepage hero or remove responsive image output.
- Remove all blur, animation, or visual texture across the site without trace evidence.
- Change product content, commerce identities, Store Offer response authority, or deployment URL behavior.
- Treat local Lighthouse-style scores or a single trace as field performance proof.

## Decisions

### 1. Apply one measured slice at a time

Implementation follows this order:

1. Freeze a reproducible baseline and diagnose the hosted Store 500 response.
2. Remove continuous homepage hero render work.
3. Defer and deduplicate Store price work.
4. Add native offscreen containment to Store and Distro.
5. shrink and fingerprint font, hero-treatment, and brand assets.
6. Split dormant app-shell UI from the eager path.
7. Re-profile navigation, blur, and decorative effects and act only on remaining measured bottlenecks.
8. Run final lab, hosted, accessibility, and available field-data checks.

Each slice records before/after evidence under `.codex-artifacts/runtime-performance/<commit-or-run>/`. Artifacts are diagnostic output, not product source. A slice that meets its gate closes without implementing its fallback.

This order attacks the largest measured scroll and request costs first while keeping changes independently reversible. It also prevents a broad rewrite from hiding which change produced an improvement.

### 2. Use explicit acceptance profiles and budgets

The baseline uses the built production frontend, declared route, exact commit, stable local or hosted URL, cache state, viewport, device-pixel ratio, CPU/network setting, and run count. Cold-load numbers use at least five cache-cleared runs and report median and p75. Scroll numbers use at least three settled traces over the same route segment and report median, p95, maximum, and long-task count.

| Gate                                                              | Target                                                                                                                                                |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Field Core Web Vitals, when a representative 28-day sample exists | p75 LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1, separated by mobile/desktop and route class where the provider permits                                   |
| Fixed-profile lab load                                            | Home LCP <= 2.0 s; Store and Distro LCP <= 2.5 s; CLS <= 0.1 on all three routes                                                                      |
| Narrow 4x-CPU settled scroll                                      | No repeatable application-attributable task >= 50 ms; p95 main-plus-paint work <= 8 ms; no application-attributable main or paint slice above 16.7 ms |
| Home after hero threshold                                         | No running infinite hero animation and no painted fixed filter/blend/grain layer                                                                      |
| Disabled Store listing                                            | One deduplicated capability read, zero Store Offer reads, and zero Store-related 5xx responses before shopper intent changes                          |
| Enabled Store listing                                             | Only cards inside the configured visibility margin start Store Offer reads; below-margin cards remain idle until approach                             |
| Initial app-shell closure                                         | <= 95 KiB Brotli while keeping shell navigation interception eager                                                                                    |
| Brand font                                                        | <= 160 KiB transferred for the critical brand font and no repeatable font-triggered task >= 50 ms in the 4x-CPU profile                               |
| Main-site logo derivative                                         | <= 40 KiB and no more than twice the largest required rendered dimension                                                                              |
| Desktop hero candidate                                            | <= 350 KiB in the declared 1440x900 DPR-1 profile without visible quality regression                                                                  |

The absolute load gates protect user experience; before/after values explain the improvement. If field data is unavailable or undersampled, the report says so and relies on lab gates instead of claiming a field pass.

Browser Use remains mandatory for rendered behavior, responsive layout, focus, scroll, overlays, player continuity, and console checks. When Browser Use cannot expose CPU throttling or frame/paint trace data, Chrome DevTools profiling is allowed only as the documented capability fallback; the evidence records that limitation.

### 3. Remove continuous hero effects before changing layout architecture

The first hero slice preserves the current hero geometry and priority image behavior. It creates one reviewed source treatment that bakes in the required monochrome/contrast and any approved static texture. Runtime `filter`, oversized animated grain, `mix-blend-mode`, and infinite Ken Burns work are removed from the default path.

The existing coarse hero threshold remains. Once the hero is beyond that threshold, its decorative media layers must not continue animation or paint work. Returning to the top restores the static composition. Reduced motion continues to disable nonessential motion.

Changing fixed positioning to absolute positioning is not the default because an uncontrolled browser-only A/B increased some raster work. Positioning changes require a fresh isolated trace after the effects are removed. A future motion request may use one finite transform-only animation, but this change does not preserve motion for its own sake.

The hero scroll mechanism is installed only while the homepage owns the hero. No scroll listener or rAF callback remains active on non-home routes. The existing no-per-frame-variable-write contract stays intact.

### 4. Make Store price work visibility-aware and capability-aware

The Store listing keeps authoritative prices in Worker Store Offers. It changes when work begins, not where authority lives.

`StoreOfferPriceDisplay` uses Astro `client:visible` with a small tested root margin on listing cards. The current visible label frame remains in server HTML so deferred hydration causes no card-height shift. Detail and checkout routes may keep eager price behavior because their single price is first-viewport content.

A shared, listing-lifetime promise deduplicates the browser-safe capability read across visible price islands. Its lifetime begins with the first mounted listing price island and ends when the last listing island unmounts on route exit; a rejected capability read is cleared immediately, and a full reload or explicit listing refresh starts a new read. The resolved value is presentation state for that mounted listing only and is never reused by checkout start. If native checkout is disabled, every listing price resolves to the existing unavailable state from that one capability result and no per-item Store Offer read begins. If enabled, each visible card performs its fresh Store Offer read and checkout start still revalidates authority.

Expected disabled or unready commerce states must be represented by browser-safe fail-closed responses, not a repeated per-card 5xx storm. The first task diagnoses the deployed 500 path. If it is an expected readiness condition or repository code defect, the Worker route maps it to the existing non-buyable contract or fixes the owning code seam with focused coverage. Worker configuration, D1 catalog/readiness data, provider state, and deployed environment remediation remain owned by the relevant readiness or Catalog Promotion change and require explicit environment authority; this change records and hands off such a defect without mutating it.

Failed visible reads are not automatically retried during the same mount/visibility cycle. A route reload or explicit later shopper action may retry. This prevents error storms while retaining fresh-read semantics.

A batch endpoint is not part of the initial implementation. After visibility deferral, the enabled Store profile must be remeasured. Only if request scheduling or island overhead still misses the gate will the design and delta specs be amended before adding a bounded, no-store, per-item-result batch contract. Static prices and cached commerce authority are never fallback options.

### 5. Use native offscreen rendering containment, not virtualization

Distro groups and bounded Store card chunks receive `content-visibility: auto` plus tuned `contain-intrinsic-size`. Store chunks use the smallest wrapper structure that preserves the current grid and card DOM; no generic virtual-list component is introduced.

Intrinsic sizes are measured separately for narrow and wide layouts so skipped sections reserve plausible space. Browser checks cover scrollbar stability, shell scroll reset, keyboard order, find-in-page, accessibility-tree presence, responsive image loading, and direct navigation. `content-visibility: auto` is preferred because the content remains in the DOM and searchable.

Chunk size and intrinsic estimates are tuning values owned by the relevant page styles, not a new configuration framework. If containment meets the scroll gate, virtualization is rejected. If it does not, the remaining trace must justify a separate virtualization proposal with accessibility and navigation design.

### 6. Shrink assets through existing build and cache paths

Font work begins with license and glyph inspection. If subsetting is permitted, the critical Veneer WOFF2 is subset from a corpus that includes fixed UI copy, repo content, Greek, and Latin Extended characters required by the product. Automated coverage checks compare the subset against the declared corpus and representative Greek/diacritic fixtures. If modification is not permitted, the font is left intact and the fallback is to narrow its usage/preload rather than ship an unlicensed derivative.

Unused Google font weights are removed after a source usage audit. The brand font is imported through Astro/Vite so the URL is fingerprinted and covered by the existing immutable asset policy. Preload remains only if an A/B shows it improves LCP without crowding the hero image or creating the font long task; otherwise normal stylesheet discovery wins.

The homepage source treatment follows the existing one-time editorial remediation workflow and stays in Astro's responsive pipeline. Header/footer UI use a fit-for-purpose local derivative through Astro/Vite when no stable public URL is required. Public originals remain only where Decap, email, or the active PRD holding-page copy contract needs a stable path. No new cache taxonomy or media service is introduced.

The active `publish-prd-holding-page` change shares Veneer/logo inputs. Its asset closure must complete first, or the performance asset slice must rebuild and verify the holding artifact before completion.

### 7. Split dormant shell UI with direct dynamic imports

`AppShell` remains `client:load` because navigation interception, focus/scroll reset, route state, and event bridges must be ready immediately. The initial closure keeps only those immediate duties.

Cart drawer UI, player presentation/iframe code, overlay presentation, mobile sheet content, and route-specific portals load through direct dynamic imports on their first existing intent signal. No registry, factory, dependency-injection layer, or new state library is introduced. Small shared state/event bridges may remain eager when moving them would complicate session ownership more than it saves.

The first interaction may show the existing accessible loading feedback while a chunk arrives. Once loaded, player sessions still minimize, reopen, survive shell-managed navigation, and stop under the established contract. Direct detail loads and non-shell routes remain unchanged.

The build manifest provides the Brotli closure measurement. Passing behavior with a closure above 95 KiB is not enough; further direct import movement continues until the gate is met or evidence documents that immediate contractual code is the remaining floor.

### 8. Defer secondary changes unless the new trace names them

The passive/rAF hero handler itself measured below 0.4 ms, and fixed-header blur removal did not materially improve the isolated A/B. Therefore the change removes off-home hero work but does not globally replace header or modal blur.

After primary slices, profiles cover:

- shell navigation into Store and Distro, including full-document parse and main swap;
- overlay and active/minimized-player scroll with backdrop blur;
- duplicate full-page and partial prefetch on intercepted detail links;
- repeated scroll-position writes during shell transition;
- small infinite listen-indicator effects.

If none creates a repeatable budget miss, it is recorded as no action. A main-only partial-route architecture, global blur removal, or broad animation cleanup requires separate evidence and, where architectural, a separate OpenSpec change.

## Risks / Trade-offs

- **Hero loses subtle motion or texture** -> Use a reviewed precomposed source, compare desktop/mobile screenshots, and prefer static visual fidelity over continuous background work.
- **`client:visible` shows pending copy shortly before a card enters view** -> Use a small measured root margin and preserve a stable label box; do not return to eager full-grid hydration.
- **Capability short-circuit hides a price while checkout is disabled** -> This matches the current price component's fail-closed behavior; never substitute static content price. Verify product copy in Browser Use.
- **Containment estimates cause scrollbar movement** -> Tune narrow/wide intrinsic sizes from rendered measurements and fail Browser Use checks on visible jumps.
- **Font subset drops a future glyph** -> Include declared Greek/Latin Extended ranges and a repository-content coverage check; retain a fallback stack. Do not subset if the license or coverage cannot be proven.
- **Dynamic imports delay first cart/player/overlay use** -> Reuse existing loading feedback and preload only from direct intent where measurement supports it.
- **Performance numbers vary by machine or network** -> Record the full profile, use medians/p95 over repeated runs, and compare only like-for-like evidence.
- **Asset edits conflict with the PRD holding page** -> Sequence the shared asset slice after its closure or rebuild and revalidate that artifact in the same slice.
- **Hosted diagnostic touches Worker/D1 limits** -> Keep the URL set and request count bounded; do not load-test, create checkout, mutate provider state, or warm caches.

## Migration Plan

1. Capture the baseline and commit/run metadata before source changes.
2. Apply each decision slice in order, with focused tests and a before/after profile before starting the next slice.
3. Deploy static/frontend-compatible slices to UAT first. Run Browser Use against UAT for hosted asset and routing behavior; use the bounded hosted audit for cache/status evidence.
4. Keep commerce changes fail-closed and validate Local mock plus UAT Worker paths before PRD. No live payment or provider mutation is required for performance acceptance.
5. Promote only after final gates and hosted read-only evidence pass. Field CWV is observed after rollout when sufficient samples exist; insufficient field data is recorded, not treated as failure or success.

Rollback is slice-based: restore the prior hero asset/CSS, return a listing island to eager hydration, remove containment wrappers/styles, restore the prior font import, or restore eager shell imports independently. No data migration, destructive API migration, cache purge, or commerce-state rollback is required. If a conditional batch contract is later approved, it receives its own compatibility and rollback plan before implementation.

## Open Questions

No product decision blocks implementation. License/glyph inspection, hosted Store 500 diagnosis, preload A/B, and per-slice trace results are explicit implementation gates with defined fallback behavior; they do not authorize broader architecture automatically.
