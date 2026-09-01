## Context

The redesigned editor is already implemented: task-first navigation/forms, named fixed-page objects, generated Artist slugs, collection-owned media, scoped styling, app-owned boot lifecycle, and responsive acceptance have passed local checks. The July 25, 2026 UAT run 30166382110 passed cms_admin but cms_assets still looked for boot HTML/CSS contracts inside init.js.

## Goals / Non-Goals

**Goals:**

- Close the change against the exact current Decap baseline.
- Fix the smoke test at the ownership boundary instead of moving markup into runtime JavaScript.
- Keep one clear verifier for each behavior class.

**Non-Goals:**

- Reworking the accepted editor, replacing Decap, or coupling it to operator authentication.
- Repeating mobile visual assertions in every smoke layer.
- Adding a CMS-side publishing or commerce workflow.

## Decisions

### Preserve the implemented editor

The existing redesign remains authoritative:

- Store Items and Releases are task-first.
- fixed Home/About/Services structures are named objects, not editor-reorderable arrays;
- Artist slug generation uses the shared slug helper and does not expose a routine slug field;
- media remains collection-owned;
- custom runtime behavior is bounded to named semantic exceptions;
- the boot root is separate from the Decap mount;
- direct-to-main publishing and editorial-only authority remain unchanged.

No dual content shape or old-admin compatibility path is retained.

### Use the current dependency pair

Pin and assert decap-cms 3.16.0 and decap-server 3.11.0 across package metadata, lockfile, CDN/runtime URL, tests, and docs. There is one supported baseline.

### Keep editorial and operator authentication separate

Hosted Decap uses DecapBridge PKCE and its Google guidance. Protected stock/order routes use their own Cloudflare Access assertion under verify-operator-access-jwt. The same Google account may be allowlisted in both systems, but tokens, cookies, callbacks, and helpers are not shared.

### Split verification by ownership

- deterministic tests: generated YAML, schema/collection parity, slug/media/runtime contracts;
- Local CMS Smoke: boot, navigation, representative form/image behavior, read-only hashes/status, and functional console errors;
- Browser Use: desktop/mobile rendering, focus, contrast, 44-pixel targets, overflow, clipping, and visual console review;
- UAT cms_admin: hosted config, DecapBridge transition, runtime initialization, and secret-safe output;
- UAT cms_assets: representative static/media assets plus boot markup in admin HTML and hidden-state rule in admin CSS.

init.js is not required to contain data-admin-boot-root or the hidden CSS selector. Its tests cover runtime state changes against those app-owned DOM/CSS contracts.

## Risks / Trade-offs

- [UAT still serves an older commit] → Record deployed SHA and compare it to the accepted commit before interpreting smoke results.
- [Smoke drifts across file ownership again] → Keep one focused regression fixture mapping each assertion to HTML, CSS, or JavaScript.
- [Shared Google wording suggests shared authentication] → State explicitly that identity membership may match while authentication boundaries do not.

## Migration Plan

1. Update exact version literals and the cms_assets ownership assertions.
2. Run focused CMS tests, Local CMS Smoke, Browser Use checks, and repository gates.
3. Deploy the exact accepted commit to UAT.
4. Rerun cms_admin and cms_assets, then complete the owner no-publish walkthrough.

Rollback redeploys the prior accepted static artifact. Content schema rollback uses Git history; no compatibility reader is added.
