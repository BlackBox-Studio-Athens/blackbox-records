## Context

The same navigation entries rendered three ways:

- `HeaderDesktopNav.astro` used inline Tailwind and per-accent classes.
- `MobileNavigationSheet.tsx` used its own class strings, which always coloured Store with a left stripe.
- `Footer.astro` used `.site-footer-link`, whose phone overrides forced one clipped row.

The Menu reused `getHeaderNavigationItems()`, which excludes Home because the desktop logo links there. DESIGN.md already reserves Store and Services accents for hover and active states and bans side stripes.

## Decisions

- **Home is structural.**
  - `getMainNavigation()` returns `{ home, sections }`. `home` comes from `SITE_PAGES`, and the element type of `sections` excludes `/`.
  - The Menu requires `home`, so it cannot render without Home. Home cannot appear twice, because the section type and the schema rule both exclude it.
  - A Home entry may still appear in the footer.
- **One link model.** `navigationLinkAttributes(url, pathname)` in `web-platform` returns:
  - `href`
  - `aria-current`
  - the prefetch hint
  - `data-nav-accent`
  - `data-nav-link`

  Astro and React spread the same object. `data-nav-link` also drives the current-state sync for the static header and footer after shell navigation.

- **One link style.** `.site-nav-link` holds the rest, hover, press and current colours and the single underline marker on `.site-nav-link__label`. Surface modifiers (`--header`, `--menu`, `--footer`) carry only sizing.
  - Hover applies only under `(hover: hover)`, so a tap leaves no stuck state.
  - `:active` gives touch feedback.
- **Menu state.**
  - A `(min-width: 64rem)` listener closes the Menu where its button hides.
  - An effect mirrors the open state into the button's `aria-expanded`.
  - Radix returns focus only to its own `Dialog.Trigger`, and the Astro-rendered button is not one. `onCloseAutoFocus` therefore focuses the button explicitly. Shell navigation still moves focus to `main` afterwards.
- **No redesign.** The Menu keeps its side panel, 12px tracked labels and heading. Only changes that are clearly better practice are made.

## Risks / Trade-offs

- A Home entry saved with the main-menu flag now fails validation. Both hosted header lists already exclude `/`.
- `SITE_PAGES[0]` must remain Home. The `url: '/'` type on `home` fails to compile otherwise.
- Duplicate section entries are not rejected. Navigation entries are fixed records without a create path.

## Migration Plan

No data migration. To roll back, revert the change.
