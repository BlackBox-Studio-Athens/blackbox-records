# Local acceptance evidence

Verified on 8 October 2026 in the primary checkout on main.

## Source and checks

- `pnpm openspec:guard`: passed before edits.
- `pnpm test web-pages src/pages/_releases-page-layout.test.ts src/pages/_section-page-identity.test.ts`: 2 files, 11 tests passed.
- `pnpm openspec -- validate remove-releases-page-header --strict`: passed.
- `graphify update .`: completed with local AST extraction only. Existing SQL extractor and partial-extraction warnings do not affect the heading markup/CSS check.
- `pnpm validate`: passed all 48 selected tasks across 37 projects. The initial run's evidence-note formatting issue was corrected; source files and browser fingerprints remain unchanged.
- Final validation output is retained under the ignored `.codex-artifacts/validation/` directory; its final summary is referenced by the ignored `.codex-artifacts/release-header/validation.json` pointer.

## Browser acceptance

Playwright CLI checked current source through a temporary standalone Astro preview on port 4399. The existing Local stack on port 4321 serves an older compiled renderer; it was neither rebuilt nor interrupted. The temporary preview and isolated browser were stopped after verification.

Direct loads and keyboard-activated shell navigation from Artists passed at 1440, 390 and 320 CSS pixels:

- One accessible Releases H1 uses the existing `sr-only` utility, is absolutely positioned and measures 1px wide.
- No visible introduction remains; the release layout has zero gap from the top of its showcase container.
- Our Releases remains visible in the populated lower catalog.
- No horizontal page overflow occurs.
- Shell navigation preserves the same document and returns keyboard focus to the main landmark.

Screenshots were visually inspected at desktop and mobile widths. Ignored evidence: `.codex-artifacts/release-header/check-browser.js`, `desktop.png` and `mobile.png`.

The standalone preview reported a 404 for `/api/store/listing-prices`, which has no route in this static preview. Commerce/provider acceptance was not performed for this heading-only edit. No hosted deployment or content publication was performed.

## Browser source fingerprint

SHA-256:

| File                                                | Hash                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------ |
| `apps/web/src/pages/releases/index.astro`           | `C7A4CABE8A52574895A7A0905CCFD9B5BA3267EFE05708E3A4F803A686F6787F` |
| `apps/web/src/styles/global.css`                    | `8525FFD32D4BC0FD4F7357992A827823A34B366F9B4157550A5E990564FCF077` |
| `apps/web/src/pages/_releases-page-layout.test.ts`  | `B670AFF32D805E661AD6E8BE805EFEB3D874663BCF922A6BFBBE2D494C08876C` |
| `apps/web/src/pages/_section-page-identity.test.ts` | `4140049839295124958932473153E26856FEF1B8561CB64AB5FD7412CA402F08` |
