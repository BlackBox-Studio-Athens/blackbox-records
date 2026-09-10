## Context

Home renders one eager responsive hero image as a fixed full-viewport layer. Its shade is hero-scoped, and News, Artists, and Newsletter use static translucent surfaces above the image. A passive, animation-frame-coalesced helper toggles `homepage-hero-section--scrolled` only when the shopper crosses a coarse threshold.

The first Ghost Crossfade iteration used opacity `0.28` behind 90–94% section veils. Its motion worked, but the combination exposed only 1.68–2.8% of the image through later sections, producing a hybrid where the image was clear in gaps and nearly absent beneath content. The True Persistent Background then used `0.18` with more open section veils, followed by a `0.12` subtle ghost. The final near-black tuning retains that endpoint while fading a black veil over the image on the same bounded curve.

Existing bounded-fade and Static Plate profiles show application-work p95 well below the 8-millisecond budget. The revised design keeps their cheapest properties: one already-loaded image, one coarse class mutation, one native opacity transition, and no continuous scroll-linked work.

## Goals / Non-Goals

**Goals:**

- Keep the existing Home hero image fixed and visible until the shopper leaves Home.
- Crossfade the media from opacity `1` to `0.12` while an internal black veil moves from opacity `0` to `0.5` over the same 240 milliseconds, then reverse both above the threshold.
- Keep the hero shade limited to the first viewport and transition-free.
- Keep the ghost visibly continuous through News, Artists, and Newsletter while preserving readable text, opaque cards and controls, and an opaque footer ending.
- Preserve the coarse scroll cue, route scope, same-side no-mutation behavior, reduced-motion endpoints, and existing performance budgets.
- Reuse the existing image, DOM, helper, section veils, CSS test surface, Browser validation, and performance runner.

**Non-Goals:**

- Hiding or removing the image while Home remains active.
- A second image or image-to-image dissolve; “crossfade” means compositing the existing image against the static dark surfaces by changing only its opacity.
- Parallax, scroll timelines, scroll-linked progress, scale, Ken Burns, grain, runtime filter, blur, blend mode, animated `background-position`, or layout-property motion.
- New markup, a second fixed element, image variants, JavaScript state, listeners, dependencies, feature flags, animation tokens, containment experiments, or `will-change` hints.
- Extending the image to another route or allowing it to remain visible above the opaque footer.
- Redesigning News cards, Artist cards, Newsletter content, route loading, the player, or catalog-discovery surfaces.

## Decisions

1. **Use the existing media layer as one persistent ghost.**

   The media layer remains `position: fixed`, fills the viewport, and stays visible while Home owns its DOM. Its resting opacity is `1`. The existing scrolled class changes that layer to opacity `0.12` through `opacity 240ms cubic-bezier(0.22, 1, 0.36, 1)`. An absolute `::after` veil inside the layer uses `#050505` and the same transition, moving from opacity `0` to `0.5`. No `visibility`, delay, transform, keyframe, duplicate background image, filter, blend mode, or second fixed element participates.

   Removing the scrolled class uses the same native transitions back toward media opacity `1` and veil opacity `0`. If threshold direction changes mid-transition, CSS reverses both from their current interpolated values; no second application animation state or timer is added.

   The ghost exists only while the Home hero DOM exists. Shell navigation destroys that DOM on route change and recreates it when Home returns, so no global backdrop state or cleanup path is added.

2. **Keep the shade hero-scoped and transition-free.**

   The existing shade remains above the image and below hero content, but its containing hero carries it out of the viewport through normal document scrolling. It does not share the media opacity transition. This keeps the approved first-viewport darkness while avoiding a second fixed full-viewport layer behind later content.

