# Hero button removal and Browse review, 11 October 2026

## Owner decision

The owner confirmed that only See pre-orders was appearing late on PRD, then requested its complete removal. The follow-up also requests two or three smaller, quieter Browse drafts, possibly in a black frame, for review before styling is applied.

## Implementation

- Removed the See pre-orders anchor from `HomeHero.astro` and its conditional CSS from `global.css`.
- Kept Browse the Store in the initial HTML with its current styling. The deferred pre-order showcase remains further down Home.
- Updated the existing CSS and browser checks to assert that Home has exactly one hero action with both populated and empty pre-order results.
- No new runtime code, requests, dependencies, CMS fields or commerce behavior.

## Evidence

- Initial source: `956a764c56f0070c4d1b89c1a93f9dccdf36bd63` on `main`, initially clean.
- `pnpm openspec:guard` passed before edits.
- `pnpm test apps/web/src/components/editorial/HomeHero.astro` passed all four affected projects: web-editorial, app-shell, web-layouts and web-pages, in 35.6 seconds.
- Four browser cases passed in Chromium and Firefox: the populated Home hero and empty-showcase cases. The populated case checks 390, 320 and 280 px layouts, one Store link, no Scroll label and no horizontal overflow. Browser evidence: `.codex-artifacts/home-browse-drafts/removal-e2e-summary.json`.
- `graphify update .` completed: 26,532 nodes, 42,640 edges, 1,947 communities. The existing parser warning in `scripts/pages-workflow-contract.test.ts` remains unrelated.
- Strict OpenSpec validation passed. `pnpm validate` passed all 56 tasks across 42 affected projects and dependencies in 153.5 seconds, with 44 cache hits. Summary: `.codex-artifacts/validation/2026-10-11T12-48-03-687Z-8528-0cbab1/summary.json`. Before and after source identities match: SHA `956a764c56f0070c4d1b89c1a93f9dccdf36bd63`, fingerprint `f6aebc4552c225bfa6c34f5eecf52f83441a586236b51783b6083ebe612cfe72`; no source changes occurred during validation. Formatting only compacted the existing browser test declaration and aligned this note's table after the browser run; the product source was unchanged. The final receipt records the subsequent validation of the completed evidence and task markers.

## Drafts for review

Self-contained comparison: `.codex-artifacts/home-browse-drafts/index.html`. It contains three treatments on the actual PRD hero, each at 1440 × 900 and 390 × 844. The photo, motto and placement are shared; See pre-orders is absent in every draft.

| Draft | Treatment                                        | Drawn size  |
| ----- | ------------------------------------------------ | ----------- |
| A     | Compact black face with a fine edge, recommended | 122 × 36 px |
| B     | Quiet outline                                    | 111 × 32 px |
| C     | Quiet text link with a faint underline           | 108 × 36 px |

The original Browse control measured 143 × 44 px. The selected treatment will retain the shared 44 px touch target. Draft capture evidence is in `capture-evidence.json`; gallery checks in `gallery-evidence.json` passed all six variant/view combinations and confirmed no gallery overflow at 390 px. Screenshots are supporting review artifacts, not shipped styling. Motion was reduced for consistent comparison. Hover, keyboard focus and real touch behavior of the selected treatment will be checked when it is applied.

PRD inspection used one ordinary public Home visit and browser-local draft styling. The Codex browser inventory timed out; the isolated Playwright CLI session succeeded. No hosted code, CMS content or provider settings were changed.

## Delivery boundary

The pre-order hero removal is delivered as a scoped local commit, whose identity is in `.codex-artifacts/home-browse-drafts/removal-completion.json`. Browse styling awaits the owner's A, B or C selection; task 5.2 remains open. No push or deployment is part of this turn. The isolated browser and the frontend server started for these checks have been closed.
