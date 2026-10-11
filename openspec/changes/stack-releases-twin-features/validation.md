# Local acceptance evidence

Verified on 11 October 2026 in the primary checkout on `main` (base `b7ec9ff9`), Product Environment Local. Nothing was deployed or published.

## Source and checks

- `pnpm openspec:guard`: passed before edits.
- `pnpm openspec -- validate stack-releases-twin-features --type change --strict`: valid. Its one INFO line is expected: the MODIFIED "Releases retains accessible identity without a visible introduction" exists only in the unarchived `remove-releases-page-header`, so this change archives after it (see design.md).
- Unit tests (`pnpm test <file>`, which ran every affected project): web-pages, web-editorial, app-shell, web-layouts, web-store, web-artists, storefront-catalog, commerce-web-integration and web-tooling passed, including `touch-ergonomics-css.test.ts`, `music-listen-trigger-css.test.ts` and `check-image-markup.test.ts`.
- `graphify update .`: completed (local AST extraction).
- `pnpm validate`: passed, `mode: local`, run `2026-10-11T15-28-43-103Z-14028-5a0bcb`; source `b7ec9ff9004d1172f247c19f486da3357f356b63` with fingerprint `9c915878c8595fd536249aa32e020a0edd62c4a0b8080bf63c7f3e7955077a41` before and after. Earlier runs caught a typecheck error (`StoreBuyIcon` under `exactOptionalPropertyTypes`) and two tests pinning old markup; all were fixed before this run. The final pointer is kept in ignored `.codex-artifacts/validation/`.

## Acceptance rows

- Shell/player/routing: `pnpm test:e2e` on Playwright's own Local server (Chromium, Firefox, chromium-mobile and firefox-compact projects):
  - `e2e/release-merchandising.spec.ts`: 42 passed on the edited tree. On the final formatted tree, one Firefox run of "native destinations distinct from inert copy" failed while the Store item page loaded Vite's `@react-refresh` module; that test then passed twice in both browsers. This is a dev-server module load, not Releases behaviour.
  - `e2e/store-formats.spec.ts`: 11 passed (final tree).
  - `e2e/player-continuity.spec.ts`: 9 passed; `e2e/shell-navigation.spec.ts`: 35 passed, 16 skipped by project.
- Commerce, CMS, publication and release rows: not applicable. No API, offer, stock, content or deployment change.

## Browser acceptance

`playwright-cli` against the Local site with mocked listing offers (Disintegration pre-order €26.00, Caregivers stocked €20.00, Anarchotribal Coming Soon €22.00), compared with canvas v10:

| Width | Featured covers                  | Catalog tile | Overflow |
| ----- | -------------------------------- | ------------ | -------- |
| 320   | 288 × 288, both rows             | 288          | none     |
| 390   | 358 × 358, both rows             | 358          | none     |
| 768   | 348 × 348 beside copy, both rows | 348          | none     |
| 1024  | 464 × 464 beside copy, both rows | 304          | none     |
| 1440  | 464 × 464 beside copy, both rows | 346.7        | none     |
| 2120  | 464 × 464, centred frame         | 346.7        | none     |

- Every cover is contained and untransformed; featured titles size to their copy column (46, 57, 56 and 66px) without overflow.
- Prices sit beside the action; the pre-order terms link appears only for the pre-order; catalog Buy shows the Store card chrome and record mark.
- Accessible names: "Pre-order vinyl, Disintegration", "Vinyl edition, Anarchotribal", "Buy vinyl, Caregivers"; Listen reads "Listen, Disintegration by Afterwise" (Chromium inserts a space before the comma because the context span is out of flow).
- Keyboard order (title, artist, Listen, edition action), 200% text at 390px, reduced motion, Listen and player continuity, direct load and shell entry are covered by the passing e2e specs above.
- Layout shift while offers hydrate, listing response delayed 800ms, compared with the previous layout measured the same way:

| Viewport   | Before | After |
| ---------- | ------ | ----- |
| 390 × 844  | 0.047  | 0     |
| 1440 × 900 | 0.045  | 0.001 |
| 768 × 1024 | 0.099  | 0.066 |

The pre-order terms line is reserved (inert and invisible) until a pre-order is confirmed. The remaining tablet shift comes from the pre-order chip wrapping in the 348px copy column; it is within the 0.1 route budget but above the 0.02 target.

Ignored evidence: `.codex-artifacts/release-twin-features/` (screenshots at six widths, `measure.json`, and the measurement and layout-shift scripts).

## Unverified

- `e2e/performance-acceptance.spec.ts` responsive image selection and the production image-markup check need a production `dist`; CI covers them. Image `widths` are unchanged, so no new transformations are requested.
- Rendering on real devices and inside hosted UAT or PRD.
