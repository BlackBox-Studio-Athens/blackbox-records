## Why

The Decap redesign is implemented and locally accepted, but its plan still describes an older dependency baseline and repeats completed implementation detail. The remaining work is one stale UAT smoke contract plus deployment and owner acceptance.

## What Changes

- Record the supported baseline as decap-cms 3.16.0 and decap-server 3.11.0 everywhere.
- Preserve the implemented task-first Store Item, Release, Artist, image, fixed-page, branding, boot, and mobile design.
- Keep Decap editorial authentication separate from Cloudflare Access operator authentication, even when both use the same approved Google identities.
- Make Local CMS Smoke own functional and read-only editor behavior.
- Make Browser Use own visual, responsive, focus, target-size, overflow, and console acceptance.
- Correct UAT cms_assets assertions so admin HTML/CSS owns boot markup/style contracts and init.js owns runtime behavior.
- Deploy the exact accepted commit and complete the shared-Google no-publish owner walkthrough.
- Do not introduce another CMS, authentication bridge, design system, or compatibility layer.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- decap-editorial-operations: Preserve the implemented editor contract on the current Decap baseline with an explicit editorial-auth boundary.
- tooling-validation: Give deterministic tests, Local smoke, Browser Use, and UAT smoke non-overlapping ownership.

## Impact

- Decap package/runtime version assertions, admin smoke ownership, UAT workflow evidence, and current CMS documentation.
- No shopper commerce, D1, Stripe, stock, order, fulfillment, or operator-auth authority moves into Decap.
- Sequence: complete and archive this change before `production-go-live-readiness` selects a launch catalog commit; CMS acceptance does not itself authorize launch.
