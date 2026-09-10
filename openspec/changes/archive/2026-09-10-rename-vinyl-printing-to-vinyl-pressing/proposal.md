## Why

`Vinyl Printing` is the wrong domain term for the Services offering and currently appears in page content, inquiry values, generated contracts, email copy, and tests. The visible and public service name must be `Vinyl Pressing`.

## What Changes

- Rename the visible Services card, inquiry option, and related copy from `Vinyl Printing` to `Vinyl Pressing`.
- **CONTRACT CHANGE**: Replace the generated/public Services inquiry enum value `Vinyl Printing` with `Vinyl Pressing`; the Worker still accepts the exact legacy value from stale clients and immediately normalizes it to the canonical value.
- Update frontend and Worker service enums, recipient maps, provider tag, email subjects/body text, tests, current requirement language, and operational documentation to use the visible/public term.
- Keep only the stable content section id `vinyl-printing` for fragment compatibility; rename the Worker provider-safe tag to `vinyl-pressing`.
- Correct the Sveltia id hint so it describes the stable section anchor instead of claiming the id drives preselection.
- Regenerate the public OpenAPI document and generated API client from source.
- Keep the existing `vinyl@blackboxrecordsathens.com` recipient, validation limits, form behavior, provider delivery, and service scope unchanged.
- Add only one exact request-boundary normalization from `Vinyl Printing` to `Vinyl Pressing`; add no registry, configuration flag, migration table, general alias system, or duplicate domain value downstream.
- Leave the completed `add-services-inquiry-email-delivery` artifacts implementation-accurate and archive that change before this rename is applied instead of rewriting its completed contract in advance.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-language`: Establish `Vinyl Pressing` as the canonical visible/public service term and provider tag while preserving only the stable section anchor and historical records.
- `services-inquiry`: Rename the form and routing contract to `Vinyl Pressing` while accepting and immediately normalizing only the exact prior request value.

## Impact

- Services content, Sveltia Services fields, inquiry form helpers, and tests
- Worker Services inquiry validation, recipient/tag maps, email rendering, and tests
- Generated public OpenAPI and `@blackbox/api-client` schema artifacts
- Current project-language requirements, operational documentation, and source-contract checks; completed/archived OpenSpec history remains unchanged
- No recipient, provider, environment, route, validation-limit, or dependency change
