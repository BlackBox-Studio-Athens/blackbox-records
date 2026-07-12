## 1. Preconditions And Round-Two Baseline

- [x] 1.1 Run `pnpm openspec:guard`; confirm `main`, the main worktree, and the exact implementation-start commit.
- [x] 1.2 Record all pre-existing dirty-tree paths and active-change overlaps; do not edit or stage unrelated work.
- [x] 1.3 Confirm `improve-site-runtime-performance` remains archived and its five performance capability deltas exist in baseline specs.
- [x] 1.4 Update `docs/runtime-performance.md` with the desktop cold, mobile stress, wide first/repeat scroll, mobile first/repeat scroll, and legacy narrow regression profiles from the design.
- [x] 1.5 Add or update the smallest local measurement helpers needed to produce deterministic scroll cadence, first-versus-repeat labels, frame intervals, main/style/layout/paint totals, tasks, and long animation frames without a new dependency.
- [x] 1.6 Capture five cache-cleared 1440×900 DPR-1 production loads for Home, Store, Distro, Artists, Services, About, Releases, and News.
- [x] 1.7 Capture at least three cache-cleared 390×844 DPR-2, 4× CPU, 150 ms RTT, 1.6 Mbps mobile-stress loads for Home, Store, Distro, Artists, Services, and About.
- [x] 1.8 Capture at least three wide first traversals and three wide repeat traversals for Home, Store, and Distro, without discarding the first run as warm-up.
- [x] 1.9 Capture at least three mobile first traversals and three mobile repeat traversals for Store and Distro.
- [x] 1.10 Re-run the legacy 390×844 DPR-1, 4× CPU, 48 px/rAF for 240 frames Store and Distro profile and retain p95, maximum, and long-task count.
- [x] 1.11 Record disabled-PRD Store price labels, hydrated islands, capability requests, Store Offer requests/statuses, 5xx responses, and settle timing at route top and after the declared first-scroll segment.
- [x] 1.12 Record the current Veneer SHA-256, byte size, request URL, discovery path, `font-display`, response cache headers, and font-attributed trace events.
- [x] 1.13 Record scoped app-shell closure, complete first-party eager graphs for representative routes, route-specific chunks, StoreCart/Zod contribution, and third-party analytics separately using actual hosted Brotli sizes.
- [x] 1.14 Capture Browser Use mobile/desktop reference screenshots and accessibility/console checks for Home, Store, Distro, Artists, Services, About, route loading, cart, overlay, mobile navigation, and player states.
- [x] 1.15 Store all baseline evidence under a commit-tagged `.codex-artifacts/runtime-performance/` directory and add the concise baseline section to the future `PERF-003` report.

## 2. Distro First-Traversal Slice

- [x] 2.1 Map Distro group/card DOM, responsive breakpoints, current strict containment, intrinsic sizing, image loading, focus order, and shell-managed route ownership before editing.
- [x] 2.2 Add focused regression coverage that fails on card-level `contain: strict`, fixed 40 rem card block sizing, blank activation corridors, or loss of full server-rendered catalog/source order.
- [x] 2.3 Remove per-card strict/fixed containment and test the smallest semantic Distro group or bounded chunk boundaries with measured narrow and wide intrinsic sizes.
- [x] 2.4 Run Browser Use before any repeat traversal to verify first-scroll card appearance, scrollbar stability, headings, links, keyboard order, find-in-page, responsive images, no overflow, and shell scroll reset.
- [x] 2.5 Re-run Distro desktop/mobile load plus first/repeat scroll profiles; accept grouped containment only if every load and traversal gate passes.
- [x] 2.6 If grouped containment misses first scroll, implement one route-owned ahead-of-viewport activation path that yields between bounded groups and retains each activated group until route exit.
- [x] 2.7 Add focused tests for activation margin, retained state, route-exit cleanup, route-change cancellation, user-input yielding, and no generic virtualization/node recycling.
- [x] 2.8 Re-run the complete Distro profile matrix after retained activation and stop at this rung if every gate passes.
- [ ] 2.9 If retained activation still misses, disable `content-visibility` only for the failing Distro route/breakpoint and prove its cold-load LCP, CLS, and responsiveness remain passing.
- [x] 2.10 If neither contained nor eager Distro rendering passes both load and traversal gates, stop implementation and amend OpenSpec before pagination or virtualization.
- [ ] 2.11 Run focused Distro tests, `pnpm test:unit`, `pnpm check`, and `pnpm build`; record the accepted rung, before/after values, and rejected fallbacks before starting Store.

  Distro blocker: eager/native rendering removes all traversal layout activation and passes load/application-work gates, but the comparable runner still reports 19.9 ms wide and 18.1 ms mobile first-scroll frame p95 against the absolute 16.7 ms gate. See PERF-003. Task 2.9 and acceptance task 2.11 remain open.

