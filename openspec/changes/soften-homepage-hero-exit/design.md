## Context

Home currently uses one passive, animation-frame-coalesced scroll helper to toggle `homepage-hero-section--scrolled` at a coarse threshold. That class hides the fixed media and shade immediately, so the image exit is abrupt.

An earlier implementation wrote scroll progress on every frame while opacity transitions were active. A measured 900-millisecond mobile scroll produced 105 property writes and hundreds of transition starts and cancellations, so the current baseline forbids opacity transitions. The coarse helper has since removed that failure mode: it mutates the class only when the threshold side changes. This change intentionally narrows the prohibition rather than restoring progress-driven motion.

`improve-site-runtime-performance-round-two` still owns the transition-free Home contract while its final validation remains open. This change may be planned now but must not be implemented until that predecessor archives. If the predecessor is amended instead, its design and task 7.3 must remove transition-free Home ownership and pass strict validation before this child starts.

## Goals / Non-Goals

**Goals:**

- Replace the abrupt media and shade disappearance with one restrained fade.
- Preserve the existing coarse state, route scope, reduced-motion behavior, and settled-hidden performance.
- Make the media and shade lifecycle derive from one existing class so independent visual states cannot drift.
- Reuse existing CSS, tests, Browser validation, and performance profiles.

**Non-Goals:**

- Scroll-linked progress, continuous parallax, scale, Ken Burns, grain, filter, blur, or layout-property motion.
- New markup, JavaScript state, listeners, keyframes, dependencies, feature flags, animation tokens, or `will-change` hints.
- Changes to the scroll indicator, route loading, player, threshold calculation, or later catalog-discovery items.

## Decisions

1. **Use an opacity-only CSS transition on the existing media and shade layers.**

   Both layers transition together for 180 milliseconds with the existing `cubic-bezier(0.22, 1, 0.36, 1)` curve. Opacity directly fixes the visible defect without moving or resampling the full-viewport image. A scale or transform was rejected as decoration that adds work without solving another problem.

2. **Keep `homepage-hero-section--scrolled` as the sole application state.**

   No `isAnimating` state is introduced. CSS derives the transient fade from the class change and naturally reverses from the current opacity if the shopper crosses back before completion.

   | Condition       | Existing class | Media and shade result                       |
   | --------------- | -------------- | -------------------------------------------- |
   | Above threshold | absent         | visible at opacity 1                         |
   | Crossing below  | added          | visible while opacity moves to 0             |
   | Settled below   | present        | opacity 0, hidden, no transition running     |
   | Reduced motion  | either         | matching endpoint immediately, no transition |

3. **Delay exit visibility only; restore it immediately on return.**

   The scrolled rule delays `visibility: hidden` until the 180-millisecond opacity fade completes. Removing the class restores visibility immediately, then lets opacity return from its current value to 1. Media and shade share the same declarations so one cannot disappear before the other.

4. **Retain every measured performance invariant.**

   The helper keeps no per-scroll custom-property writes and no same-side class mutations. The fade uses no layout property, keyframe, persistent layer hint, or infinite work. The scroll indicator remains transition-free, and its existing scrolled rule continues stopping the child animation.

   The scrolled media/shade rule has greater specificity than the existing reduced-motion layer selectors, so reduced motion must add an equally specific override that removes both the opacity transition and delayed visibility change. Relying on source order alone is invalid.

5. **Amend the strict baseline only after its current owner closes.**

   The delta renames the transition-free requirement to a threshold-bounded motion requirement and preserves its no-churn scenarios. Implementation follows the archive of `improve-site-runtime-performance-round-two`. An amendment is acceptable only when its design and task 7.3 remove the conflicting ownership and the amended change passes strict validation.

## Risks / Trade-offs

- [The old transition churn returns] → Keep one coarse class as authority, retain the same-side no-mutation test, and reject any progress property or new scroll write.
- [Invisible fixed layers keep working] → Delay visibility only during the bounded exit, then require the stable scrolled state to be hidden and animation-idle.
- [Full-viewport compositing regresses Home scroll] → Animate opacity only for 180 milliseconds and rerun the existing wide and mobile Home profiles before acceptance.
- [Reduced-motion users receive decorative motion] → Use a specificity-safe scrolled override for both opacity and visibility timing, then verify immediate endpoints in Browser Use.
- [The active performance change and this child conflict] → Block implementation until the predecessor archives or releases Home ownership.

## Migration Plan

1. Archive the predecessor, or amend its design and task 7.3 to release Home transition ownership and pass strict validation, before touching Home CSS.
2. Add the focused regression expectation, then the grouped CSS declarations.
3. Validate normal, reverse, interrupted, reduced-motion, and settled-hidden states.
4. Roll back by removing the bounded transition and restoring immediate visibility; no data or compatibility migration is required.

## Open Questions

None.
