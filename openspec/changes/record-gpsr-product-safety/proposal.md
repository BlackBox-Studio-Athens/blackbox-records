## Why

The 14 October 2026 audit identified missing GPSR online-offer information. Release and Distro content currently cannot record the verified economic operator, product identifier and safety assessment separately from general descriptions. A pressing-plant name is insufficient evidence of the legal manufacturer.

## What Changes

- Add optional private `product_safety` JSON to Release and Distro through the existing CMS/content-model path, without rewriting records.
- Require complete contacts, product identifiers, an explicit safety assessment and evidence when a record claims verification. Retain incomplete private work and report readiness issues.
- Supply the existing accepted-snapshot renderer path with only verified public offer information, stripping evidence and review metadata.
- Hand all staff/public UI to Claude Desktop. Record the missing supplier facts, preview approval and enforcement decision as open acceptance work. Do not alter existing publication eligibility when the field is absent, or change commerce/checkout/launch gates.

## Capabilities

### New Capabilities

- `product-safety-information`: Verified GPSR data, readiness, and public projection with staged adoption.

### Modified Capabilities

None. Existing content publication and commerce authority remain unchanged.

## Impact

Portable content contracts and projection in `@blackbox/content-model`, CMS schema preparation and tests, focused source-bound validation, and this OpenSpec change. No new dependencies, D1 commerce fields, supplier contacts, hosted schema/content writes, publication, push or deployment. The change does not establish legal compliance or authorize missing-data offers.
