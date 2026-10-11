# Context

This is a refinement of the approved BlackBox public design. Retain Veneer titles, quiet Inter metadata, complete artwork, square shared controls, natural document scrolling and shell-owned playback. The primary checkout is main; existing worktree runtimes and the separate Stripe migration task remain untouched.

# Decisions

## Home controls

Remove the unwanted Play background text affordance and its obsolete state handling. Muted ambient playback remains visibility-aware and respects reduced motion and data saving. Retain an accessible way to stop moving content when necessary, without restoring the removed text control. Watch full video and Listen retain their existing behavior.

## Mobile Releases

Adapt the existing composition rather than introduce another layout system. Use consistent mobile gutters, coherent identity/metadata/action alignment, wrapping long labels and touch targets. Preserve the artwork and desktop composition. Inspect 320, 360, 390, 430 and 768px layouts, with a desktop regression check and working purchase/listening controls.

## Country hints

Reproduce existing country, storage and notice behavior before changing it. Cloudflare network country cannot establish a delivery address, especially through a travel eSIM, VPN or changing connection. An incorrect hint must be correctable across all shared notice placements; failed/unknown lookups remain quiet. Any remembered correction is presentation-only and must never authorize an unsupported shipping country. Do not infer residence from language, timezone or SIM operator, request precise location, disable caches globally or remove legitimate international ordering assistance.

# Validation

Use focused unit and browser checks against a main source preview, with screenshots for mobile visual judgment. Parent coordinates the shared browser/runtime and final source-bound `pnpm validate`. Keep hosted verification and the smartphone's actual network country explicitly unverified unless observed. No release is claimed by local completion.