## 3. Store First-Traversal Slice

- [x] 3.1 Map Store chunk/card DOM, individual containment, Astro price-island roots, `client:visible` margin, capability promise lifetime, cart portal work, and route breakpoints before editing.
- [x] 3.2 Extend Store regression coverage so rendering activation cannot hydrate a price island or start a capability/Store Offer request outside the tested price visibility margin.
- [x] 3.3 Remove harmful per-card containment and test the smallest semantic Store chunks or route/breakpoint eager strategy using the same ladder as Distro.
- [x] 3.4 If Store still misses first scroll, add bounded retained activation ahead of the viewport without changing price-island visibility demand or Store Offer authority.
- [x] 3.5 Run Browser Use on the first traversal before warm-up; verify stable price-label geometry, card appearance, cart access, source/keyboard order, find-in-page, no overflow, and no visible input stall.
- [x] 3.6 Re-run Store desktop/mobile load plus first/repeat scroll profiles after each accepted rung; stop at the smallest strategy that passes all gates.
- [x] 3.7 Prove disabled PRD still issues exactly one capability read, zero Store Offer reads, and zero Store-related 5xx responses through route top, first traversal, repeat traversal, and route exit.
- [x] 3.8 Run a bounded enabled Local or UAT check proving only price islands inside the declared visibility margin start fresh Store Offer reads and checkout start still revalidates authority.
- [x] 3.9 Confirm no batch Store Offer endpoint, static price, cached commerce authority, checkout, Worker, D1, stock, order, Stripe, or provider change was introduced.
- [x] 3.10 If Store cannot pass both load and traversal gates, stop and amend OpenSpec before batching, pagination, or virtualization.
- [ ] 3.11 Run focused Store/checkout tests, `pnpm test:unit`, `pnpm check`, and `pnpm build`; record the accepted rung and before/after evidence before font work.

  Store blocker: grouped chunks and retained activation miss first-scroll gates; eager rendering also fails mobile load. No Store rendering rung is retained. See PERF-003. Acceptance task 3.11 remains open.

## 4. License-Safe Veneer Delivery Slice

- [x] 4.1 Preserve the existing public `veneer_regular.woff2` as immutable input and add a byte-identical Astro/Vite-owned main-site copy without subsetting, conversion, glyph removal, outline extraction, or derivative generation.
- [x] 4.2 Add a focused SHA-256 parity check covering the main-site and stable Holding Page copies and failing on any byte difference.
- [x] 4.3 Declare main-site Veneer from bundled CSS with `font-display: optional`, the existing fallback order, and a fingerprinted build URL.
- [x] 4.4 Remove the full main site's dependency on `/assets/fonts/brand/veneer.css` while retaining the stable public font/CSS pair required by the PRD Holding Page.
- [x] 4.5 Change the stable public declaration to prevent a late swap and keep the Holding Page preload only if its own repeated A/B remains layout-safe.
- [x] 4.6 Verify production output requests only the fingerprinted main-site font on normal routes, applies the immutable cache policy, and does not request the stable public font path.
- [x] 4.7 Run `pnpm prd:holding:prepare` and `pnpm prd:holding:check`; prove the closed artifact retains its exact byte-identical font, CSS, no-third-party, no-API, and no-analytics contract.
- [x] 4.8 Add or update focused tests for optional display, no global main-site preload, fingerprinted URL, immutable cache coverage, hash parity, and Holding Page stable-path ownership.
- [x] 4.9 Use Browser Use with font request blocked and cached to check English, Greek, accents/diacritics, long headings, navigation, cards, Store/checkout labels, and Holding Page layout at mobile and desktop widths.
- [x] 4.10 Re-run at least three equivalent current-versus-optional A/B traces; prove no repeatable font-attributed task or long animation frame reaches 50 ms and no late layout burst remains.
- [ ] 4.11 Run focused font/holding tests, `pnpm test:unit`, `pnpm check`, `pnpm build`, asset checks, and cache-policy checks; record exact hash, bytes, URLs, headers, LCP, CLS, and layout results.

