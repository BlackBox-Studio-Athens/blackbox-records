# Tasks

## 1. Design review

- [x] 1.1 Prepare two Store-navigation compositions and a source-based current reference, each with desktop and mobile context; verify the review canvas is present and uses the existing labels and artwork.
- [x] 1.2 Obtain the user's explicit composition choice and any type-size or mobile adjustments; record the approved brief in `design.md` before implementation.

## 2. Approved presentation

- [x] 2.1 Apply the approved typography, alignment and spacing to the shared Store category navigation, keeping native routes and selection semantics; verify the relevant scoped Store/category tests and compare rendered browser screenshots with the approved canvas.
- [x] 2.2 Verify three and four discoverable categories at 320px, 390px, 640px, 1280px and enlarged text, plus active, hover and keyboard-focus states; confirm complete labels, at least 48px mobile / 52px desktop targets and no horizontal overflow, and record evidence in this change.
- [ ] 2.3 Complete the Chrome blackbox-profile comparison with the actual Inter font loaded. Desktop composition was observed, but Inter was absent and the browser connection closed during the mobile review; automated Chromium evidence does not close this font acceptance limit.

## 3. Integration acceptance

- [x] 3.1 Run the scoped category-routing and shell/player continuity checks, including navigation between Store collections and player minimize/reopen/stop behavior; retain the local summary and any relevant browser evidence.
- [x] 3.2 Run strict OpenSpec validation and `pnpm validate` on the final implementation tree; record its source fingerprint, summary path and remaining acceptance limits in this change's validation note.
