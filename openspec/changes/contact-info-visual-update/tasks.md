## 1. Contact Presentation Contract

- [x] 1.1 Add `apps/web/src/styles/about-contact-presentation.test.ts` to assert the About route keeps one ordered contact list, first-item primary treatment, native `mailto:` anchors, decorative mail icons, and the required focus, wrapping, and responsive CSS hooks.
- [x] 1.2 Run the focused test and confirm it fails against the current plain-text contact list before implementation.

## 2. About Contact Markup

- [x] 2.1 Update `apps/web/src/pages/about/index.astro` to import the existing `Mail` icon and render the contact title, intro, and ordered items as one semantic route-local contact section.
- [x] 2.2 Render the first authored item as the primary full-width row and every later item as a secondary row, with each entire row linking to `mailto:${item.value}` and the icon hidden from assistive technology.

## 3. Selected Primary Inbox Styling

- [x] 3.1 Add contact-specific styles in `apps/web/src/styles/global.css` for the flat BlackBox surface, role/address hierarchy, thin separators, complete-row anchors, 44-pixel minimum targets, the visually subordinate 18-pixel mail icon, WCAG 2.2 AA contrast, restrained hover, visible `:focus-visible`, `min-width: 0`, and address wrapping.
- [x] 3.2 Add the wide two-column secondary layout with the primary item spanning both columns, while keeping a single-column authored order without horizontal overflow down to 320 CSS pixels.

## 4. Verification

- [x] 4.1 Run the focused contact presentation test and confirm the markup/CSS contract passes.
- [x] 4.2 Merge the latest `main` into `codex/contact-info-visual-update`, resolve any overlap, and confirm no unmerged paths remain before final validation.
- [x] 4.3 Run `pnpm test:unit`, `pnpm check`, and `pnpm build` against the resulting final implementation tree.
- [x] 4.4 Use Browser Use on the rendered About page at desktop and 320-pixel widths to verify exact labels and addresses, exact `mailto:` destinations, source/focus order, WCAG 2.2 AA contrast, visible focus, complete-row targets, compact mail icons, wrapping, no horizontal overflow, preserved shell behavior, and no console errors.
