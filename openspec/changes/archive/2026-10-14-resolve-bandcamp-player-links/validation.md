# Validation

## Source and repository gates

Working tree on main, initially based on a3c01441a60dee79eda7b604a13a67ef748bc1f2. Concurrent security-review work is outside this change; the final summary records the current HEAD.

`pnpm validate` passed all 63 selected tasks (tests, lint, type checks, formatting and architecture). The source-matched Local summary is `.codex-artifacts/validation/2026-10-11T23-26-22-239Z-15848-2c98fa/summary.json`; its before/after fingerprint is 102a5e3e273d398d98000918f7d3206a70f70bbf56a6b2fc8ab1178578db4e1c. The final post-handoff run pointer is retained in `.codex-artifacts/bandcamp/final-validation.json`; that summary is authoritative for the final tree.

The initial validation passed its selected tasks, then automatically reran after documentation/browser-test edits and failed formatting. A fresh normal run formatted the test and passed; no remaining failure was hidden. The initial multi-file pnpm test invocation supplied unsupported runner arguments; checks were rerun by module.

Focused iteration: `pnpm test cms-runtime` passed 146 tests, `pnpm test staff-content` passed 24 tests, and the affected public-player selection passed nine module tasks. The final gate reuses these only when their recorded code inputs match. Strict `pnpm openspec -- validate resolve-bandcamp-player-links --type change --strict` passed. `graphify update .` completed locally with its existing unrelated pages-workflow-contract parser warning; no semantic/paid enrichment ran.

## Local staff, CMS and publication

The normal stripe-mock Local stack served Staff on 127.0.0.1:8787. Live upstream resolution returned album 2345223781 for Ethos and track 1718987398 for Hail. Pasting Ethos in the existing Local editorial-acceptance fixture produced a canonical embed-only PUT 200 and private preview 200. No raw page URL entered stored content.

Chromium checks exercised failed replacement preservation, Retry, Revert, Clear, stale response rejection, autosave blocking while another field changed, review blocking, ordinary navigation blocking, cancelable beforeunload protection, and explicit discard resetting the unfinished field. The temporary player and title changes were cleared/restored; no hosted content changed. Reusable retry/race/save regression assertions were added to the existing content-workspace browser suite. Its full Chromium/Firefox CI suite was not run locally, as that needs a maintainer grant.

`.codex-artifacts/bandcamp/browser-check.js` retains the focused browser assertions. The Local UI also logged existing auth/me 404s and preview font warnings, plus the two deliberately injected lookup 422s; these did not prevent the tested field behavior.

After rebuilding the final staff source (ContentFields.CP0sMk9d.js, built at 02:32:25 Europe/Bucharest), the focused live Ethos/Hail and guard/race/recovery checks passed again. Additional assertions covered unload protection, discarding an in-flight lookup, and switching to Caregivers without a late result crossing editor reset or identity. Temporary Local changes were restored and the owned stack/browser session were stopped afterward.

The final Caregivers editor switch reported a preview image-readiness timeout. Complete image readiness is not established by the field checks; the combined preview API smoke passed separately. This change does not alter preview image delivery.

`node --import tsx scripts/test-local-content-publication.mjs` passed: unrelatedDraftPrivate=true, idempotency=true, combinedPreview=true, single publication 4383 ms and batch 1964 ms. That smoke changes/restores its own Local drafts and establishes no hosted acceptance.

## Player

The generated Ethos player loaded the correct title, artist and track list. After explicit Play, Chromium's audio element reported currentTime=20.724479, paused=false and readyState=4 without a media error. Playback was then paused. Screenshot: `.codex-artifacts/bandcamp/ethos-player.png`. Provider analytics/favicon failures do not establish a media failure.

`pnpm test:e2e e2e/player-continuity.spec.ts -g 'player survives shell navigation'` passed all three projects: chromium-desktop, chromium-mobile and webkit-mobile. This covers navigation, minimize/reopen, history and Stop. Report: `.codex-artifacts/e2e/summary.json`.

## Limits

Acceptance rows selected: Staff/editor, CMS/schema/publication, shell/player and repository gates. Commerce authority, deployment, provider billing and release promotion were not changed and require no new acceptance here. No UAT/PRD publication, deployment, backfill or custom-domain resolution was performed. Third-party metadata and playback availability can change; official pasted embed code remains supported.

## Review and simplification, 12 October 2026

