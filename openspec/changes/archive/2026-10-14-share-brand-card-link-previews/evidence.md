# Evidence

Product Environment: Local. Rows: Shell/player/routing (head metadata only; no routing, overlay or player change) and Boundaries/tooling (PRD Holding scripts).

- `pnpm openspec -- validate share-brand-card-link-previews --type change --strict`: valid.
- `pnpm test apps/web/src/layouts/SiteLayout.test.ts` and `pnpm test apps/web/src/pages/_prd-holding-content.test.ts`: passed.
- `pnpm validate`: passed (`mode: local`), `.codex-artifacts/validation/2026-10-11T17-24-58-670Z-15156-826ba6/summary.json`. The tree also held the uncommitted `upgrade-emdash-1-2-0` work, which this change does not include.
- Card: `apps/web/public/assets/images/brand/share-card.jpg`, 1200 × 630 JPEG, 23.5 KB, inspected visually.

Unverified: task 2.1 (rendered Local heads). The running full Local stack belongs to the EmDash upgrade session and serves output built before this change, so it was not restarted. Task 2.3 needs a hosted deployment.