## 5. About, Services, And Artists LCP Slice

- [x] 5.1 Add an explicit first-viewport priority input to `InternalPageHero` without making overlay or later-fragment media eager by default.
- [x] 5.2 Add 1200w to the shared hero candidate ladder and set About direct-load hero to eager high priority with stable dimensions and current crop.
- [x] 5.3 Mark only the first direct-load Services feature image eager and high priority; keep subsequent Services media lazy with normal priority.
- [x] 5.4 Audit the Artists grid order and responsive columns; keep only the expected first-viewport portraits eager, assign high priority only to the expected LCP portrait, and leave later portraits lazy.
- [x] 5.5 Remediate the measured Ouranopithecus source or candidate through the existing editorial/Astro image workflow until the selected 480w candidate is at most 100 KiB without crop, detail, subject-placement, or alt-text regression.
- [x] 5.6 Add focused markup/build-output tests for one high-priority content image per direct page, About's 1200w candidate, Services priority cardinality, Artists eager/lazy boundaries, and the Ouranopithecus selected-candidate budget.
- [x] 5.7 Use Browser Use on direct and shell-managed About, Services, and Artists at mobile/desktop widths; verify crop, layout stability, no duplicate priority, and lazy behavior below fold.
- [x] 5.8 Capture five cache-cleared desktop runs and at least three mobile-stress runs for all three routes; require LCP at most 2.5 s and CLS at most 0.1.
- [x] 5.9 Re-run Releases and News desktop cold profiles to confirm the shared component/image changes do not regress their passing route class.
- [ ] 5.10 Run focused image tests, `pnpm assets:check`, `pnpm test:unit`, `pnpm check`, and `pnpm build`; record candidate bytes, request priority, LCP element, LCP, CLS, and screenshots.

  Image verification blocker: focused tests, asset QA, unit tests, and the production build pass. `pnpm check` stops only on the unrelated untracked catalog-discovery spec's existing Prettier warning. See PERF-003.

## 6. Route-Proportional JavaScript Slice

- [x] 6.1 Add a repeatable build-output check for complete first-party eager graphs per route using actual Brotli size, while reporting the scoped shell and third-party analytics separately.
- [x] 6.2 Add characterization tests for Artists filters, Services inquiry, Store cart button/drawer, StoreCart event handling, malformed localStorage, shell navigation, overlay, player, and mobile menu before changing import boundaries.
- [x] 6.3 Move shared cart event names into the smallest dependency-free module so the eager bridge no longer imports checkout presentation code.
- [x] 6.4 Split Artists filters, Services inquiry form, and Store cart portal presentation behind direct dynamic imports owned by the active pathname or existing first-intent/container signal.
- [x] 6.5 Preserve usable server content and accessible loading/error behavior while a route-specific portal chunk loads or fails.
- [x] 6.6 Characterize `store-cart.ts` Zod acceptance, rejection, normalization, quantity bounds, duplicate-line behavior, version handling, and malformed-storage recovery with unknown input.
- [x] 6.7 Replace browser-only StoreCart Zod parsing with the smallest explicit parser only if the characterization suite remains equivalent and the eager graph materially shrinks; otherwise retain Zod and record the evidence-gated no-action.
- [x] 6.8 Keep Zod unchanged at API, Worker, money, and other authoritative trust boundaries; add no new schema or state dependency.
- [x] 6.9 Rebuild and require Home's complete first-party eager graph at or below 95 KiB hosted Brotli, the scoped shell at or below 95 KiB, and no unrelated route portal in representative route graphs.
- [x] 6.10 Measure third-party analytics in an isolated repeated A/B; retain current deferred behavior if no material LCP or long-task cost is attributable.
- [x] 6.11 If analytics is material, delay startup to a bounded post-load idle point while preserving required direct-load and shell-route page-view behavior; add no provider replacement in this child.
- [ ] 6.12 Use Browser Use to validate first-click Artists filters, Services submit path, cart open/add/update, mobile menu, detail overlay, player open/minimize/reopen/stop, shell navigation, focus reset, and scroll reset.
- [ ] 6.13 Run focused shell/cart tests, `pnpm test:unit`, `pnpm check`, and `pnpm build`; record before/after route graphs, interaction latency, and any retained conditional no-action.

