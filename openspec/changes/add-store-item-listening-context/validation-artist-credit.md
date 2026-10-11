# Single artist credit — 11 October 2026

The reported PRD LOTUS page rendered Sidus beneath the title and again beside Release. The shared Store Item template now links the existing subtitle credit to the resolved artist profile and removes the second artist action. Credits without a verified profile remain plain text. Listen, Release and commerce controls retain their existing behavior.

Local checks:

- `pnpm test apps/web/src/pages/_store-item-detail-gallery.test.ts`: web-pages tests passed, including the single-link and plain-credit fallback regression.
- `pnpm openspec -- validate add-store-item-listening-context --type change --strict`: passed.
- `pnpm validate`: passed, 59 tasks, 52 cached. Summary: `.codex-artifacts/validation/2026-10-11T15-57-02-917Z-61960-e93d11/summary.json`, mode `local`, base SHA `ad831e838899dba2c628d2ccf3df1604b64915b3`, matching before/after fingerprint `c5034f9cfa1179a484b29cc098ce141a666a7714410e115a3b7624623d04049b`, no source changes during validation.
- Local Playwright CLI checked Disintegration / Afterwise and Caregivers / Chronoboros at 1280, 390 and 320px. All six cases showed one artist credit/link, the correct base-aware artist route, keyboard focus and no horizontal overflow. Reproduction: `.codex-artifacts/store-artist-credit/browser-check.js`.
- A Distro detail check for form follows function retained Adolf plays the Jazz as plain text with zero artist links.
- `git diff --check`: passed. Graphify refreshed after the code edit batch; it reported an unrelated parser warning in `scripts/pages-workflow-contract.test.ts`.

Acceptance applies to item identity and navigation markup. The shell/player implementation, CMS, commerce authority and release operations are unchanged; their full lifecycle/provider suites were not rerun. The isolated frontend has no commerce API, so existing listing/offer and `cdn-cgi/trace` requests return 404; this check does not establish purchase acceptance. The PRD LOTUS slug is absent from retained local content, so rendered verification used two other releases through the same shared template. No PRD deployment or CMS publication was performed. The native browser connection timed out; public reproduction and local checks used the authorized Playwright CLI fallback.
