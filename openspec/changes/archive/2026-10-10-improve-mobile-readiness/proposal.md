# Improve mobile readiness of the public site

## Why

A 16-agent mobile-first review on 2026-10-09 (static finders plus live phone-emulation probes of PRD, evidence under `.codex-artifacts/reviews/2026-10-09-mobile-readiness/`) produced 26 P1 and 81 P2 candidate findings. The P1 candidates collapse into a few root causes that make the site feel like a desktop page on phones: every text field is under 16px so iOS Safari zooms on focus; Back does not close the cart drawer or phone menu and closing a detail overlay throws the list back to the top; the minimized player hides the last 125px of every page; the player modal and detail overlay leave the page behind reachable; checkout can stay stuck after Back from Stripe and a failed offer read silently removes Add to Cart; unknown hosted URLs return a plain-text 404; the mobile e2e project is almost vacuous.

## What changes

Fixes grouped by code area, each verified against source before editing and covered by the smallest failing test:

- Forms: 16px phone text in the input primitives and bespoke fields, keyboard hints on search fields, Services form validation and Notify me error announcement.
- Shell history: cart drawer and phone menu own a history entry like the player; overlay close and Back/Forward restore scroll position and focus.
- Player: reserved page space under the minimized player, stacking against sheets, phone-landscape modal geometry, embed height.
- Accessibility: page inert behind the player modal and detail overlay, skip link above the header, scroll padding under the fixed header, named overlay dialog, cart quantity announcements.
- Checkout resilience: Pay recovers after bfcache Back, offer-read failures show a retry, return page keeps polling through transient errors, no raw browser error text.
- Touch: coverflow tap suppression bounded to the swipe, hover rules gated by `(hover: hover)`, 44px halos on secondary targets.
- Head and hosting: HTML 404 from the gateway, theme-color, apple-touch-icon and manifest within the Free-tier rule.
- Performance: Store card payload (Buy icon data URIs, srcset widths), pre-order showcase images, listing-price prefetch timing.
- Typography and Store layout on phones: micro text minimums, editorial prose wiring, Store first viewport, cart drawer landscape layout.
- e2e: non-vacuous overflow helper, phone project coverage, WebKit project, route sweep.

## Scope

Public web (`apps/web`), the Pages gateway script and the e2e suite. Backend, CMS and staff are unchanged. Findings that need a real iPhone to confirm (embed interaction detection on WebKit) are recorded, not changed.

## Acceptance

Each group's focused tests pass; `pnpm validate` and `pnpm build:web` pass on the final tree; the chromium-mobile and firefox-compact projects pass for the touched specs; strict OpenSpec validation passes. Findings that were refuted during verification are listed with the reason in validation.md.
