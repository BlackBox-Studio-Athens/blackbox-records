## 1. Freeze the baseline and isolate failures

- [ ] 1.1 Record the implementation-start commit, dirty-tree exclusions, active-change overlap, and Product Environment URLs; keep unrelated `publish-prd-holding-page` and services-content work outside this change.
- [ ] 1.2 Add the repeatable runtime-performance profile/runbook with the exact cold-load and settled-scroll matrix, Browser Use authority, trace fallback rule, evidence fields, and `.codex-artifacts/runtime-performance/` output convention.
- [ ] 1.3 Capture five cache-cleared cold loads and three settled-scroll traces for Home, Store, and Distro at the declared desktop and narrow 4x-CPU profiles; record medians, p75/p95, maxima, long tasks, bytes, resources, and screenshots.
- [ ] 1.4 Capture the initial app-shell dependency closure and Brotli size, critical font and brand-asset bytes/cache headers, selected hero candidate, Store island count, capability/offer request counts, statuses, and request-settle time.
- [ ] 1.5 Reproduce one bounded deployed Store Offer 500 response, trace it through the public route and application/persistence seams, and classify it as an expected readiness state, code defect, missing runtime configuration, or deployed data defect without printing secrets.
- [ ] 1.6 Add the smallest regression fixture needed to hold the diagnosed Store failure path before changing behavior; keep provider mutation, checkout creation, stock mutation, and load testing out of the diagnostic.

## 2. Remove continuous homepage hero cost

- [ ] 2.1 Capture mobile and desktop reference screenshots of the current hero crop, contrast, type legibility, static texture, threshold state, and reduced-motion state.
- [ ] 2.2 Produce one reviewed, license-safe homepage source treatment with the approved monochrome/contrast and static texture baked in; keep it in Astro's Content Image pipeline and verify the declared desktop candidate is at most 350 KiB.
- [ ] 2.3 Update `HomeHero.astro` and the hero rules in `global.css` to remove the runtime image filter, animated oversized grain/blend layer, and infinite Ken Burns animation while retaining stable geometry and priority-responsive image delivery.
- [ ] 2.4 Make the existing scrolled threshold stop decorative hero animation/paint work behind later content and restore the static composition when the shopper returns above the threshold.
- [ ] 2.5 Update `shell-hero-scroll-progress.ts` and its app-shell connection so synchronization exists only on Home and disconnects on shell navigation away from Home without reintroducing per-scroll CSS variables or opacity transitions.
- [ ] 2.6 Extend focused hero tests for no infinite effect animation, no runtime filter/blend/grain work, route-scoped synchronization, coarse threshold mutation, and reduced motion.
- [ ] 2.7 Run Browser Use at mobile and desktop widths for first viewport, threshold crossing, return-to-top, same-document route changes, reduced motion, visual parity, focus, layout, and console cleanliness.
- [ ] 2.8 Re-run the Home cold-load and narrow 4x-CPU scroll profiles, compare them with the baseline, and document whether fixed positioning needs any further isolated A/B; do not change positioning when the hero gate already passes.

## 3. Make Store price work follow visible demand

- [ ] 3.1 Resolve the diagnosed Store 500 only when its root is an expected readiness mapping or repository code defect; add focused success/error/cache-header coverage, but hand Worker configuration, D1 catalog/readiness data, provider state, or deployed-environment remediation to the owning readiness/Promotion change without mutating it here.
- [ ] 3.2 Add one listing-lifetime deduplicated Store capability read, clear it when the last listing island unmounts or the read rejects, start a new read after route return/full refresh, and short-circuit disabled Product Environments before any per-item Store Offer read; never reuse it for checkout authority.
- [ ] 3.3 Change Store listing card price hydration from `client:load` to `client:visible` with a small measured root margin; retain eager hydration for the single first-viewport price on Store detail and checkout routes.
- [ ] 3.4 Reserve stable pending/unavailable price-label geometry so deferred hydration and Worker responses do not change card height or create CLS.
- [ ] 3.5 Prevent an unsuccessful visible Store Offer read from retrying automatically during the same mount/visibility cycle; keep route reload or later explicit shopper action as the fresh-read retry boundary.
- [ ] 3.6 Extend focused frontend tests for capability deduplication, listing-exit/failure invalidation, disabled zero-offer behavior, enabled visible-offer behavior, stable pending/unavailable copy, no same-cycle retry, and unchanged detail/checkout authority.
- [ ] 3.7 Extend backend/client contract tests for the diagnosed handled failure, `no-store` response policy, browser-safe fields, and current fixed/custom Store Offer discriminated response shape.
- [ ] 3.8 Use Browser Use and bounded network evidence against Local mock plus an appropriate hosted Product Environment to verify disabled `1 capability / 0 offers / 0 Store 5xx`, enabled visible-only reads, progressive scroll reads, stable cards, and console cleanliness.
- [ ] 3.9 Re-run Store load and scroll profiles; if visibility deferral passes, record batching as unnecessary, otherwise amend this design and commerce specs with measured evidence before adding any bounded batch contract.

