# Validation

Scope: the 2026-09-30 image-delivery fixes (gateway `Accept`, width snapping, published HTML edge cache). Earlier tasks in this change keep their own evidence.

Base commit: `8a1a1677`. Commits `08642424`, `36433f61` and `50c3ddf8` on branch `claude/image-loading-performance-21ca0a` (worktree `checkout-compact-design-7a18c0`), local only.
Product Environment: Local for repository checks. Before-change measurements are PRD, release `b8560566`, in `.codex-artifacts/runtime-performance/2026-09-30-image-loading-research/report.md` (ignored).

## Repository gates

- `pnpm test:tooling`: 32 contract tests and 56 node tests pass, including both gateway tests. The new gateway test fails against the previous gateway.
- `pnpm test apps/backend/src/cms/public-image-transform.worker.test.ts`: `cms-runtime`, `cms-integration` and `backend-runtime` pass.
- `pnpm --filter @blackbox/backend build:public`: passes; the generated `dist-public/server/wrangler.json` has `exports.default.cache.enabled: true` and keeps `cache.enabled: false` at the top level.
- `pnpm openspec -- --allow-worktree validate complete-image-delivery --type change --strict`: valid. It had failed before this round because the cache-policy delta omitted the baseline scenario "Cache behavior is documented".
- Final `pnpm validate`: the run pointer is kept in `.codex-artifacts/image-delivery-fixes/final-validation.md` (ignored), so recording it does not change the tested source.

## Acceptance rows

- CMS/schema/publication: renderer image delivery and HTML cache policy. Covered by the worker tests above; the Local renderer smoke did not run (see below).
- Boundaries/tooling/instructions: gateway test added to `test:tooling`; docs updated in `content-publication.md` and `content-workspace.md`.
- Release/environment: hosted verification is pending a user release. Shell/player and commerce rows do not apply.

## Hosted verification after release (UAT, then PRD)

```bash
U=https://blackbox-records-web-uat.pages.dev
IMG=$(curl -s "$U/" | grep -o '/media/content/[a-f0-9]\{64\}/[a-f0-9]\{64\}' | head -1)
curl -sI "$U/_image?href=$IMG&w=80" -H 'Accept: image/avif,image/webp,*/*' | grep -iE 'content-type|vary|cf-cache-status'
curl -sI "$U/_image?href=$IMG&w=80" -H 'Accept: image/jpeg' | grep -i content-type
curl -s "$U/_image?href=$IMG&w=80" -H 'Accept: image/webp' | sha256sum
curl -s "$U/_image?href=$IMG&w=96" -H 'Accept: image/webp' | sha256sum
curl -sI "$U/_image?href=$IMG&w=5000" | grep -iE 'content-length|content-type'
curl -sI "$U/store/" | grep -iE 'cache-control|cf-cache-status|^age|^date'
curl -sI "$U/content-version.json" | grep -i cache-control
curl -sI "$U/no-such-page/" | grep -iE '^HTTP|cache-control'
```

Expected: AVIF or WebP versus JPEG by `Accept`, with `Vary: accept`; equal hashes for `w=80` and `w=96`; `w=5000` far below the original's length; a second `/store/` request within 30 seconds reports `cf-cache-status: HIT` or `UPDATING` (an identical `Date` also proves reuse); `no-store` on the version JSON and the 404. Then publish one UAT text change and poll `x-content-sha256` on an affected page; it must change within about 65 seconds.

## Not verified

- The Local renderer smoke (`apps/backend/test/emdash/public-runtime-smoke.mjs`, run with `node --import tsx` against the 2026-09-15 Local publication snapshot) fails at `/` with a workerd internal error. It fails identically with the default-entrypoint cache disabled, and no passing run is on record. Its new `Cache-Control` assertions therefore have not run. Logs: `.codex-artifacts/image-delivery-fixes/public-runtime-smoke-*.log` (ignored).
- Workers Caching is not emulated locally; HTML reuse, `Vary: accept` variants and the 60-second window are hosted checks.
- Firefox tab-switch behaviour on `/artists/`.
