## Context

The completed `extend-store-coverflow-interactions` change moved All and Distro Coverflows onto `StoreCoverflowController.ts`. Current wheel handling accepts horizontal-dominant input or `Shift` + vertical wheel, accumulates 48 normalized pixels, moves once, then ignores the rest of that gesture until a 160ms gap. The controller has no `keydown` listener because the predecessor explicitly kept Left Arrow and Right Arrow native.

Flat Store categories use `StoreItemCard`, whose availability badge remains inside the artwork frame when card copy is hidden for Coverflow. Distro uses `DistroCard`, whose availability copy is inside the hidden content area. Shared Coverflow CSS also suppresses the normal card-image hover/focus zoom, while All still exposes a clearer inner-surface hover transition than Distro in the rendered preview.

The change must retain route-owned canonical card nodes, the existing six-position renderer, touch swipe behavior, disclosure modes, Distro search ownership, shell snapshot sanitation, reduced-motion fallback, and Store activation request limits. The predecessor is archived into baseline before this follow-up is applied or strictly validated.

## Goals / Non-Goals

**Goals:**

- Make ordinary vertical mouse-wheel input browse a Coverflow only while the pointer is over its preview stage.
- Let sustained wheel input traverse multiple items at a controlled discrete cadence.
- Let Left Arrow and Right Arrow traverse when focus is already inside the Coverflow, without creating another focus stop or composite widget.
- Use one greater-than-six eligibility rule for every flat Store collection rendered through `StoreCollectionPage`, while keeping Distro grouped with one eligible Coverflow per group.
- Give every eligible flat Store and Distro Coverflow the same hover and focus-visible clickable cue.
- Hide availability labels and badges from every Coverflow preview while leaving expanded catalogs, unsupported/no-JavaScript fallbacks, and Store Item detail unchanged.
- Keep each input event bounded and reuse the existing reducer, renderer, listeners, cards, and tests.

**Non-Goals:**

- No document-level wheel or keyboard listener.
- No free-scrolling track, drag physics, velocity model, queued animation system, autoplay, pagination dots, or carousel dependency.
- No roving tabindex, `role="application"`, new stage tab stop, or replacement of native links and buttons.
- No change to touch thresholds, disclosure modes, wrapping, Store Item availability authority, listing prices, checkout, StoreCart, Distro search, or catalog order.
- No Coverflow for editorial Releases or Store Item detail routes.
- No removal of availability presentation from expanded catalogs or Store Item detail routes.
- No new performance study unless focused verification finds an attributable regression.

## Decisions

### 1. Apply after the completed predecessor becomes baseline

Archive `extend-store-coverflow-interactions` before applying this change. This makes its `store-coverflow-interactions` requirement set available for a normal `MODIFIED Requirements` delta and avoids contradictory active deltas for wheel and arrow-key behavior.

Alternative considered: reopen the completed predecessor. Rejected because this request is a user-tested follow-up with distinct acceptance criteria and should retain its own proposal, tasks, and verification record.

### Universal Store eligibility and lifecycle

Every flat Store collection rendered through `StoreCollectionPage` uses the same rule: more than six canonical items may enter the shared `preview`; six or fewer remain the complete ordinary grid. This covers All, BlackBox Releases, populated Merch, and future non-Distro flat categories without category-specific controller branches. Distro remains grouped, and each group with more than six items uses the same controller and interaction contract.

App-shell mounting resolves eligible flat groups generically from Store Coverflow hooks. The Distro search component remains the sole owner of Distro controller lifecycle, so the shell does not mount a second controller for Distro groups. Editorial Releases and Store Item detail routes remain outside the enhancement.

Alternative considered: add per-category branches. Rejected because one eligibility and lifecycle contract keeps behavior aligned as categories grow and avoids duplicate state engines.

### 2. Vertical and horizontal wheel input share one stage-local path

The existing non-passive `wheel` listener remains attached only to each enhanced stage and remains active only in `preview` mode. Wheel normalization will:

- ignore `Ctrl` + wheel so browser zoom and trackpad pinch behavior remain native;
- use the dominant non-zero axis, so ordinary vertical wheel, horizontal trackpad movement, and existing `Shift` + wheel input all map to the same signed traversal delta;
- retain pixel deltas, normalize line deltas by 16px, and normalize page deltas by current stage width;
- call `preventDefault()` only for handled preview-stage input.

Wheel input outside the stage, after pointer departure, in `catalog` or `search-results` mode, or during `Ctrl` + wheel remains browser-owned.

Alternative considered: keep vertical page scroll and require `Shift`. Rejected because it is the reported usability failure. Alternative considered: add a document listener keyed by hover state. Rejected because the existing stage listener already provides the required hover boundary with less state and safer cleanup.

### 3. Sustained wheel traversal uses residual accumulation and a small repeat gate

Keep the existing 48 normalized-pixel threshold and 160ms gesture-gap reset. Remove the gesture-wide `moved` lock and track the last emitted move instead. Once accumulated input reaches the threshold:

