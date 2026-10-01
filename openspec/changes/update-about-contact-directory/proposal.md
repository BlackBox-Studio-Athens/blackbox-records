## Why

The About contact directory points at `@blackboxrecords.com`, a parked domain with a null MX (RFC 7505) and `v=spf1 -all`; none of its addresses can receive mail. The label also wants a touring contact instead of Press, and visitors need an easy way to copy an address rather than only opening a mail client.

## What Changes

- Move General and Demo Submissions to `info@` and `demos@blackboxrecordsathens.com`; replace Press with Tour Booking at `touring@blackboxrecordsathens.com`.
- Add one copy control per contact row beside the existing `mailto:` link, with in-place copied feedback.
- Document the About aliases that Cloudflare Email Routing must forward.

## Capabilities

### Modified Capabilities

- `about-contact-presentation`: Working addresses, Tour Booking row, and a per-row copy control.

## Impact

About page markup and styles, a new `ui-foundation` copy primitive, a shell-registered copy listener and snapshot reset, repository About content and environment documentation. Hosted About content is CMS-owned and changes only through a separate PRD Content Publication. No provider, routing or deployment change.
