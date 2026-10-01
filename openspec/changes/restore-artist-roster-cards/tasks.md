# Tasks

## 1. Revert

- [x] 1.1 Revert `e032de4f` (simplify-artist-roster), `57eeac8a` (Home print zoom) and `eaaa2c30` (crate index) in code only. Leave the archived changes untouched, drop the unarchived `simplify-artist-roster` change, and keep later edits to README, docs and `ContentFields.tsx`.

## 2. Uniform photos without a scrim

- [x] 2.1 Add `.artist-photo-frame` and the decorative `.artist-photo-fill` (blurred, darkened copy of the photo, `alt=""`, `aria-hidden`, one 160 px candidate, no high priority) to `global.css`, `ArtistCard.astro` and the `ArtistDetailContent.astro` lead frame. The main photo stays `object-contain` above the fill and keeps the News hover zoom.
- [x] 2.2 Move genre and name below the photo in both `ArtistCard` variants, remove the gradients, and drop the unused `default` variant.
- [x] 2.3 Update the staff picker guidance, README, `docs/agent-reference.md` and `docs/content-workspace.md` to describe the blurred fill.
- [x] 2.4 Extend `apps/web/src/pages/_artist-roster-layout.test.ts`: no gradient in `ArtistCard`, the fill sits in each frame with empty alt and `aria-hidden`, the name is outside the frame, and `.artist-photo-fill` blurs a cover-fitted copy.

## 3. Acceptance

- [x] 3.1 Run strict OpenSpec validation, `pnpm agent:check`, `pnpm validate:editor` and `pnpm validate` on the final tree. Evidence is in [validation](validation.md); the final `pnpm validate` pointer is in `.codex-artifacts/restore-artist-cards/final-validate.txt`.
- [x] 3.2 Build the site and run the image-markup check. Evidence: 349 pages built and `image-markup:check` passed ([validation](validation.md)).
- [x] 3.3 At 1440 px and 390 px, check the Artists grid, the Home featured roster and an artist detail:
  - every card frame is the same size
  - Chronoboros and Afterwise show their whole photo over a blurred fill
  - no black band sits near any name
  - there is no horizontal overflow

  Evidence: DOM measurements and a partial screenshot ([validation](validation.md)). Full-viewport screenshots were not possible.

- [x] 3.4 Run the shell continuity checks with `pnpm test:e2e`: Artists → artist overlay → back, and Artists → Home → Artists, keep the player. Evidence: 35 passed and 5 skipped by viewport project, against this worktree's site.
- [ ] 3.5 When archiving, rewrite the `artist-roster-presentation` Purpose. It still describes prints "without fixed frames".
