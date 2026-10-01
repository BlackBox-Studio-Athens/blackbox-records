# Validation

Source: `main` working tree on base `8a1a1677`. Evidence recorded on 2026-10-01. This file and `tasks.md` were finalized before the passing `pnpm validate`, apart from that run's result row.

## Before (PRD, `blackbox-records-web.pages.dev`, Chromium emulation at 390 × 844)

- **Menu:** listed Artists, Releases, Store, Services and Who we are, with no Home. UAT's `AppShellRoot` props list the same five.
- **Store:** rose `rgb(207, 107, 128)` with a 1.67px left border on every page.
- **Close:** 16px tall.
- **Footer sitemap:** `nowrap` with overflow hidden. "Delivery information" was clipped: the scroll width was 385 against a client width of 351. Links were 30px tall.
- **Breakpoint:** with the Menu open, widening to 1100px kept the dialog open while the Menu button was `display: none`.

## Commands

| Command                                                                  | Result                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`, the tests reached by the working-tree changes               | 30 projects passed                                                                                                                                                                                                                                                                                                                |
| `pnpm test apps/web/src/platform/utils/urls.test.ts`                     | Passed, with its 12 dependent web projects                                                                                                                                                                                                                                                                                        |
| `pnpm test:app-shell`                                                    | Passed                                                                                                                                                                                                                                                                                                                            |
| `pnpm test:e2e e2e/shell-navigation.spec.ts`                             | 7 passed. 5 skipped, because each test targets the other viewport project.                                                                                                                                                                                                                                                        |
| `pnpm test:e2e`                                                          | 35 passed, 5 skipped                                                                                                                                                                                                                                                                                                              |
| `pnpm validate:editor`                                                   | The first run timed out after 30 seconds waiting for the Artist name textbox in `assertDirectPublishing`, which is unrelated to navigation. The re-run passed: run `2026-10-01T08-11-56-544Z-81216`, including the CMS workspace browser regression.                                                                              |
| `pnpm openspec -- validate unify-site-navigation --type change --strict` | Valid                                                                                                                                                                                                                                                                                                                             |
| `pnpm validate`                                                          | First run: `capture-cms-snapshot.test.mjs` used a Home navigation fixture with `show_in_header: 1`, which the new rule rejects. The fixture became an Artists entry, which keeps the 0/1 boolean coverage. Second run: an Nx plugin-worker load timeout in `check:boundaries`. Third run passed: `2026-10-01T08-23-25-299Z-24156` |

## Browser observations (Local `astro dev`, built-in browser pane emulation)

**390 × 844:**

- The header shows the icon with MENU. The button is 78 × 44px.
- The Menu lists Home first, marked current with the underline, then Artists, Releases, Store, Services and Who we are.
- Store is neutral, with no stripe and no rose.
- There is no horizontal overflow.

**Store through the Menu:**

- Store becomes current in the Menu, in its accent with the underline.
- The footer Store link gains `aria-current="page"` after in-place navigation.

**Keyboard:**

- Enter on the Menu button opens the dialog, sets `aria-expanded="true"` and moves focus inside.
- Escape closes it and sets `aria-expanded="false"`.
- Focus initially did not return to the button, because Radix only refocuses its own Trigger. `onCloseAutoFocus` fixes this, and an e2e test now covers it.

**Footer at 390 and 320px:** all seven links, including Privacy information, are 44px tall, wrap onto two rows and stay inside the list.

**320 × 640:** the logo is 144px, the Menu button ends at 303px, and there is no horizontal overflow.

**1440 × 900:**

- The header navigation keeps 12px labels with 2.4px tracking and `rgb(179, 179, 179)` at rest.
- Services shows as current in `rgb(199, 137, 151)` with the underline.
- Footer links stay compact (14px) with a fine pointer.
- The Menu button is hidden.

## Hosted inventory

The PRD and UAT header lists, read from the served `AppShellRoot` props, exclude `/`. No hosted navigation entry fails the new Home rule.

## Limitations

- **Reduced motion:** the reduced-motion rules are CSS only and were not exercised in the browser.
- **Real devices:** only Chromium device emulation was used. Real iOS and Android devices were not tested.
- **Staff:** the label and the Home rule's field error were not opened in the staff browser. They are covered by the shared-schema test, the shared validation path that displays issues by field, and the passing `validate:editor` regression.
- **Hosted:** UAT and PRD stay unchanged until the next batched release. The commit is local only.
