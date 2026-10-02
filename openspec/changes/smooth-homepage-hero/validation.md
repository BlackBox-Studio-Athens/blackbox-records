# Validation

Base commit: `58218e2550db126b8ca9f63b4b7ecb60cd506b74` (change uncommitted on `main` at validation time).
Product Environments: PRD (`https://blackbox-records-web.pages.dev/`, read-only GETs) for the reports and the before baseline; UAT as an early proxy; Local static build (`astro preview --root . --port 4399`, started and stopped for this run) for the after state.

## Repository gates

- `pnpm validate` (with `NX_PLUGIN_NO_TIMEOUTS=true`): PASSED, `mode: local`, `scope: all`, 115.4 s. Summary `.codex-artifacts/validation/2026-10-02T00-05-05-967Z-64332/summary.json`; before/after fingerprint `b821a93b9d7058b7fbb7154aeb57c03bc2d11d4558bdc5c8b00380f5a56a1c14`. This note was written after the run, so the tracked tree differs only by OpenSpec notes.
- Focused: `vitest run --config vitest.modules.config.ts src/styles src/layouts src/components/app-shell/navigation src/components/app-shell/dom` from `apps/web`: 31 files, 140 tests passed after the loader test injected `preloadImages`.
- `pnpm openspec -- validate smooth-homepage-hero --type change --strict`: valid. Its INFO notes that archive needs `reveal-first-screen-images` archived first.
- Production build CSS keeps `animation-timeline:scroll(root)`, `animation-range:0 42vh` and keyframes `0%{opacity:1}to{opacity:.12}` / `0%{opacity:0}to{opacity:.5}`. An `animation` shorthand beside `animation-timeline` had been minified to `animation:none`, hence the longhands.

## Browser acceptance (Acceptance row: Shell/player/routing)

Tool: Chrome DevTools MCP, own Chrome, fresh isolated contexts, 390x844 DPR 3 mobile touch emulation, Fast 4G, 4x CPU unless stated. Claude in Chrome reported `visibilityState: hidden` (rAF paused, navigation stalled) and was not used for timing.

### Scroll fade (Local after)

Computed opacity of the media layer / veil by scroll offset (`vh` = 844 px): 0 → `1.000/0.000`; 0.1 → `0.791/0.119`; 0.2 → `0.580/0.239`; 0.21 → `0.562/0.249` (class `n`); 0.22 → `0.539/0.262` (class `S`, no step); 0.3 → `0.371/0.357`; 0.42 → `0.121/0.499`; 0.6 and 1.5 → `0.120/0.500`; scrolling back returns along the same values. Before the explicit `from` keyframes the value jumped to `0.120` at the class threshold, because an implicit `from` takes the class opacity.

Scripted scroll 0 → 500 px in 5 px rAF steps (100 frames), traces `hero-scroll-prd-before.json.gz` vs `hero-scroll-after.json.gz` in the session scratchpad: Paint 0 vs 0; UpdateLayoutTree 37.8 vs 31.0 ms (at most 2 vs 4 elements); PrePaint 23.8 vs 52.6 ms (opacity property updates, about 0.3 ms per frame at 4x); total main-thread RunTask 379.9 vs 375.2 ms. No long task.

### Photo lag on shell navigation to Home

PRD before, cold Artists (scrolled 1500 px) → Home via the header logo: Home HTML 30–676 ms; one long animation frame of 2325 ms (blocking 2269 ms) attributed to `Response.text.then` in AppShellRoot with 2285 ms forced style and layout; hero image requested at 2994 ms, finished 4996 ms; reveal at 3333 ms, so the photo arrived about 1.7 s after reveal. UAT showed the same pattern (forced Layout 2391 ms, stack `lenis.resize` ← `scrollWithLenis` ← shell scroll reset).

Cause of the layout cost: Veneer brand-font text. Offscreen probes in a fresh renderer: each new Veneer glyph size costs 465–997 ms at 4x CPU and 223–303 ms unthrottled; Bebas 10 ms, Inter 1 ms; repeating the same text and size costs 0 ms. `veneer_regular.woff2` glyphs have 1,600–4,300 outline commands each. Not addressed by this change.

Local after, cold Artists → Home: Home HTML 239–435 ms; long frame 2973 ms (Veneer, unchanged); hero image requested at 499 ms during that frame and finished at 899 ms; the first Home frame already had the hero `complete`, and the reveal started at 3496 ms with the photo present.

## Firefox fallback

Base commit: `d69c5ec8` (fallback uncommitted on `main` at validation time). Tools: Playwright 1.63 headless Firefox 155 (`firefox-1543`) and Chromium (`chromium-1243`). The after state ran on a Local production preview (`astro preview --root . --port 4399`, started and stopped for this run); the before state used PRD read-only GETs.

