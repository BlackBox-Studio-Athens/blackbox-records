# Local validation

## Source and environment

- Base source SHA: `4cae5409671078d8c9273e471c9ea927c7cedef8`, primary checkout on `main`.
- Product Environment: Local, existing static site at `http://127.0.0.1:4321/blackbox-records/`.
- Accepted square asset SHA-256: `501a104a2f5a109598a6107713ff2562bf0c382675ca2a34c5dc1862ef77b3ea`.
- Retained Artist entry SHA-256: `ebb4a2c4597b027b0cb615c673ef35c97f7abd6abf3ff80d0e3535661c0b7129`.
- Original SHA-256 before and after: `96d7206b76fe2762c55146d1a4f24bb7af89be8834182cd1231fdbb1cb0bf158`.
- Content-image acceptance applies. CMS/editor, commerce/provider and hosted release acceptance are excluded: the change updates retained content only, without CMS or hosted mutations.

## Photograph

Two built-in image-tool edits changed facial and scene details and were rejected. The owner explicitly approved Sharp. After reviewing the initial 3:4 photograph locally, the owner requested a more square crop. The final original was cropped at left 40, top 265, width 720, height 720, converted to grayscale, and encoded at JPEG quality 95 without resizing or reconstruction. All three members and their visible bodies remain within the crop; the original faces, poses and scene are preserved. The previous 3:4 candidate and its validation note are retained only in ignored artifacts.

`node .codex-artifacts/ouranopithecus-photo/prepare-image.cjs` passed assertions for original-file preservation, JPEG decoding, exact 1:1 (720 × 720), and zero RGB chroma. The result is 234,001 bytes. Evidence: `.codex-artifacts/ouranopithecus-photo/image-evidence.json`.

## Repository checks

- `pnpm test apps/web/src/pages/_artist-roster-layout.test.ts`: passed.
- `pnpm openspec -- validate normalize-ouranopithecus-photo --strict`: passed; this content-only change uses `skip_specs: true`.
- `pnpm assets:check`: inspected 131 image references/assets and failed on one unrelated `provider-url-readiness` error for `catalog:UAT:disintegration-black-vinyl-lp`: the existing provider image uses the PRD Pages asset base instead of the UAT base. This source was not changed. Full output: `C:/Users/SVall/AppData/Local/rtk/tee/1791375714_test.log`.
- Asset QA also warns about the existing Mass Culture and Chronoboros image proportions and the new Ouranopithecus source's square ratio and size below 1200 × 1600. The user requested the square source; existing 3:4 card frames continue to contain it. Retaining the small original avoids inventing detail through upscaling.
- `pnpm validate` passed for the revised square crop (126.5 s), in `.codex-artifacts/validation/2026-10-07T12-24-03-299Z-44432-336a09/summary.json`. The final run after completion notes retains its status and summary path in `.codex-artifacts/ouranopithecus-photo/final-validate.txt`; that summary records the final before/after source fingerprints and `mode: local`.

## Browser acceptance

`playwright-cli -s=ourano-photo run-code --filename=.codex-artifacts/ouranopithecus-photo/browser-check.js` passed all six page/viewport combinations for the revised crop: Home, Artists and Ouranopithecus detail at 1440 px and 390 px. Each uses the new square photograph for both the main image and decorative blurred fill, retains `object-fit: contain` and alt text, and has no horizontal overflow. All three people remain visible. Home and Artists retain the 3:4 card frames and existing 1.03 hover scale; reduced motion disables that scale. No uncaught page errors occurred. The user's existing Local Artists tab was refreshed and its new square image was confirmed through the DOM.

The six revised frame screenshots are in `.codex-artifacts/ouranopithecus-photo/`: `home-1440.png`, `artists-1440.png`, `detail-1440.png`, `home-390.png`, `artists-390.png`, `detail-390.png`. The contextual Artist card screenshot is `local-artists-card.png`. The existing detail frame continues to contain the complete square photograph over its blurred fill.