3. **Retain static section veils as the content surface.**

   News, Artists, and Newsletter remain above the ghost. News and Newsletter retain one CSS-generated full-width underlay each; Artists retains its full-width surface. No markup change is required.

   Surface values are tuned with the quieter ghost so its maximum contribution stays close across each section:

   | Home region | Static surface          | Image contribution after black veil |
   | ----------- | ----------------------- | ----------------------------------- |
   | News        | `rgb(13 13 13 / 76%)`   | 1.44%                               |
   | Artists     | `rgb(20 20 20 / 78%)`   | 1.32%                               |
   | Newsletter  | `rgb(13 13 13 / 74%)`   | 1.56%                               |
   | Footer      | Existing opaque surface | 0%                                  |

   Cards retain their opaque surfaces. Veils use plain backgrounds only: no backdrop filter, blur, gradient, shadow, mask, clip animation, or blend mode.

4. **Reuse the coarse helper for the crossfade and scroll cue.**

   `homepage-hero-section--scrolled` continues to toggle only when threshold side changes. That class selects the media ghost endpoint and hides the cue immediately while stopping its child animation. The helper, threshold calculation, passive listeners, animation-frame coalescing, same-side guard, and route cleanup remain unchanged unless a focused test proves a contract mismatch.

   Scroll events do not write opacity, progress, or any media style property. They only schedule the existing coarse class synchronization.

5. **Make reduced-motion endpoints immediate.**

   Reduced motion keeps both visual states but removes both transition durations. Crossing the threshold immediately applies media opacity `0.12` and veil opacity `0.5`; returning immediately restores media opacity `1` and veil opacity `0`. Existing reduced-motion rules continue disabling the scroll-cue animation and other nonessential Home animation.

6. **Treat performance as a rejection gate.**

   Retained bounded-fade and Static Plate profiles are comparators. Production Home profiles run at wide and mobile sizes with at least three first traversals, three repeat traversals, and a settled sample. Acceptance requires:
   - application-attributable main-thread plus style, layout, and paint work p95 no greater than 8 milliseconds per frame;
   - no application-attributable task or long animation frame of at least 50 milliseconds;
   - no new image request or decode for the ghost;
   - no repeated hero-attributable `Paint`, `RasterTask`, image decode, animation, or layer invalidation after the 240-millisecond transition settles;
   - no same-side class churn or per-scroll media style/property writes.

   Retained startup, font, browser, extension, or tooling outliers stay in the evidence and are classified rather than discarded. If the Ghost Crossfade fails a gate, implementation reports the rejection and pauses for a new design decision. It does not add `will-change`, containment, extra layers, or a new animation system to force a pass.

## Risks / Trade-offs

- [The black fade removes all image character] → Cap the internal veil at `0.5`, leaving about 6% raw image strength and 1.32–1.56% through section surfaces, then verify the full Home scroll before acceptance.
- [A fixed translucent image causes compositor or raster work] → Animate only opacity once per threshold change and reject the implementation if first, repeat, or settled traces show attributable work outside the existing budgets.
- [The opacity change still feels thresholded] → Use the selected 240-millisecond ease-out and test slow, fast, and interrupted threshold crossings in Browser Use.
- [Stacking lets the ghost or shade cover later content] → Retain the shared section stacking level, keep the shade hero-scoped, and verify every section plus the footer.
- [The ghost leaks onto another shell route] → Retain route-scoped helper cleanup and verify Home-to-section navigation plus return to Home.
- [Reduced-motion behavior diverges] → Apply the same opacity endpoints without a transition and retain the cue shutdown test.

## Migration Plan

1. Update the CSS contract for the retained `0.12` ghost plus an internal black veil moving from `0` to `0.5`, then confirm the current implementation fails it.
2. Add only the absolute veil inside the existing media layer and include it in reduced-motion transition shutdown.
3. Use Browser Use at mobile and desktop widths to verify first-viewport parity, fade quality, consistent section visibility, text/control readability, footer coverage, reduced motion, shell navigation, and console cleanliness.
4. Run the declared settled and first/repeat performance profiles. Accept only if every performance gate passes.
5. Run repository and strict OpenSpec validation on the final tree.

## Open Questions

None.
