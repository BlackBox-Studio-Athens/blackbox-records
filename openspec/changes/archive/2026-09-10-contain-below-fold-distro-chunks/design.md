## Selected design

The native containment expansion and eager rendering with the original typography both failed. See `README.md` for the rejected traces. The user's follow-up authorizes the bounded revisions needed to close all 23 tasks without relaxing acceptance budgets.

Use the existing server-rendered Store listing, Distro six-card chunks, and shared controller. Keep Store listing cards and Distro catalog chunks eager in normal, search, reduced-motion, and enhancement-disabled states. In enhanced preview, retain the actual chunk grids and invisibly lay out non-preview cards at catalog width. Positioned Coverflow cards remain visible. Scope preview-only card geometry and hidden details to those six positioned cards; the remaining cards keep their catalog styles instead of applying and reversing preview rules on every descendant. This preserves one canonical DOM, source order, the fixed preview stage, and full-catalog disclosure without blank intrinsic-size corridors, observers, virtualization, or duplicate nodes.

Store listing and Distro card titles use the existing UI display font, while page/group headings retain Veneer and all font assets remain unchanged. The existing Google font stylesheet uses `display=optional` to bound late font replacement. Cards use flex stretch instead of nested percentage heights; outer single-column grids use explicit `minmax(0, 1fr)` tracks. Cards also use native layout and inline-size containment, with no block-size or paint containment and no intrinsic-size estimate, to bound disclosure reflow. Preserve square covers, responsive columns, content, links, and equal-height rows.

Disclosure applies catalog state and `aria-expanded` synchronously. Resolve styles in the input task, then allow a complete native rendering frame before focus and scrolling. Check the existing revision token before that deferred focus, so search, format selection, cleanup, or navigation cancels obsolete work. Keep the current reveal animation and busy-control lifecycle. This separates the measured style and layout work without a new scheduler or content-rendering lifecycle.

## Evidence behind the decision

The original native expanded-catalog baseline contains 120–160 ms layouts; the original eager experiment shifts the stall into 840–1,009 ms disclosure handlers. A font-only control reduces one mobile disclosure handler to 42.5 ms, but chunk activation and late Inter replacement still produce 28–34 ms and 121 ms layouts respectively. Eager chunks eliminate those traversal layouts.

Raw setup traces isolate the remaining eager disclosure as approximately 22 ms style plus 54 ms layout in one input task. Retaining invisible grid layout reduces layout to approximately 31 ms. Separating style resolution from next-frame focus passes the first direct and shell mobile disclosure diagnostics: no 50 ms tasks and approximately 194 ms visual completion. These diagnostics select a candidate; only the full final-tree matrix accepts it.

Explicit widths, outer flex stacks, title wrapping changes, surface-only flex, inline-size containment, percentage-height removal, and flex chunk rows were insufficient individually. Do not reintroduce them as standalone fixes or describe them as accepted evidence.

Expanded Store All must also be measured: its single 104-card Coverflow group is not covered by preview scrolling. The first wide expanded runs exposed 190–208 ms layouts and 200–224 ms tasks, despite the Distro candidate already eliminating traversal layouts. Extend the same eager, invisible-layout, UI-title-font, and stretch-sizing remedy to StoreItemCard using existing shared mode attributes. Preserve the independent catalog views, card counts, links, image aspect ratios, and listing-price projection boundary.

## Measurement contract

Extend the existing production runner. Record revision, dirty-source hashes, build hash, URL, Product Environment, browser, cache state, profile, run count, and timestamps. Verify inputs after each run. Never commit unrelated changes to manufacture a clean measurement tree.

Assert controller readiness and record every group's mode, computed chunk display/containment, card counts, images/fonts, and scroll extent. Capture default preview and one selected expanded group per fresh context. Opening View all may scroll to its selected card; record that setup separately and preserve first/repeat labels. Later-group and small-group behavior requires explicit evidence.

Retain raw setup and traversal traces. Report individual script, style, layout, paint, task, and long-animation-frame maxima alongside windowed work; windowed p95 cannot conceal a long slice. Keep first traversal, slow runs, font/image activity, and external failures. Any same-profile low-work cadence control changes only the documented frame-interval allowance, never application-work or load budgets. Native requestAnimationFrame timestamps measure frame cadence; separately retain performance.now callback intervals, which include dispatch/microtask delay. Capture a following frame after the final scroll step so every input has a measured rendering interval. Keep old callback-clock reports as diagnostics, without claiming a direct before/after cadence improvement across the clock change. All raw rendering/task gates remain unchanged.

## Acceptance and closure

Run three equivalent wide/mobile/legacy Store All and Distro traces, separating preview and expanded catalog. Run five cold mobile loads per route, three Store activations, disclosure checks, and Browser Use at desktop and 390 pixels. Verify search, format jumps, complete content, Coverflow, overlays/player, keyboard/focus/find-in-page, reduced motion, and enhancement-disabled fallback. Reject clipping, overflow, failed images, blank corridors, input stalls, or scroll jumps.

Run focused regressions plus all required repository checks. Keep source/build inputs stable across final measurements. Update this child's and production readiness's evidence only with actual outcomes. Synchronize the delta and archive only after every remaining task passes. No backend, commerce, request-authority, deployment, or public-launch behavior changes.

## Final acceptance decision — 2026-09-10

On 2026-09-10 the user explicitly accepted this implementation with its recorded caveats and authorized closure. This is a change-specific acceptance exception, not a claim that every raw timing meets the original gate: mobile disclosure records 51 ms uninstrumented and 51–77 ms with tracing; wide traversal has occasional large low-CPU spans whose attribution remains inconclusive. Original budgets and raw failures remain intact for future work. No further renderer change is required for this slice. Synchronize the implemented behavior and archive with the caveats retained; this does not grant hosted UAT/PRD or launch acceptance.