- emit at most one signed item move per wheel event;
- subtract one threshold from the accumulator so residual intent is preserved;
- require 120ms between emitted moves within one continuing gesture;
- reset accumulated intent after a 160ms event gap or direction reversal.

This gives a conventional wheel notch one item, lets sustained trackpad or wheel input continue through multiple items, and prevents one large event from jumping an uncontrolled number of cards. The reducer still receives one `-1` or `1` move and the existing bounded renderer handles it.

Alternative considered: derive multiple steps from one delta. Rejected because page-mode or high-resolution hardware can report very large deltas and skip most of the shelf in one event. Alternative considered: queue delayed steps after input stops. Rejected because queued navigation would continue after user intent ends.

### 4. Arrow keys are focus-scoped and preserve native controls

Add one bubbling `keydown` listener to each enhanced Coverflow group. In `preview` mode, unmodified Left Arrow and Right Arrow move one item and prevent the browser default. Repeated keydown events remain enabled so holding a key can traverse at the operating system's native repeat cadence.

No listener runs at document level. Input is ignored when focus is outside the group, a modifier key is active, or the group is in `catalog` or `search-results` mode. If a positioned Store Item link owns focus, focus moves to the newly active card after rendering so focus and the front cover remain aligned. If Previous, Next, or the disclosure button owns focus, that control retains focus while the active card changes.

Alternative considered: make the stage focusable and implement roving tabindex. Rejected because existing cards and controls already provide a complete Tab sequence, and another focus model would add complexity without improving access.

### 5. One shared child-image cue covers every Coverflow

Use shared `[data-store-coverflow-card]` preview selectors for every flat Store category and Distro rather than parallel card-type or category behavior. Hover and focus-visible on an actionable positioned cover will apply the same restrained image scale and surface-border/tonal cue. Cover-position transforms remain on the outer link; only the child image and inner surface animate, so the six-position geometry is unchanged.

The shared cue will use one transition duration and easing for both card types. Under `prefers-reduced-motion: reduce`, image transform and transition remain disabled while the static border, tonal change, and visible focus ring still communicate action.

Alternative considered: copy All utility classes into Distro markup. Rejected because a shared Coverflow selector is smaller and prevents the two card components drifting again.

### 6. All preview hides one existing badge instead of branching card content

Give existing Store Item availability labels and badges stable hooks, then hide them only under any Store Coverflow group while that group is in `preview` mode. The same card nodes remain unchanged when the visitor selects `View all`, when Coverflow is unsupported, or when JavaScript is unavailable. Store Item detail availability remains outside Coverflow styling.

This makes All preview artwork-only like Distro without changing `primaryAvailability`, `canBuy`, listing-price hydration, accessible link names, or Store Item detail presentation.

Alternative considered: add a `showAvailability` component prop. Rejected because mode already exists in the DOM and a scoped presentation rule avoids another render branch per category.

### 7. Verification stays focused on changed boundaries

Extend existing pure helper and controller tests for universal flat-category eligibility, Distro group eligibility, generic mounting/no double-mounting, vertical normalization, `Ctrl` bypass, residual accumulation, repeat timing, direction reset, repeated arrow keys, focus following, control focus retention, mode bypass, and listener cleanup. Extend markup/style tests for preview-only availability suppression across flat and Distro Coverflows, shared hover/focus selectors, and reduced-motion overrides.

Browser Use verification will cover direct and app-shell entry to All, BlackBox Releases, populated Merch, and Distro, several consecutive wheel steps, pointer departure returning wheel ownership to the page, horizontal and `Shift` compatibility, held/repeated arrows from cards and controls, hover/focus parity, catalog/search bypass, disclosure transitions, and reduced motion. Final implementation runs `pnpm test:unit`, `pnpm check`, and `pnpm build`.

## Risks / Trade-offs

- **Wheel over the stage no longer scrolls the page** -> Scope prevention to the hovered preview stage only; pointer departure and non-preview modes immediately restore native page scrolling.
- **Trackpad momentum can traverse too quickly** -> Keep threshold accumulation, emit at most one move per event, and require 120ms between continuing moves.
- **Arrow navigation can separate visual and keyboard position** -> Move focus with the active card only when a card owned focus; leave native control focus stable.
- **Hover motion can compete with 3D cover movement** -> Animate only the child image and inner surface, not the outer positioned link; disable transform motion for reduced-motion users.
- **Category growth can fork behavior** -> Keep eligibility, controller, styling, disclosure, and tests shared; add a new branch only if a future category stops using the flat `StoreCollectionPage` contract.

## Migration Plan

1. Confirm the completed `extend-store-coverflow-interactions` change is archived into baseline.
2. Update generic flat-category eligibility/mounting, shared controller helpers, listeners, and focused tests.
3. Add shared preview availability hooks and Coverflow hover/focus CSS with reduced-motion coverage.
4. Run focused tests, Browser Use checks, and the required repository gates across flat Store categories and Distro.
5. Roll back by reverting this change; no data, content, API, or migration state requires repair.

## Open Questions

None. Universal eligibility is limited to flat Store collection routes and grouped Distro groups; editorial Releases and Store Item detail remain excluded.
