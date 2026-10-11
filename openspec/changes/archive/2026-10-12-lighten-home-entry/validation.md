# Validation

Base commit: `f49f4f68` (change uncommitted on `main` at validation time).
Product Environments: PRD (`https://blackbox-records-web.pages.dev/`, read-only GETs) for the reports; Local static build (`astro preview --root . --port 4399`, started and stopped for this run) for the after state.

## Repository gates

- `pnpm validate` (with `NX_PLUGIN_NO_TIMEOUTS=true`): PASSED, `mode: local`, `scope: all`, 315.4 s. Summary `.codex-artifacts/validation/2026-10-02T00-54-24-582Z-86952-8ce0a4/summary.json`; before/after fingerprint `aba82fb7c111af751cbb243964af49728d35d4590083ee84b0126f8feb446887`. This note was written after the run, so the tracked tree differs only by OpenSpec notes.
- Focused: `vitest run --config vitest.modules.config.ts src/components/app-shell/navigation src/styles`: 19 files, 89 tests passed, including the new `shell-transition.test.ts`.
- `pnpm --filter @blackbox/web build`: passed, including `brand-font:check` (`92be7827…0e2d`, 78,616 bytes).
- `pnpm openspec -- validate lighten-home-entry --type change --strict`: valid.

## Font derivative

- `simplify-veneer.py` run twice on the original produced identical bytes (`92be7827d6c18ddf62ea4e84709f42700025c07059842e13158ea9bcfee50e2d`).
- Unchanged: 233 glyphs in the same order, 231 cmap entries, every advance width, and the raw GPOS, GSUB, GDEF, name, OS/2, post, gasp and cvt tables. Changed only through outline recalculation: `hhea` minRightSideBearing −89 → −87 and xMaxExtent 1671 → 1669, `head` xMax 1671 → 1669 and flags bit 1, `maxp` maxPoints 3936 → 816 and maxContours 668 → 181.
- Candidates benchmarked in a fresh renderer (layout of a never-seen size, desktop, unthrottled): original about 385 ms; t4-d8 139; t6-d8 87; t6-d12 44; t4-d16 41; t8-d12 27; t8-d24 7; t12-d32 3. Contour count, not edge points, drives the cost (t2-d0 kept every contour and still cost about 340 ms).
- Visual comparison at 54 px on a 3x density screen and 120 px on 2x: blotches and rough edges are kept in all candidates; the finest dust thins out as the speck threshold rises. The owner chose t8-d12.

## Browser acceptance (Acceptance row: Shell/player/routing)

Tool: Chrome DevTools MCP, fresh isolated contexts, 390x844 DPR 3 mobile emulation, Fast 4G, 4x CPU.

- PRD before: after a shell tap from Artists to Home, the hero `<img>` measures 4,991 px tall (viewport 844) and `<main>` keeps `style="opacity: 1; transform: translateY(0px);"`; a direct load measures 844 px. Screenshots of both are in the session scratchpad (`prd-hero-shell-nav-bug.png`).
- Local after, cold Artists to Home tap: hero height 844 px in every frame during and after the transition; `<main>` keeps only `opacity: 1`; media-layer opacity at 20% of the viewport scroll is `0.580` after shell navigation, as on a direct load.
- Long animation frame of the tap: original Veneer 2,973 ms (forced layout 2,830 ms); simplified 245 ms and 285 ms in two runs (forced layout 195 and 212 ms), with one outlier of 776 ms while the Artists page was still loading. Home was revealed at 679 ms instead of 3,496 ms, with the hero image already complete.

## Not verified

- PRD after state: requires release and promotion.
- Greek and accented text in Veneer: glyphs are unchanged in set and metrics but were not rendered for review.
- Real phones; CPU throttling only approximates them.
- The Holding Page artifact (`pnpm prd:holding:prepare` and its check) was not rebuilt; it copies the same public font file.
