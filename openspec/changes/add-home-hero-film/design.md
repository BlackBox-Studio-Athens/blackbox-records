## Decisions

### Treatment

The owner asked to reuse the Sidus processing. Live probes of colour, plain grayscale and brightened grayscale over the existing hero shade (`.codex-artifacts/hero-video/probes/`) showed the source is dark (mean luma about 40/255): plain grayscale nearly disappears under the approved shade. The recommended brightened grayscale was adopted when the owner answered only the watermark question; colour remains a re-encode away if the owner asks. Grayscale also compresses smaller and needs no runtime filter, so the render-work requirement keeps its no-filter rule.

### Studio logo

The owner ruled that the BlackBox Studio logo must never appear on the site. Its bounding box is measured across every source frame; each delivered file's crop window excludes it by at least 32 source pixels, recorded geometrically and visually in the media evidence. The first release kept the native crop resolution; the third UAT revision (15 October 2026) upscales the same crops 2× because no higher-resolution master exists (see below).

### Files and selection

Portrait screens get a 608 × 1080 centre crop and other screens a landscape crop, selected by `(orientation: portrait)` and swapped on change. A full-viewport phone hero shows only about a quarter of a 16:9 frame's width, so a 1280 × 720 file (the Sidus small profile) would be soft there while carrying unseen pixels. The first release's ceilings were portrait under 2 MiB and landscape under 4 MiB (the existing desktop film ceiling). The full montage loops because its first and last shots join.

Higher resolution (owner request, 15 October 2026: higher-resolution content is the goal, AI upscaling one route). The only master is 1080p, so each logo-free crop is upscaled 2× with Real-ESRGAN general-x4v3 at denoise 0.4 (official weights, hashes in `.codex-artifacts/hero-video/upscale/provenance.json`). Of three candidates it removed the source's macroblocking, kept edges clean and showed the least frame-to-frame variation; the stronger x2plus restoration added grain-like texture and flicker, and a plain spline resample kept the blocks. H.264 at 2560 × 1440 needs about 10 MiB for comparable quality, so AV1 carries the full resolution (landscape 2560 × 1440, portrait 1080 × 1920, CRF 30, VMAF about 92) and H.264 is a lighter-resolution fallback (1920 × 1080 and 810 × 1440, CRF 26) for browsers without AV1, mainly Safari on Apple hardware older than M3/A17 Pro. The controller picks AV1 when `canPlayType('video/mp4; codecs="av01.0.12M.08"')` is not empty and retries once with H.264 if the AV1 file errors.

### Playback

A `<home-hero-film>` custom element, registered by the existing Home loader island beside `<motto-word-cycle>`, drives the `<video>` in the aria-hidden media layer. It sets the source only when playback is allowed and after the still has loaded, so the film never competes with the hero's eager image. The film fades in on `playing`, keeps its frame when paused and returns to the still for reduced motion, data saving, a source error or a refused autoplay (no retries). An `AbortError` from a pause racing a pending play is not treated as a refusal. After UAT review the owner removed the hero's pause/resume button, so pausing is automatic only; the pre-order film keeps its control. This departs from WCAG 2.2.2 (Pause, Stop, Hide) for a decorative loop longer than five seconds: reduced motion still keeps the still, and the film stops once the hero is half scrolled away.

The film sits inside the fixed media layer, so it shares the existing ghost fade and veil without another fixed element. It stops once less than half the hero is in view; by then the ghost has reached its faintest opacity, so later Home content scrolls over a paused frame.

## Risks

- Autoplay can be refused in low-power modes; the still remains.
- Hosted delivery of the two files counts toward Pages static assets; no Stream, R2 or transformation service is introduced.
