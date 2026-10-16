## Decisions

### Treatment

The owner asked to reuse the Sidus processing. Live probes of colour, plain grayscale and brightened grayscale over the existing hero shade (`.codex-artifacts/hero-video/probes/`) showed the source is dark (mean luma about 40/255): plain grayscale nearly disappears under the approved shade. The recommended brightened grayscale was adopted when the owner answered only the watermark question; colour remains a re-encode away if the owner asks. Grayscale also compresses smaller and needs no runtime filter, so the render-work requirement keeps its no-filter rule.

### Studio logo

The owner ruled that the BlackBox Studio logo must never appear on the site. Its bounding box is measured across every source frame; each delivered file's crop window excludes it by at least 32 source pixels, recorded geometrically and visually in the media evidence. The landscape file keeps its native crop resolution instead of upscaling.

### Files and selection

Portrait screens get a 608 × 1080 centre crop and other screens a landscape crop, selected by `(orientation: portrait)` and swapped on change. A full-viewport phone hero shows only about a quarter of a 16:9 frame's width, so a 1280 × 720 file (the Sidus small profile) would be soft there while carrying unseen pixels. Ceilings: portrait under 2 MiB, landscape under 4 MiB (the existing desktop film ceiling). The full montage loops because its first and last shots join.

### Playback

A `<home-hero-film>` custom element, registered by the existing Home loader island beside `<motto-word-cycle>`, drives the `<video>` in the aria-hidden media layer. In the owner-approved 16 October 2026 revision, a head script marks the document film-capable before first paint when neither reduced motion nor data saving is requested. The video carries autoplay and preload="auto"; an inline script beside it sets the orientation source while the page parses, loading the film at once without waiting for the still. On film-capable visits the still is not painted while waiting for playback; a 2.5-second safety net reveals it on a stalled connection. No JavaScript, reduced motion, data saving, source error or refused autoplay shows the still at once. An orientation swap keeps the current frame. An `AbortError` from a pause racing a pending play is not treated as a refusal. After UAT review the owner removed the hero's pause/resume button, so pausing is automatic only; the pre-order film keeps its control. This departs from WCAG 2.2.2 (Pause, Stop, Hide) for a decorative loop longer than five seconds: reduced motion still keeps the still, and the film stops once the hero is half scrolled away.

The film sits inside the fixed media layer, so it shares the existing ghost fade and veil without another fixed element. The in-view, visible-tab and music-session pause rules are unchanged. It stops once less than half the hero is in view; by then the ghost has reached its faintest opacity, so later Home content scrolls over a paused frame.

## Risks

- Autoplay can be refused in low-power modes; the still remains.
- Hosted delivery of the two files counts toward Pages static assets; no Stream, R2 or transformation service is introduced.
