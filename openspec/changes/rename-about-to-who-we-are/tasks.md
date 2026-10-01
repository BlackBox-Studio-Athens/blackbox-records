## 1. Public labels

- [x] 1.1 Update navigation and About source labels, derive browser title from the page label and update shell transition copy; verify existing app-shell tests and the diff preserve route and content identities.
- [x] 1.2 Sync the primary-navigation requirement to Who we are; verify the OpenSpec change passes strict validation.
- [x] 1.3 Rename the staff Pages card, editor title and image field for the About page to Who we are; verify no test or route depends on the old labels.

## 2. Local acceptance

- [x] 2.1 Publish only the two label edits through Local CMS review and Content Publication; verify the accepted snapshot renders Who we are and unrelated drafts remain private.
- [x] 2.2 Verify desktop/mobile navigation, footer, browser title, active state and player continuity in Chrome; record observations in validation.md.
- [x] 2.3 Run pnpm test:app-shell and final-tree pnpm validate; record commands, source fingerprint and results in validation.md.

## 3. Production content

- [ ] 3.1 Publish the About page Section label `Who we are` through PRD staff; verify the public About hero label and `Who we are | Blackbox Records` browser title.
