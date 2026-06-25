## Context

The homepage hero used `connectHomepageHeroScrollProgress` to write `--homepage-hero-scroll-progress` during scroll. `global.css` used that custom property to update opacity on fixed full-viewport hero layers: media, shade, grain, and scroll indicator.

UAT mobile audit evidence showed the 900 ms hero scroll window produced 105 scroll events and 105 custom-property writes. Because the opacity targets also declared short opacity transitions, those writes produced 416 `transitionrun`, 416 `transitionstart`, and 412 `transitioncancel` events. Trace parsing showed measurable style/layout churn in that window: 213 `UpdateLayoutTree` events totaling 132.9 ms. After removing opacity transitions locally, traces showed zero transition churn, but still retained per-scroll CSS variable writes. The follow-up should remove that remaining write path with one coarse threshold state.

## Goals / Non-Goals

**Goals:**

- Stop repeated opacity transition start/cancel churn during homepage hero scroll.
- Stop per-scroll custom-property writes for the homepage hero opacity state.
- Keep the visual direction with one coarse scrolled state.
- Keep the smallest implementation: CSS/scroll helper changes plus focused regression coverage.
- Validate mobile first, then desktop sanity.

**Non-Goals:**

- Do not remove the fixed hero layer structure.
- Do not remove the grain layer, image filter, Ken Burns animation, scroll cue animation, or scroll-progress JavaScript.
- Do not add smooth fade fidelity back through per-frame CSS variables.
- Do not change Astro image generation, content schema, routes, app-shell navigation, commerce, or deployment config.
- Do not add dependencies, feature flags, new animation libraries, or a broader performance harness.

## Decisions

1. Remove opacity transitions from scroll-driven hero opacity targets.

   Rationale: the measured issue is transition churn caused by continuously changing opacity values. Removing only the transitions keeps the visual fade deterministic while avoiding hundreds of start/cancel transition events.

   Alternative considered: throttle/debounce the scroll progress writer. Rejected for this slice because it changes fade fidelity and does not address the direct CSS transition churn.

2. Replace `--homepage-hero-scroll-progress` writes with a threshold class.

   Rationale: local traces proved transition churn was removed, but the remaining write path still invalidates style on every scroll frame. A single class toggle when the hero crosses the coarse scrolled threshold is the smallest follow-up.

   Alternative considered: replace the JavaScript progress writer with CSS scroll-linked animations. Rejected as too broad for this slice and unnecessary for a two-state hero fade.

3. Add focused CSS-level regression coverage.

   Rationale: the failure mode is declarative CSS. A narrow test that asserts the affected selectors no longer include opacity transitions is cheaper and more stable than a synthetic browser performance threshold.

   Alternative considered: add automated trace assertions. Rejected because trace thresholds are environment-sensitive and overbuilt for a one-rule regression.

## Risks / Trade-offs

- The fade is now a threshold change instead of a continuous fade. Mitigation: use a midpoint threshold and verify visually with Browser Use on mobile.
- Some transition declarations may be shared with reduced-motion overrides. Mitigation: inspect affected selectors and keep reduced-motion rules valid, but do not expand the change outside homepage hero selectors.
- The user may still feel slowness after this fix if fixed layers, grain blend mode, or continuous animations are costly on their device. Mitigation: leave those as follow-up candidates only after this smallest fix is validated.
