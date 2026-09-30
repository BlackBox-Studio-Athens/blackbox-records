# Local acceptance: Artist image hover

Verified September 30, 2026 in the managed worktree on `codex/artist-image-hover`, based on source SHA `f8202bae9de39fd6a7b7f94da679457d3c86e0c6`.

## Implementation and decisions

- The product diff changes only the three ArtistCard image class strings. Existing fitting, frame sizes, overlays, links, responsive widths, and loading priorities are preserved.
- Keep this single transform in CSS, following the existing Motion adoption decision. Motion remains available for coordinated transitions; no script or dependency is added.
- Design Library patterns `MOTION-03` and `STATE-02` informed the reduced-motion and visible-focus checks. Store-navigation guidance is not treated as a ban on image zoom.
- The default card variant is checked in source; current public routes render the featured and detailed variants.

## Browser acceptance

Chrome's blackbox profile, through the native GPT extension, verified the worktree site at `http://127.0.0.1:4321/blackbox-records/`.

- Artists roster and homepage Artist images reach computed scale `1.03` with a `0.5s` transition, matching the rendered News image.
- Pointer exit restores the original scale. The roster card stays stationary; its desktop image frame remains 345 by 460 CSS pixels with `object-fit: contain`.
- Reduced-motion emulation leaves the hovered roster image at its original scale with `0s` transform transition duration.
- The 390 by 844 mobile viewport has no horizontal overflow and preserves the portrait frames and complete-image fitting.
- Keyboard navigation retains the visible link outline. Clicking Afterwise opens its existing detail dialog.
- No browser warnings or errors were captured. Temporary viewport and reduced-motion overrides were reset.
- Screenshots are retained at `C:/Users/SVall/WebstormProjects/blackbox-records/.codex-artifacts/artist-image-hover/`.

## Repository checks

- `pnpm test apps/web/src/pages/_artist-roster-layout.test.ts`: passed the affected web-pages target.
- `pnpm test apps/web/src/components/artists/artist-roster-search.test.ts`: passed web-artists, app-shell, web-layouts, and web-pages targets.
- Targeted Prettier check and `git diff --check`: passed.
- `pnpm openspec -- validate match-artist-image-hover --type change --strict --allow-worktree`: passed.
- Initial `pnpm validate`: passed in local mode. Summary: `.codex-artifacts/validation/2026-09-29T23-46-10-338Z-100712/summary.json`; before/after fingerprint: `e4847b586f6b877365904c5752efdf5987b4fa23c3aece16639b3b685dca20e1`.
- Final-tree validation is rerun after finishing this tracked note. Its summary path, status, source SHA, and matching before/after fingerprints are retained in ignored `.codex-artifacts/artist-image-hover/final-validation.json`.

This is Local public-presentation acceptance. CMS, provider, content publication, and software-release checks are not applicable to the class-only change. No hosted work was performed.
