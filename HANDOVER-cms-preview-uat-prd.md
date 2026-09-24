# Handover: CMS preview UAT/PRD rollout

Updated: 2026-09-23

## Current state

- The preview restoration, CTA correction, validation, commit, push, UAT deploy, and PRD promotion are complete. No code or deployment work is currently pending.
- Repository: `C:\Users\SVall\WebstormProjects\blackbox-records`, branch `main`.
- Latest implementation commit: `a82f85e41b160927fe16cc38092027288304fd42` (`chore: simplify WebStorm workflow hook`), pushed to `origin/main`.
- The repository was clean at that commit before this handover file was created. This handover is intentionally local and is not committed or deployed.

## What changed

- Simplified `.codex/hooks.json`, `.codex/hooks/webstorm-workflow.mjs`, and `.codex/hooks/webstorm-workflow.test.mjs`. Removed the global Stop hook that injected repository validation into unrelated conversations. The remaining workflow gate routes tests and validation through WebStorm MCP and cross-file symbol renames through WebStorm refactoring.
- Restored the protected CMS preview origins `preview-uat.blackboxrecordsathens.com` and `preview.blackboxrecordsathens.com` with the environment's staff Access allowlists and preview audiences. Existing build wiring uses the values in `apps/backend/cms-resources.json`; rendering did not need a rewrite.
- Repaired the Caregivers CTA by publishing its already-saved release revision to refresh the accepted PRD snapshot. No editorial fields, prices, or stock were changed.

## CTA root cause

The private preview projected the current catalog, while the public PRD page rendered an older accepted snapshot that lacked the Caregivers Store Item identity. The preview therefore showed `SHOP RELEASE → /store/caregivers-vinyl/`, while the stale public page showed `BUY MERCH → /store/`. Publishing the saved revision refreshed the accepted snapshot; both surfaces now show `SHOP RELEASE → /store/caregivers-vinyl/`.

The release's `Merchandise link` field still contains `/store/`. The rendered release CTA is derived from the Store Item identity. Do not change that field to address this incident.

## Deployments and validation

- Full WebStorm `BlackBox Validate` run passed with exit code 0 against the committed implementation tree. Summary: `.codex-artifacts/validation/2026-09-23T15-12-40-701Z-87796/summary.json`.
- UAT candidate run [#440](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/35882409271) passed, including repository checks, UAT builds/deployments, CMS browser regressions, provider smoke, and release identity verification.
- PRD promotion run [#441](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/35884578816) passed for the same commit. PRD public renderer, CMS Worker, and Pages deploys succeeded. Live catalog mutation jobs were skipped; no catalog mutation was authorized or needed.
- Earlier UAT browser acceptance covered published-page comparison and an edited draft in preview. After PRD promotion, the public Caregivers page was checked in the browser and showed the corrected CTA, artwork, and release content. The prior DevTools fallback found no console messages.

## Live Chrome state

Chrome's `blackbox` profile is connected to the GPT extension. The staff editor tab currently shows `Preview up to date`; its embedded preview renders the Caregivers page, artwork, and `SHOP RELEASE` link to `/store/caregivers-vinyl/`. The public page tab shows the same CTA and target.

- Editor: `https://staff.blackboxrecordsathens.com/content/?collection=releases&id=01M2J1HRAEQ9KDW8PE9VY4399Z&area=all&sort=title`
- Public comparison: `https://blackbox-records-web.pages.dev/releases/caregivers/`
- The tab IDs observed in the source task were editor `1915894723` and public page `1915894760`; look up the URLs again if those IDs have expired.

## Archive incident and current instruction

- Source task: `Resume CMS preview rollout`, ID `01a0ce73-68b3-7883-b76a-a096485220a4`. It is currently active; the latest Codex task listing shows `status: active`.
- Likely cause of the archive event: the assistant called `set_thread_archived` three times, relying on the earlier “archive when done” request. Each attempt was interrupted; a call may have applied before its interruption. This was assistant-initiated, not an automatic hook.
- No separate archive trigger was found. The repo's WebStorm hook files contain no archive action. The only active local automation is an unrelated one-time read-only CMS cache-expiry check.
- The user has now explicitly objected to archiving. Do not archive or close this source task unless the user explicitly authorizes it again.

## Fresh-thread instructions

Read this file first, then verify `git status --short --branch` and `git log -1 --oneline`. Do not archive this task. Do not repeat the UAT deployment or PRD promotion unless a new source change requires it. Any requested tests/refactors must follow the remaining WebStorm MCP hook gate. Keep this handover uncommitted unless the user explicitly wants it checked in.