Reviewed the uncommitted implementation and connected shared model, CMS dispatch, editor, validation and autosave callers for occasional authenticated staff use. The review found and fixed one correctness issue: saved-draft discard loaded the restored record without resetting the Bandcamp field's local text. The existing editor reset now runs for both discard operations. A regression in the content-workspace browser suite checks that an empty saved draft changes to the restored live player.

Pasted iframe input now returns a BandcampRecording directly; the field no longer builds a canonical URL just to parse it again. Request lifecycle now follows the stable page value and each request's AbortController. Removed the separate generation counter, retry counter and latest-input ref. Removed the SSR no-mutation test because server rendering never runs the lookup effect; parser, trust-boundary and browser lifecycle coverage remain. Authentication, metadata agreement, redirect/body/deadline limits and synchronous save guards were retained.

`pnpm test staff-content` passed 23 tests. Final-built Local Chromium checks reran `.codex-artifacts/bandcamp/browser-check.js`: live Ethos/Hail, autosave/review/navigation/unload guards, failed replacement, Retry/Revert/Clear, stale responses, discard in flight and editor switching all passed. Temporary Local title/player changes were restored. `.codex-artifacts/bandcamp/review-discard-check.js` separately passed saved-draft restoration using mocked discard/read responses against the real staff bundle, and verified no stored data changed. This regression check does not establish publication acceptance. The full editor Chromium/Firefox suite remains CI-only; prior unchanged backend/publication/player evidence above is retained.

The review's `pnpm validate` initially passed all 63 selected tasks and automatically reran after the final regression/documentation edits. The authoritative final source-matched summary is recorded in `.codex-artifacts/bandcamp/final-validation.json`. Strict OpenSpec validation passed. Graphify refreshed locally (27197 nodes, 43325 edges), retaining the existing unrelated pages-workflow-contract parser warning. No deployment, push or hosted content edit was performed.

## PRD provider challenge diagnosis, 12 October 2026

The user reported Ethos failing in PRD staff. A single authenticated read-only resolver POST reproduced HTTP 422 in 342 ms without editing or publishing content. A bounded PRD log tail recorded status 422, outcome ok, wall time 282 ms and no exceptions or diagnostic messages. The resolver swallowed its underlying error.

The same resolver in an isolated local Worker fetched Ethos successfully and returned album 2345223781. An isolated Cloudflare remote preview using the same compatibility date fetched HTTP 200 text/html, but the body was a 3036-character Client Challenge document with no og:video or data-tralbum metadata. The advertised album metadata remained present from the local machine. An identified BlackBox Records User-Agent produced the same hosted challenge; no header workaround was retained. The initial parser correctly rejected the absent identity. This is an upstream access restriction, not an incorrect album ID or a timeout.

Failure handling now recognizes the parsed challenge title when no recording is present, provides the manual Share/Embed recovery message and emits `bandcamp_resolution_failed` with safe reason `provider_challenge`. Unexpected errors retain generic public details and sanitized error names. Regression tests cover HTTP 200 challenge behavior, no automatic retry, private no-store responses and preventing raw upstream errors from entering responses/logs. The updated parser returned the specific blocked-lookup message against the real challenge in remote preview.

Diagnostic artifacts: `.codex-artifacts/bandcamp/diagnostic-worker.ts`, `diagnostic-wrangler.jsonc`, `diagnostic-local.log`, `diagnostic-remote.log`, and `prd-failure-tail.log`. These are ignored diagnostic fixtures, not application code. Remote preview had no bindings, routes, persistent state or background jobs; a handful of requests were used, and both preview processes and the PRD tail were stopped. No PRD/UAT deployment, hosted content edit, challenge-solving service, proxy dependency or recording-ID exception was introduced.

Automatic URL-only lookup remains unverified/unavailable for challenged hosted requests. Manual official embeds remain supported. This correction improves recovery and observability; it does not remove Bandcamp's request-source restriction. The authoritative final correction gate will be recorded in `.codex-artifacts/bandcamp/challenge-validation.json`; earlier validation evidence does not cover this correction.

Focused `pnpm test cms-runtime` passed 29 files /149 tests. Strict OpenSpec validation passed. The affected `pnpm validate` selection passed all 17 tasks before rerunning for concurrent source/documentation changes; the pointer above records the final matching source and report. No staff UI, storage schema or player construction code changed, so prior editor/parser/playback checks are retained only for those unchanged paths. The correction's hosted check used the isolated preview, not a PRD deployment. Graphify refreshed with the existing unrelated parser warning.