- Cause: the PRD and UAT bundles already contain `animation-timeline:scroll(root)`. Firefox 155 returns false for `CSS.supports('animation-timeline: scroll()')` (MDN lists Firefox as `preview`), so it took the coarse crossfade.
- PRD before, Firefox, 390 px (layer/veil, class): `1/0` (n) from 0 to 0.21 vh, then `0.12/0.5` (S) at 0.22 vh, reached through the 240 ms transition.
- Local after, Firefox, instant scroll, 390 px:

  | Offset (vh) | Layer/veil    | Class |
  | ----------- | ------------- | ----- |
  | 0           | `1.000/0.000` | n     |
  | 0.1         | `0.791/0.119` | n     |
  | 0.2         | `0.580/0.239` | n     |
  | 0.21        | `0.561/0.249` | n     |
  | 0.22        | `0.539/0.262` | S     |
  | 0.3         | `0.371/0.357` | S     |
  | 0.42        | `0.121/0.500` | S     |
  | 0.6 and 1.5 | `0.120/0.500` | S     |

  1440 px follows the same path: 0.1 → `0.790/0.119`, 0.21 → `0.560/0.250` (S), 0.3 → `0.371/0.357`, 0.42 → `0.120/0.500`. Both match the Chrome table above. Both fade animations report `paused`; the veil's runs on `::after`.

- Lenis wheel scroll to 467 px and back, sampled every frame: opacity never moved against the scroll. The largest change per frame was 0.025–0.041 at 390 px and 0.064–0.083 at 1440 px, against 0.231 and 0.696 on PRD. Nothing was seeked beyond 42vh. A write trace attributed every `currentTime` write to the two hero fades and found none at rest.
- Shell Home → Artists (scrolled to 1200 px) → Home, with one navigation entry: `1/0`, not scrolled, at the top; `0.371/0.357` at y = 253 on the recreated hero.
- Reduced motion (`reducedMotion: 'reduce'`): no fade animations; `1/0` up to 0.21 vh and `0.120/0.500` from 0.22 vh, with no seeks.
- Chromium: table unchanged (0.1 → `0.791/0.118`, 0.3 → `0.372/0.357`, 0.42 → `0.121/0.499`); the fades run on the scroll timeline (`running`) with zero seeks.
- Cost in Firefox (desktop, unthrottled): seeking both animations plus a forced style flush took 0.05 ms per frame.
- Pacing A/B: interleaved runs on the same build at 390 px, 4 pairs of 360 frames each. "Before" served the CSS rewritten back to the 240 ms crossfade.

  | Pair | Median frame (before/after) | p95 (before/after) | Frames over 20 ms (before/after) |
  | ---- | --------------------------- | ------------------ | -------------------------------- |
  | 1    | 8.3/8.3 ms                  | 16.7/16.7 ms       | 8/14                             |
  | 2    | 8.3/8.3 ms                  | 16.7/16.7 ms       | 11/12                            |
  | 3    | 8.3/8.3 ms                  | 25/25 ms           | 37/38                            |
  | 4    | 8.3/8.3 ms                  | 25/25 ms           | 21/23                            |

  Machine load drives the spread between runs. "After" has 1–6 more slow frames per pair, within that spread. Headless Firefox renders in software.

- Build: the minified CSS keeps:
  - `@supports (animation-timeline:scroll()){…{animation-timeline:scroll(root);animation-range:0 42vh}}`;
  - `@supports not (animation-timeline:scroll()){…{animation-duration:1s;animation-play-state:paused}}`;
  - the base longhands `animation-name`, `animation-timing-function:linear` and `animation-fill-mode:both`.

  No `240ms` remains on the hero.

- Tests: `vitest run --config vitest.modules.config.ts src/components/app-shell/dom src/styles src/components/app-shell/navigation` from `apps/web` passed 27 files and 126 tests. The production build passed `brand-font:check` and the image markup check.
- `pnpm openspec -- validate smooth-homepage-hero --type change --strict`: valid; the INFO about `reveal-first-screen-images` is unchanged.
- `pnpm validate` (with `NX_PLUGIN_NO_TIMEOUTS=true`): PASSED, `mode: local`, `scope: all`, 136.7 s. Summary `.codex-artifacts/validation/2026-10-02T10-27-03-874Z-88536-9a00dc/summary.json`; before/after fingerprint `6a005812fe04351f57e8a47f1052adc8cdadb2e3cd5efe19b3dc4aa7eebdc041`. This line was added after the run, so the tracked tree differs only by this note.
- Probe scripts `hero-fade-firefox.cjs` and `hero-fade-ab.cjs` live in the session scratchpad and are not tracked.

## Not verified

- PRD after state: requires release and promotion.
- Firefox on a real Android device, and Firefox profiler paint and composite numbers; headless Firefox renders in software.
- Safari before 26: same fallback code path, not opened.
- Real reduced-motion preference in a browser beyond Playwright emulation (CSS order is asserted by the CSS test).
- Real phones; CPU throttling only approximates them.
