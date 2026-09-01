## 1. Implemented Redesign

- [x] 1.1 Implement task-first collections/forms, named fixed-page objects, hidden generated Artist slugs, collection-owned media, scoped controls, current branding, and bounded boot/runtime exceptions; verified by focused tests.
- [x] 1.2 Preserve direct-to-main editorial authority and separate all price, stock, checkout, order, fulfillment, and operator-auth concerns; verified by contract tests.
- [x] 1.3 Complete Local functional/read-only smoke and Browser Use desktop, 390-pixel, and 320-pixel visual acceptance without publishing.

## 2. Current Baseline and Smoke Ownership

- [x] 2.1 Align every live Decap literal and assertion to decap-cms 3.16.0 and decap-server 3.11.0; verify package, lockfile, runtime URL, tests, and docs agree.
- [x] 2.2 Fix UAT cms_assets so admin HTML owns data-admin-boot-root, admin CSS owns the hidden boot rule, and init.js owns runtime transitions; verify a regression test rejects future cross-file assertions.
- [x] 2.3 Keep Local CMS Smoke functional/read-only and Browser Use visual/responsive; verify the two checklists have no duplicate mobile layout assertions.

## 3. UAT Acceptance

- [x] 3.1 Run focused CMS tests, Local CMS Smoke, pnpm test:unit, pnpm check, and pnpm build against the exact final tree.
- [ ] 3.2 Deploy the exact accepted commit, record its SHA, and pass cms_admin and cms_assets on UAT.
- [ ] 3.3 Strict validation already passes locally. Complete the owner's shared-Google no-publish walkthrough for Artist, Store Item, image, and Release work, rerun `pnpm openspec -- validate redesign-decap-editor-experience --strict`, and archive the accepted change before its commit can become launch-catalog evidence.