## 7. Hidden And Closed Animation Slice

- [ ] 7.1 Change route-loading CSS so the bar has no animation in its closed state and owns `route-loading-sweep` only while the indicator is open.
- [ ] 7.2 Stop the Home scroll-cue child animation when the coarse scrolled class hides its parent; restore it only when Home returns above the threshold.
- [ ] 7.3 Preserve reduced-motion rules, active loading meaning, hero orientation, and the existing transition-free coarse threshold.
- [ ] 7.4 Extend focused CSS/state tests for closed loading, open loading, scrolled cue, restored cue, non-Home route, and reduced motion.
- [ ] 7.5 Re-run the settled Home 4× CPU comparison and prove hidden/closed nonessential infinite animation work is absent.
- [ ] 7.6 Use Browser Use to verify route-loading visibility, completion/cancellation, Home cue visibility, reduced motion, console cleanliness, and no focus or pointer regression.
- [ ] 7.7 Run focused animation/shell tests, `pnpm test:unit`, `pnpm check`, and `pnpm build`; record the before/after settled task and animation evidence.

## 8. Final Performance, UX, And Program Closure

- [ ] 8.1 Re-run the complete desktop cold, mobile stress, wide first/repeat, mobile first/repeat, and legacy narrow matrices against the exact final tree.
- [ ] 8.2 Report median, p75, p95, maximum, task/LoAF count and time, transfer bytes, requests, route errors, LCP element, font events, and first-versus-repeat results without combining unlike profiles.
- [ ] 8.3 Re-prove disabled PRD Store request behavior and run only bounded authority-safe enabled Local/UAT diagnostics; create no checkout or mutation.
- [ ] 8.4 Check Search Console/CrUX or PageSpeed Insights for representative 28-day mobile/desktop field data; label it unavailable or low-confidence when undersampled and add no custom RUM.
- [ ] 8.5 Run Browser Use across representative mobile/desktop direct loads, shell navigation, first/repeat scroll, keyboard/focus, cart, checkout presentation, overlays, mobile nav, player lifecycle, font fallback/cached states, image crop, reduced motion, and console/network cleanliness.
- [ ] 8.6 Run focused tests plus `pnpm test:unit`, `pnpm check`, `pnpm build`, `pnpm assets:check`, cache-policy checks, Holding Page prepare/check, and any changed runbook helper tests against the exact final tree.
- [ ] 8.7 Run independent Brooks and Ponytail reviews over the final implementation and evidence; fix correctness, architecture, accessibility, or unnecessary-complexity findings and rerun affected gates.
- [ ] 8.8 Run `pnpm openspec -- validate improve-site-runtime-performance-round-two --strict` and strict validation for the full spec set.
- [ ] 8.9 Create `PERF-003` with like-for-like before/after values, comparison limits, field confidence, first/repeat traversal, accepted rungs, rejected fallbacks, and any residual issue.
- [ ] 8.10 Append `PERF-003` to `../site-performance-program/performance-report-log.md` and update the epic register/tasks without rewriting `PERF-001` or `PERF-002`.
- [ ] 8.11 Confirm no framework rewrite, batch Store API, virtualization, pagination, service worker, CDN/DAM, custom RUM, new dependency, or font-byte modification entered the final diff.
- [ ] 8.12 After every child task and report gate is complete, archive round two so its delta specs become baseline while leaving the Site Performance Program open for measured future work.
