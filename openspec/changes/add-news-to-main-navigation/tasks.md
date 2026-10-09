# Tasks

## 1. Shared navigation

- [x] 1.1 Show News last in the retained navigation, replace the hidden-News agent guidance and add shell navigation/overlay/player checks; verify `pnpm test:app-shell` and the focused shell-navigation e2e pass.

## 2. Local publication

- [x] 2.1 Save, review and publish only the Local News navigation entry; verify the accepted publication and rendered header show News last while footer navigation remains unchanged.
- [x] 2.2 Inspect the Local navigation at 320, 390, 1024 and 1440 px; verify no clipping or horizontal overflow and preserve keyboard focus and player continuity.

## 3. Completion evidence

- [x] 3.1 Run the shell-navigation and player-continuity specs, `pnpm agent:check`, strict OpenSpec validation and `pnpm validate`; record source-bound evidence and the separate UAT/PRD Content Publication requirement.

## 4. Who we are last

- [x] 4.1 Move News to `order: 5` and Who we are to `order: 6` in the retained navigation, guidance, delta spec and shell-navigation checks; verify the shell-navigation e2e passes.
- [ ] 4.2 Maintainer publishes the reordered News and Who we are navigation entries in each CMS (Local, UAT, PRD), with News `show_in_header: true`.
