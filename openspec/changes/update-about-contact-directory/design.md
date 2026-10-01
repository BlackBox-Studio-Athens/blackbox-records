## Context

`blackboxrecords.com` resolves to Afternic parking with a null MX, so the published About addresses bounce. `blackboxrecordsathens.com` is the verified Resend sender domain and its Cloudflare Email Routing forwards label aliases to the existing Gmail inbox. The user chose `touring@blackboxrecordsathens.com` labelled Tour Booking, moving info and demos to the same domain, and a copy button per row.

## Goals / Non-Goals

Make every About address deliverable and copyable without weakening the native `mailto:` row. Do not change Services inquiry routing, Resend configuration, Cloudflare rules or hosted content in this change.

## Decisions

- Delivery proof uses the Resend CLI: one probe from the verified sender to each alias, then `resend emails get` must report `delivered`. Gmail receipt is confirmed by the operator because Resend cannot observe the Cloudflare forward. No probe goes to the null-MX domain.
- The copy control is a static `ui-foundation` Astro primitive (`copy-button.astro`) styled with the public `buttonVariants` family (outline, 36px icon, 44px coarse halo). Its accessible name is `Copy <address>`, unique per row.
- Behaviour is one delegated document listener, `connectCopyButtons`, registered once by the persistent shell. A React island was tried first and rejected: the shell caches the live main on departure, Astro's React client hydrates only islands that still carry `ssr`, so a cached return left the island dead (observed in e2e).
- Feedback follows the icon-swap pattern (Animate UI Copy Button, studied only) and the value-plus-attached-copy layout (AI Elements Snippet, studied only): `data-copied` swaps the copy icon for a check mark for 2 seconds and the sibling status region announces `Copied`. No animation, so reduced motion needs no special case.
- The snapshot sanitizer clears `data-copied` and the status text, so a page cached inside the feedback window returns idle.
- Clipboard failure announces `Select the address to copy`, matching the Staff order-reference fallback.
- The row hover moves to the list item via `:has()` so the link and copy cell highlight together; focus stays on each control.

## Risks / Trade-offs

A Cloudflare catch-all would also report `delivered`, so the probe proves acceptance, not a dedicated alias. Hosted About content remains on the old addresses until PRD staff publishes the edit.

## Open Questions

None.
