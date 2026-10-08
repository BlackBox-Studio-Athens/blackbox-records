# Validation

Source: `main` at `88765833` plus this change's working-tree edits. Product Environment: Local.

## Acceptance rows

- Shell/player/routing: applies (Coverflow controls, plaque Listen and player handoff).
- Boundaries/tooling/instructions: strict OpenSpec validation only; no boundary policy changed.
- Staff/editor, CMS/schema/publication, Commerce/checkout/stock, Release/environment: not applicable; no staff, content, commerce or release code changed.

## Checks

- Unit: `vitest run` on `StoreCoverflowController.test.ts`, `distro-coverflow.test.ts`, `shell-page-snapshot.test.ts`: 47 passed.
- Playwright, `e2e/store-formats.spec.ts` filtered to the two Coverflow wheel tests, Distro alphabetical order and Coverflow steps: 4 passed against a side-port `astro dev` on 4391 (the running Local stack on 4321 serves a prebuilt renderer). Config: ignored `.codex-artifacts/pw-4391.config.ts`.
- `pnpm openspec -- validate refine-store-coverflow-controls --type change --strict`: valid.
- `pnpm validate`: `.codex-artifacts/validation/2026-10-08T15-05-40-854Z-43292-4dbb80/summary.json`, `mode: local`, status failed. 46 of 47 Nx tasks passed, including every web module test, lint and type check this change affects. The single failure is `workspace:lint` on `scripts/verify-runtime-config.ts:263` (`eqeqeq`), an uncommitted edit from another session that this change does not touch.

## Browser pass (side-port Astro, Chromium via playwright-cli)

- 1280px: no rail; the switch measures 230×46 with Coverflow pressed in ink; Previous and Next are 112×44; the plaque is 576×46 with Listen first. The front card's own Listen computes `display: none`.
- Stepping to the second Distro record moved the plaque Listen to `distro:aflmsmp-i-went-to-the-mountain-vinyl`. Pressing it opened the Music player for "I went to the mountain — AFLMSMP" on `/store/distro/` and the plaque took `data-music-listen-session="active"`; Escape closed it and focus returned to the plaque Listen, which read Listen again.
- 390px: the switch fills the first row, Previous and Next split the second, the plaque wraps the title to two lines, and `scrollWidth` stays 390.

## Unverified

- Reduced-motion rendering is covered by the CSS source test, not by a browser pass.
- The full e2e suite and the push-only fixture gates (`pnpm build:web`) run in CI.