## 4. Skip offscreen Store and Distro rendering

- [ ] 4.1 Measure representative narrow and wide heights for existing Distro groups and candidate Store chunks, choose the smallest fixed chunking that preserves the current grid, and record the intrinsic-size estimates beside the owning styles.
- [ ] 4.2 Apply `content-visibility: auto` and tuned `contain-intrinsic-size` to existing Distro groups without changing catalog order, image priority rules, filters, links, or semantic headings.
- [ ] 4.3 Add minimal Store chunk wrappers and the same native containment strategy without introducing a generic virtual-list component, pagination, or client-owned catalog state.
- [ ] 4.4 Add focused markup/style checks proving containment and intrinsic-size rules cover only bounded offscreen catalog groups while the complete catalog remains server-rendered.
- [ ] 4.5 Use Browser Use at narrow and wide widths to verify first and scrolled viewports, scrollbar stability, shell scroll reset, keyboard order, find-in-page, accessibility-tree access, responsive/lazy images, card links, no horizontal overflow, and no console errors.
- [ ] 4.6 Re-run Store and Distro narrow 4x-CPU scroll profiles and tune only chunk size/intrinsic estimates until p95 and maximum frame gates pass or evidence identifies a different bottleneck.
- [ ] 4.7 Record virtualization, pagination, and infinite scrolling as unnecessary when native containment passes; if it fails, open a separate evidence-backed OpenSpec proposal instead of expanding this slice silently.

## 5. Reduce font and first-party asset cost

- [ ] 5.1 Inspect the Veneer license, current glyph table, fixed UI strings, repo content corpus, representative Greek/Latin Extended fixtures, and actual CSS font/weight usage before producing any derivative.
- [ ] 5.2 Remove unused Google font families or weights from `SiteLayout.astro` only after source and rendered-route usage proves they are unused; preserve operator-only typography where its route still needs it.
- [ ] 5.3 If legally permitted, create a WOFF2 subset no larger than 160 KiB and add a coverage check for the declared corpus/fixtures; if not permitted or incomplete, keep the original and implement the documented usage/preload-scope fallback.
- [ ] 5.4 Route the critical brand font through Astro/Vite fingerprinting, update `@font-face` and preload references, and keep the existing immutable-cache taxonomy rather than adding a new public versioning convention.
- [ ] 5.5 Run a preload A/B under the fixed cold-load profile and retain preload only if it improves LCP without delaying the hero or creating a repeatable font-triggered task of at least 50 ms.
- [ ] 5.6 Create a fit-for-purpose fingerprinted header/footer logo derivative no larger than 40 KiB and at most twice its largest rendered slot; retain stable public originals only for documented Decap, email, metadata, or holding-page consumers.
- [ ] 5.7 Complete or coordinate with the `publish-prd-holding-page` asset-copy contract, rebuild its artifact when shared font/logo inputs changed, and verify its closed no-API/no-analytics/no-third-party-request behavior.
- [ ] 5.8 Extend asset/build-output checks for license decision evidence, glyph coverage, font/hero/logo byte budgets, selected candidates, fingerprinted URLs, cache classification, intrinsic dimensions, and one-primary-image priority.
- [ ] 5.9 Run `pnpm assets:check`, Browser Use visual checks, the fixed cold-load/font trace, and bounded hosted header checks; confirm no crop, banding, glyph, fallback, layout, LCP, or cache regression.

