# Implementation evidence

## Starting point

- `pnpm openspec:guard` passed on `main` before implementation.
- Source SHA before edits: `b1e72cee324cb684be9abe8f189ea52bb5fb25b0`.
- The tracked working tree was clean. The supplied `openspec/changes/reduce-staff-bootstrap-cost/` directory was the only untracked path.
- `packages/content-model/src/index.ts` re-exports 12 modules. Their module-scope work is local value initialization (constants, regular expressions, and Zod schemas). The audit found no required global mutation, registration, polyfill, stylesheet import, or I/O. Existing public exports and consumer imports remain required and will be preserved.

## Baseline staff build

- `pnpm build:staff` passed before configuration edits on source SHA `b1e72cee324cb684be9abe8f189ea52bb5fb25b0` (Node `v24.21.0`, pnpm `12.0.0`, static output, site `https://staff.blackboxrecordsathens.com`, base `/`).
- Retained the complete build at `.codex-artifacts/reduce-staff-bootstrap-cost/baseline/dist/`; `.codex-artifacts/` is ignored.
- Route documents are in `baseline/dist/index.html` (Overview, 17,425 bytes), `baseline/dist/content/index.html` (Website, 15,256 bytes), `baseline/dist/stock/index.html` (Stock, 17,983 bytes), and `baseline/dist/orders/index.html` (Orders, 16,798 bytes). Their SHA-256 hashes and build manifest are in `baseline/manifest.json`.

## Bundle graph and standard build

- Extended the existing bundle checker with the staff profile and appended it to the standard `build:staff` command after route isolation. The default web profile and `--dist`/`--output` options remain available.
- `pnpm build:staff` passed with both settings. Its full report is retained at `.codex-artifacts/reduce-staff-bootstrap-cost/final/staff-bundle-report.json`; the built route documents and hashes are under `final/dist/` and `final/manifest.json`.
- Eager JavaScript and compressed HTML use Brotli quality 11. Baseline → final sizes (bytes) were:

  | Route    |         JS Brotli | JS budget |    HTML Brotli | HTML budget | Initial project stylesheets |
  | -------- | ----------------: | --------: | -------------: | ----------: | --------------------------: |
  | Overview | 138,835 → 113,943 |   118,784 | 3,928 → 16,222 |      24,576 |                       1 → 0 |
  | Website  | 163,085 → 163,937 |   168,960 | 3,790 → 16,922 |      24,576 |                       2 → 0 |
  | Stock    | 145,796 → 142,346 |   148,480 | 4,151 → 16,438 |      24,576 |                       1 → 0 |
  | Orders   | 143,342 → 118,457 |   122,880 | 4,171 → 17,660 |      24,576 |                       2 → 0 |

- The old baseline failed on all four project stylesheet checks and on Overview/Orders JavaScript budgets. The final standard build passed all four route budgets. Website retains its eager content schema chunk; functional validation remains covered by the existing workspace checks below.
- Checker probes exited nonzero for an unknown scope, four missing route documents, a missing referenced chunk, and baseline budget violations. A synthetic `href`-before-`rel` stylesheet was detected. Reports preserved all four routes and actionable diagnostics.

## Existing web bundle gate discrepancy

- A fresh `pnpm build:web` passed, but the unchanged default `pnpm performance:bundles` check failed: the home eager graph was 110,118 Brotli bytes against 97,280. The report is `final/web-bundle-report.json`.
- Rebuilt the same source with the original content-model package metadata (without `sideEffects: false`); `pnpm build:web` passed and the default bundle check still failed at 114,530 bytes. That report is `final/web-bundle-original-package.json`.
- The proposed metadata reduces this graph by 4,412 bytes but does not bring it under the existing budget. The design requires the existing web check to pass and forbids raising budgets to mask a regression. Per user direction, the implementation remains staff-only; task 3.2 stays open with this fresh-build failure recorded. No web budget or route code was changed.

## Local implementation

- Added `"sideEffects": false` to `@blackbox/content-model` after auditing its re-exported modules. Existing entrypoints/imports stayed intact. The standard staff report shows Overview and Orders shed unrelated content-schema chunks; Website and Stock retain their required schema code.
- Added `build.inlineStylesheets: 'always'` to the staff Astro build. Every route has zero initial project stylesheet links. Final Brotli HTML is 16,222–17,660 bytes, below the 24 KiB budget. Google Fonts and the lazy editor/picker style boundary remain in place.
- A preliminary `pnpm validate` passed before the last task/evidence notes; its summary is `.codex-artifacts/validation/2026-09-25T08-15-51-999Z-25748/summary.json`. Final full and editor validation summaries are retained under ignored `.codex-artifacts/validation/` and record the finalized source fingerprint.
- `pnpm validate:editor` exited 0 with its expected partial status. The preview-policy, Chromium, and Firefox phases passed. The browser runs verified editor entry, navigation, picker/history/preview styling, incomplete drafts, autosave, conflict/recovery, and save-before-leave flows; screenshots and request reports are retained in `.codex-artifacts/validation/2026-09-25T08-22-33-912Z-61052/`.
- The canonical CMS build passed on the existing target. Its source guard rejected KV bindings and the generated `apps/backend/dist/server/wrangler.json` had `kv_namespaces: []`.
- `test:staff-hosting` passed against the local combined artifact: staff pages and assets remained private, emitted no `Set-Cookie`, returned the expected 200/304 responses, and denied missing/invalid hosted Access assertions. It avoided 55,870 decoded response-body bytes on authenticated repeat module reads.
- `test:cms-content` passed for all 13 compiled collections, including valid/invalid saves, stale writes, references, deletion restrictions, and 251 mixed-draft pagination fixtures.
- Native Browser Use rendered the built Overview at desktop and 390 × 844 viewport sizes without a layout overflow. Its static preview has no CMS/API service, so data-dependent editor behavior is covered by the Chromium/Firefox fixture runs above.
- Full/editor validation summaries and exact source fingerprints are retained under ignored `.codex-artifacts/validation/`; use the latest summaries as the implementation-tree record. Strict OpenSpec validation passed through WebStorm (exit 0): the root `openspec` script ran `validate reduce-staff-bootstrap-cost --type change --strict`. The main-worktree guard passed first. I repaired the ignored local `.idea/workspace.xml` run configuration, replacing its nonexistent `codex:openspec:validate:specs` script with the existing `openspec` script and strict arguments; direct guarded shell invocation remains blocked by the execution hook. `pnpm format:check` and `git diff --check` also passed. `measurements.md` remains the unchanged September 24 baseline. Hosted rollout tasks 5.1–5.4 remain intentionally unrun.

## Hosted rollout

Not run. Tasks 5.1–5.4 require a separately authorized UAT rollout and reviewed PRD promotion, plus fresh Free-tier evidence.
