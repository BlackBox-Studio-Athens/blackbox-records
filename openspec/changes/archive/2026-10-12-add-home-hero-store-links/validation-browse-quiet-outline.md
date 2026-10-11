# Smaller Quiet outline Browse: Local acceptance

Date: 11 October 2026. The owner selected B, requested a smaller draft, and approved that revision for implementation with equal care for mobile and desktop and a local commit.

## Implemented behavior

`HomeHero.astro` uses the existing outlined `sm` button family with local size and tone utilities. The drawn control is approximately 100 × 28 px, with 12 px type, 8 px side padding, a fine light outline and a translucent black face. Shared hover, active, keyboard focus and reduced-motion behavior are retained. The coarse-pointer halo extends 9 px from inside the border, giving a 44 px touch target without enlarging the drawn frame.

Browse the Store remains the hero's only action and links to the Store through the existing persistent shell. The pre-orders hero action stays removed, and the lower showcase stays deferred to browser idle. No runtime JavaScript, dependency, commerce behavior or CMS field was added.

## Checks and source identity

- `pnpm test apps/web/src/components/editorial/HomeHero.astro`: all four affected module projects passed.
- `pnpm test:e2e e2e/home-preorders.spec.ts e2e/home-touch-prefetch.spec.ts --workers=1 --project=chromium-desktop --project=firefox-desktop --project=chromium-mobile --project=webkit-mobile --grep="Home hero links only|Home stays empty|Home Browse keeps"`: all six selected cases passed, with no skips, unexpected failures or flaky cases in the final run.
- Desktop Chromium and Firefox verified the one Store action, narrow layouts, a visible keyboard focus outline, Enter activation and same-document shell continuity. Phone Chromium and WebKit verified the compact frame and 44 px halo at 390, 320 and 280 px, including a real browser touch tap above the drawn frame that opened the Store without reloading the document.
- Visual inspection covered 280, 320, 390, 768 and 1440 px. The frame measured 99.890625 × 28 px at every width, with no horizontal overflow. At 200% root text size on a 320 px viewport, the label grew to 24 px and the frame to 56 px high without clipping. This was text scaling, not native browser zoom.
- `pnpm openspec -- validate add-home-hero-store-links --type change --strict`: passed.
- `pnpm validate`: passed all 56 selected tasks in `mode: local`, including the affected tests, lint, type checks and architecture checks. The successful source run is `.codex-artifacts/validation/2026-10-11T13-45-07-681Z-46912-60f1fa/summary.json`. Both source SHAs were `e2b1f35591b3a2bc25febeb0811e0b3f4ec833dd`; both fingerprints were `c26dca24b3f07b637c0d9d0cbfa0ae86a6d823d5735b887d045dadd18db8d9e4`, with eight changed files and no final source drift. Its source guard repeated the selection once after transient local settings files changed.

The final validation after adding this note, its exact fingerprint and the local commit identity are recorded in `.codex-artifacts/home-browse-drafts/quiet-outline-smaller/implementation-completion.json`. Browser source hashes are recorded separately and checked against the delivered source.

## Validation recovery

The first repository validation failed an existing Stripe migration CLI test at its default five-second deadline. The subprocess already had a 15-second deadline; a scoped retry reproduced the mismatch. Only that test's deadline was set to 20 seconds, above the existing subprocess cap. Its subprocess arguments and error-safety assertions are unchanged. The backend-tooling tests and full repository validation then passed. The original failure remains recorded in `.codex-artifacts/validation/2026-10-11T13-28-00-695Z-15644-f082a5/summary.json`.

A cold local browser confirmation under concurrent checks had startup and navigation timeouts. The final run reused the running frontend and used one worker; all six cases passed without changing their assertions. The failed cold-start summary is retained in the artifacts below. The background preview launcher also exceeded its startup window; the canonical foreground frontend launcher was used for the final checks.

The standalone visual preview has no backend, so its pre-order listing API reads returned 404. The deterministic browser checks stub those reads. This does not establish provider or hosted commerce acceptance.

## Artifacts and limits

All paths below are under `.codex-artifacts/home-browse-drafts/quiet-outline-smaller/`:

- `implementation-final-e2e-summary.json`: final six-case browser report.
- `implementation-final-browser-source.json`: exact hashes of the covered component and browser specs.
- `implementation-final-visual-evidence.json`: dimensions, loaded artwork, focus and enlarged-text observations.
- `home-implemented-280.png`, `home-implemented-320.png`, `home-implemented-390.png`, `home-implemented-768.png`, `home-implemented-1440.png` and `home-implemented-focus.png`: final source screenshots.
- `implementation-cold-start-e2e-summary.json`: retained cold-start failures.
- `index.html`: the approved smaller B review, retained as a draft comparison.

Graphify was rebuilt locally with 26,542 nodes, 42,651 edges and 1,949 communities. Its existing parser warning for `scripts/pages-workflow-contract.test.ts` was retained; no semantic enrichment was enabled.

Product Environment: Local. The public presentation and existing Store-entry behavior were checked. Physical phones, native browser zoom, UAT, PRD and provider operations were not checked. Delivery is a local commit only; no push, deployment or content publication is part of this acceptance.