## 6. Split dormant app-shell code from startup

- [ ] 6.1 Map the final eager app-shell closure from the build manifest and classify each import as immediate navigation/event duty or first-intent cart, player, overlay, mobile, or route-specific UI.
- [ ] 6.2 Keep `AppShell` on `client:load` and keep same-document interception, route state, focus/scroll reset, and minimal event bridges eager; do not replace the shell or add a loader registry.
- [ ] 6.3 Move cart drawer and mobile-sheet presentation behind direct dynamic imports triggered by their existing open intents, reusing established accessible loading feedback.
- [ ] 6.4 Move player presentation and iframe-session code that is not required before play intent behind a direct dynamic import while keeping single-session ownership and event handoff stable.
- [ ] 6.5 Move detail-overlay presentation and route-specific portals behind their existing first-intent or route-owned dynamic imports without changing direct-load routes or partial-route contracts.
- [ ] 6.6 Extend focused tests for immediate navigation readiness, first-use loading/error behavior, cart open/close, mobile menu, overlay open/close, and player open/minimize/reopen/navigate/stop continuity.
- [ ] 6.7 Build and measure the eager closure after each direct-import slice; stop moving code when the closure is at most 95 KiB Brotli and remaining eager code is required by immediate contracts.
- [ ] 6.8 Use Browser Use to validate header/footer/mobile section switches, focus and scroll reset, Store/Distro navigation, detail overlays, cart, player continuity, back/forward behavior, first-intent loading, and console/network cleanliness.

## 7. Close secondary evidence gates

- [ ] 7.1 Re-profile shell navigation into Store and Distro after island and containment work, separating full-document fetch, `DOMParser`, main replacement, hydration, and scroll-reset costs.
- [ ] 7.2 Re-profile Home/Store/Distro scrolling with the content overlay, active player, minimized player, and fixed header states; record whether any backdrop blur creates a repeatable frame-budget miss.
- [ ] 7.3 Inspect intercepted detail-link traffic for duplicate full-page plus partial prefetch and remove one owner only when the trace confirms duplicate requests; preserve same-session cache and direct-load behavior.
- [ ] 7.4 Inspect repeated shell-transition scroll-position writes and small infinite listen-indicator effects; make only the focused deletion or native replacement justified by a repeatable trace.
- [ ] 7.5 Record no action for fixed-header/global blur, partial-document route architecture, virtualization, batch Store Offers, and broad decorative-animation cleanup when primary slices meet their gates; create separate OpenSpec proposals for any architectural fallback that remains necessary.

## 8. Final validation and report

- [ ] 8.1 Run focused tests for every changed slice, then run `pnpm test:unit`, `pnpm check`, and `pnpm build` on the exact final tree.
- [ ] 8.2 Run `pnpm assets:check` and cache-policy validation when font/image/public asset behavior changed; verify generated markup, fingerprinting, cache headers, and no source-map or route-policy regression.
- [ ] 8.3 Run the full Browser Use matrix for Home, Store, Distro, header/footer/mobile navigation, focus/scroll reset, overlays, cart, player, reduced motion, narrow/wide layout, accessibility, and console cleanliness.
- [ ] 8.4 Repeat five final cold loads and three final settled-scroll traces per representative route with the baseline profiles; publish a before/after table for every numeric gate and identify any excluded noise.
- [ ] 8.5 Run bounded read-only UAT/PRD diagnostics for static asset headers, Store capability/offer status, request counts, and holding-page closure where applicable; do not create checkout or mutate provider/D1 state.
- [ ] 8.6 Query privacy-approved field Core Web Vitals for a representative 28-day window when enough samples exist; otherwise label field evidence unavailable or low-confidence without inferring a pass.
- [ ] 8.7 Run `pnpm openspec -- validate improve-site-runtime-performance --type change --strict` and `pnpm openspec -- validate --all --strict`.
- [ ] 8.8 Publish the final performance report with before/after evidence, passed gates, field-data confidence, rollbacks, conditional fallbacks skipped as unnecessary, and any separately proposed follow-up; do not claim gains unsupported by like-for-like measurements.
