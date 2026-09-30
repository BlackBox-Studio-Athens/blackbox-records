# Validation

Source: worktree `staff-site-illegal-states-35bdea` on base `b3d85861`. The working-tree diff fingerprint is `sha256:5688d7cbea394f9d`; it excludes `tasks.md` and this file. Evidence was recorded on 2026-09-30.

## Commands

| Command                                                                           | Result                                                                                                                                           |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm test`, the tests reached by the working-tree changes                        | Initially failed in `cms-runtime`: backend fixtures used arbitrary Social titles. Fixed; the `cms-runtime` project then passed 103 of 103 tests. |
| `pnpm test:content`                                                               | 65 of 65 tests passed, after changing the Social fixture titles to supported platforms                                                           |
| `pnpm --filter @blackbox/staff check`                                             | 0 errors                                                                                                                                         |
| `pnpm --filter @blackbox/api-client check` and `test`                             | Passed, after changing the MSW stock-change fixture to `show_sale`                                                                               |
| `pnpm openspec -- --allow-worktree validate constrain-staff-field-entry --strict` | Valid                                                                                                                                            |
| `pnpm validate`                                                                   | Passed, run `2026-09-30T16-20-00-410Z-96264`                                                                                                     |
| `pnpm validate:editor`                                                            | Passed, run `2026-09-30T16-25-16-257Z-49724`, including the CMS workspace browser regression                                                     |

## Browser observations (Local, built-in browser pane)

- **About:** each fact key is a select with four labelled options, and the existing keys are preserved. Contact values are email inputs.
- **Socials:** the stored `#` entry shows Hide this link turned on, with no URL input. Turning it off shows a required, empty HTTPS input; turning it back on restores `#`. Platform is a select of the five supported platforms.
- **Navigation:** Page link is a select of the listed public pages, and the existing `/about/` link stays selected.
- **Settings:**
  - Country is a single-choice searchable combobox.
  - Searching "cypr" and choosing Cyprus stored one country and closed the picker. The fixture was restored to Greece.
  - The picker's search box needed programmatic input in the pane. The other country picker is unchanged and behaves the same way.
- **Release (Bandcamp player):**
  - Pasting the Share/Embed iframe code stored only the canonical player URL; this was confirmed after a reload.
  - An album page address stayed in the field with the guidance error.
  - The original value was restored.
- **Tracklist:**
  - `3:42` was accepted.
  - `3:72` and `3:4a` were rejected, so the value stayed `3:42`.
  - With two sides, each side's select disables the other side's letter.
  - The temporary tracklist was removed.
- **Services:**
  - Pasting `  Tour & Booking  ` produced `tour-booking-`. The trailing hyphen is kept while typing, and the schema reports it.
  - A duplicate link name showed "Use a link name no other service uses."
  - Process steps sit at the minimum of three, so Remove is disabled.
  - The original values were restored.
- **Item setup:** in the EUR price input, `25,5` was accepted and `25,555` and `25€` were rejected. The field was cleared afterwards.

## Review follow-up

A Brooks review moved the stock-reason closed set into `pendingChangeSchema`. It also removed a removal `max` that repeated the existing preview guard, dropped an unused `CountryPicker` label prop, named the opening-stock bound once, and made `ParsedField`'s default formatter stable. Affected checks were re-run on the final tree.

## Limitations

- **Stock quantity bounds were not checked by hand.** The short-path Local store had no seeded commerce catalog, so the online quantity maximum and the notes length were not checked manually in the browser. They are covered by the type check and the `validate:editor` regression over the stock pages, which did not assert these new bounds.
- **`pnpm dev` fails in this worktree.** The CMS Durable Object SQLite path under the worktree's `apps/backend/.wrangler/state` reaches the Windows path-length limit, and workerd reports an internal error. Browser checks used an explicit short `--persist-to` store, migrated and seeded with the launcher's own import and publication functions. The main checkout's shorter path is not affected.
- **Hosted content was not inventoried.** Hosted entries outside the new closed sets would block their next save or publication.
