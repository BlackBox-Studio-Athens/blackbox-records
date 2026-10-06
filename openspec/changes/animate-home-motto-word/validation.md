# Validation

Base commit: `e21dfef2` (local `main`; change uncommitted in the app worktree `restore-artist-photos-aeca04`, branch `claude/animated-motto-cycling-ba1b3b`, rebased onto `main` before final verification and merged to `main` for the UAT release).
Product Environments: PRD (`https://blackbox-records-web.pages.dev/`, one read-only GET) to read the hosted motto markup; Local Astro dev for the after state.

## Repository gates

- `pnpm validate` (with `NX_PLUGIN_NO_TIMEOUTS=true`): PASSED on the rebased tree, `mode: local`, `scope: all`; see the final pointer in `.codex-artifacts/motto/validate-final2.log`. This note was written after the run.
- Eager bundle budgets (`scripts/check-runtime-bundle-graphs.ts` on a local `astro build`): home 105,136 of 105,472 bytes, storeItem and storeGalleryItem 102,358 of 102,400, other routes unchanged. Release run `37473779377` failed this gate in `prepare-uat`/`prepare-prd` when the element was registered from `SiteLayout` (storeItem 104,568 bytes), so nothing deployed; the Home island fixed it.
- `motto-word-cycle.test.ts`: 4 tests passed (word detection and casing, unrelated motto left alone, deterministic bounded peaks with beat transients, tear bursts ordered and hidden by 64 % of the scrub).
- `pnpm openspec -- --allow-worktree validate animate-home-motto-word --type change --strict`: valid.

## Browser acceptance

- Hosted markup: the PRD motto renders as `<p>NO BORDERS.<br>NO GENRES.<br>JUST RECORDS.</p>`; the element detects the last text node's word.
- `pnpm test:e2e e2e/home-motto.spec.ts` on this checkout's port 4361: chromium-desktop 3 passed on the rebased tree after the first check was made tolerant of a slow load reaching the first scrub. It covers Records first, arriving on Who we are and reaching Home through the shell, the scrub to Art, the written word for assistive technology, a shell round trip through Who we are without a full load, and reduced motion. An earlier firefox-desktop run of the same spec passed.
- Playwright probes froze the scrub at seven times at 1280x800 and 390x844 (2x density): playhead, tears and shards stay inside the span between the old and new word lengths and never cross "Just"; no layout shift on the motto line. The owner approved recording `.codex-artifacts/motto/motto-scrub-v11.mp4` (2.5 s first hold, 2.8 s holds, 1.4 s scrub) and chose to keep the hero's existing fade-rise rather than animating the three lines on load.

## Not verified

- The chromium-mobile run of the shell round trip: the test clicks the header link, which is hidden at 390 px. The committed matrix does not run this spec on mobile; reduced motion passed there.
- Safari, real devices and the hosted UAT/PRD after state: requires release and promotion.
- Graphify: this worktree had no `graphify-out` graph during implementation; CodeGraph and scoped search were used.
