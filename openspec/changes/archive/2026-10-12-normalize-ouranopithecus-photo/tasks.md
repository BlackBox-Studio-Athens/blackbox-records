# Tasks

## 1. Photograph and retained content

- [x] 1.1 Save the neutral black-and-white photograph as `Ouranopithecus-band-photo-bw-square.jpg`; compare it with the original for unchanged identities, poses and complete visible bodies, and verify exact 1:1 dimensions and grayscale pixels. Two AI edits were rejected; the owner approved Sharp and requested the tighter crop after Local review.
- [x] 1.2 Update only the retained Ouranopithecus image reference, preserve the original and existing rendering code, and run `pnpm assets:check`; record any unresolved asset QA issues in validation.md.

## 2. Local acceptance

- [x] 2.1 Check Home, Artists and the Ouranopithecus detail at 1440 px and 390 px with Playwright CLI; verify the new square image, framing, no horizontal overflow and retained hover behavior, and record screenshots and results in validation.md.
- [x] 2.2 Validate the OpenSpec change strictly and run `pnpm validate` on the final tree; save the source-bound result pointer in ignored artifacts. Repository validation passed for the revised square crop; the separate asset QA failure is documented.
