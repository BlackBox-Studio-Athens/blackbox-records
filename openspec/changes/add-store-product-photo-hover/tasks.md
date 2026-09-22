# Tasks

Implementation is in `codex/store-product-photo-hover`. Hosted work uses existing authorization and release procedures; content/release tasks remain open until their environment is authorized and verified.

## 1. Implement through the existing paths

- [x] 1.1 Add nullable `previewImage` selection to the existing collection join. Verify with the existing projection tests that absent/primary-only galleries have no alternate, order selects the first different image, and Release/commerce projections are unchanged.
- [x] 1.2 Add the contained alternate layer, CSS hover/focus behavior, and small native load/error helper to both listing cards and Store lifecycle. Include the ready-marker reset in existing snapshot handling; verify pending/error fallback and loaded/cached restoration with one focused regression, without changing click or gesture handling.
- [x] 1.3 Add the gallery-order explanation beside More images and in existing editor documentation. Reorder one Local gallery through save → preview → review → publish; verify draft privacy, selected hover image, full detail order, and unchanged primary using the existing CMS flow.

## 2. Verify the feature

Local acceptance includes the user-approved startup repair recorded in design.md: normalize native navigation booleans before publication validation and regress freshly imported records and invalid values. The 18 checkpoint tests and normal Local bootstrap passed, including all eight previously blocked navigation publications.

- [x] 2.1 Run the representative desktop/mobile browser smoke described in design.md, including keyboard/reduced motion, touch, single-image/cassette/CD examples, Store modes, and one cached return. Confirm existing responsive image delivery and JavaScript-off fallback; record the result without building an exhaustive test matrix or performance study.
- [x] 2.2 Run `pnpm validate`, `pnpm validate:editor`, applicable existing Local publication/preview checks, and `pnpm assets:check` if assets changed. Verify the final-tree summaries and strict OpenSpec/format checks pass.

September 22 Local evidence: 19 focused web tests pass. Native browser checks passed cassette/CD contained hover, keyboard focus, reduced motion, Coverflow side selection and active navigation, search/expanded cards, primary-only fallback, All/Distro/temporarily populated Merch, and shell cached return. At 390 px with touch media emulated, there was no overflow or hover reveal and one click opened the detail. The in-app browser does not support raw touch dispatch; this checks mobile media/link behavior, not physical-device gestures. JavaScript-disabled listings kept primary images and links; detail retained all three gallery photos. Temporary Merch classification was restored. The Local gallery check passed save/preview/review/publication, draft privacy, unchanged primary, detail order, and exact image-source equality between the reordered first gallery photo and the listing alternate. The selected three-photo order was restored.

Existing `smoke-content-preview.mjs --browsers` passed every collection in Chromium and Firefox. `test-local-content-publication.mjs` passed with 7.2-second single and 7.1-second batch publication, unrelated draft privacy, idempotency and combined preview. Its first attempt preceded the public service binding reconnect after rebuild; the same review-media URL returned 200 once connected. No repository image assets changed.

Rebase acceptance against the formatted-description changes on main: 25 focused tests pass. Native browser checks confirmed Distro and All card focus reveal, full-card focus outline, contained image hover, unchanged primary on body hover, independent description-link keyboard/click navigation using a temporary DOM fixture, Coverflow side-card pointer selection, arrow-key selection and Enter navigation, and a 390 px layout without overflow. Temporary fixture content and browser overrides were restored. The shared Local startup repair is already present on main.

## 3. Add photos and release through normal workflows

- [x] 3.1 Select usable existing/official Bandcamp photos for Band in the Pit and the other requested cassette/Distro items, following current photography standards. Verify edition, distinct views, alt text, and reuse evidence; record actual selections/exclusions in existing source notes, including resolution of the Band in the Pit evidence discrepancy before accepting new photos.
- [ ] 3.2 When authorized, release the validated code to UAT and add/publish the selected photos through EmDash. Check existing and newly populated galleries on cards/detail pages; follow the existing publication limits, hosted preflight, and Free-tier rules without adding a separate feature rollout process.
- [ ] 3.3 When separately authorized, promote the reviewed code candidate and publish the selected PRD photos using PRD records and normal gates. Verify the public result and record any unresolved content; rollback uses prior gallery selections or the normal code release process.
