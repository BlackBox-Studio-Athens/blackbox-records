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

## Public web budget and safe prose

- Before the renderer split, a fresh `pnpm build:web` completed Astro and route isolation but failed its existing Home budget at 110,118 Brotli bytes against 97,280. Rebuilding with the original content-model package metadata failed at 114,530 bytes. The reports are `final/web-bundle-report.json` and `final/web-bundle-original-package.json`.
- The fresh standard `pnpm build:web` after separating browser prose helpers passed with the budget unchanged. Home is 89,570 bytes, leaving 7,710 bytes of headroom; the other reported routes are 81,200 bytes. Home decreased 20,548 bytes from the 110,118-byte pre-split result. The current report is `.codex-artifacts/reduce-staff-bootstrap-cost/final/web-bundle-report.json`.
- The public renderer now uses the same type-aware URL predicate as `cmsLinkSchema`; CMS validation stays in Zod. Safe blank links keep their `target`/`rel` behavior, while unsafe and non-string values render text without an anchor. A focused `NewsletterSignupForm.test.tsx` run passed after the final root export. `test:contracts` passed the helper/schema parity cases for web, mail, relative, protocol-relative, unsafe, malformed, whitespace/backslash, and non-string values.
- Fresh `pnpm build:staff` passed the four staff budgets with no initial project stylesheet URLs and zero diagnostics. The report is `.codex-artifacts/reduce-staff-bootstrap-cost/final/staff-bundle-report.json`. This report was built from the shared working tree, which also contains concurrent EmDash staff edits; the original baseline comparison above remains the attribution for the staff optimization.

## Local implementation

- Added `"sideEffects": false` to `@blackbox/content-model` after auditing its re-exported modules. Existing entrypoints/imports stayed intact. The standard staff report shows Overview and Orders shed unrelated content-schema chunks; Website and Stock retain their required schema code.
- Added `build.inlineStylesheets: 'always'` to the staff Astro build. Every route has zero initial project stylesheet links. Final Brotli HTML is 16,222–17,660 bytes, below the 24 KiB budget. Google Fonts and the lazy editor/picker style boundary remain in place.
- Final `pnpm validate` was invalidated by a concurrent edit to `apps/backend/src/cms/public-runtime.ts`. Its `check:types` phase reports `TS2339` there because the EmDash edit references a missing `PublicImageRenderer` export; unit tests were cancelled and later phases skipped. The summary is `.codex-artifacts/validation/2026-09-25T10-55-54-943Z-61776/summary.json`; no final passing repository fingerprint exists.
- In the latest `pnpm validate:editor` run, build, preview-policy, Chromium, and Firefox phases all passed. The runner marked the result invalidated because `docs/content-workspace.md` changed during validation; see `.codex-artifacts/validation/2026-09-25T10-35-04-169Z-72140/summary.json`. The Chromium/Firefox runs covered editor entry, navigation, picker/history/preview styling, incomplete drafts, autosave, conflicts/recovery, and save-before-leave.
- The canonical CMS build passed on the existing target. Its source guard rejected KV bindings and the generated `apps/backend/dist/server/wrangler.json` had `kv_namespaces: []`.
- `test:staff-hosting` passed against the local combined artifact: staff pages and assets remained private, emitted no `Set-Cookie`, returned the expected 200/304 responses, and denied missing/invalid hosted Access assertions. It avoided 55,870 decoded response-body bytes on authenticated repeat module reads.
- `test:cms-content` passed for all 13 compiled collections, including valid/invalid saves, stale writes, references, deletion restrictions, and 251 mixed-draft pagination fixtures.
- Native Browser Use rendered the local Home and Disintegration purchase-information pages. An empty newsletter submission showed the email validation message without sending a request. Browser Use exposes no console inspection; the DevTools fallback could not initialize because its Chrome profile was already running, so console cleanliness remains unverified. The referenced `scripts/browser-use-smoke-probe.md` was not present in this checkout.
- The local WebStorm OpenSpec configuration now invokes the existing root `openspec` script with strict change-validation arguments; strict validation passed. `pnpm format:check` and `git diff --check` passed. The local configuration is ignored and is not part of the repository commit. `measurements.md` remains the unchanged September 24 baseline. Hosted rollout tasks 5.1–5.4 remain intentionally unrun.

## Hosted rollout

Not run. Tasks 5.1–5.4 require a separately authorized UAT rollout and reviewed PRD promotion, plus fresh Free-tier evidence.
