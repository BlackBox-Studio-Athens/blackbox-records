# Design

## Context

See proposal.md for motivation. The human approved the interactive purchase-ui-draft.html on 20 October 2026, then explicitly requested local implementation and a local commit with review before deployment. Its prices, dates, sample catalog and abbreviated policy text are illustrative, not business data.

## Goals / Non-Goals

**Goals:** Carry over the borderless cart, native payment button with a small white Stripe badge, contextual short copy and cost-first review order.

**Non-Goals:** Rebuild the draft's page shell, artwork composition, fonts, item information layout or sample policy text. Do not change pricing, stock, accepted business commitments, API shapes, schemas, consent or publication behavior. No push or deployment.

## Decisions

- Reuse the public button family and remove the checkout-only border override. This preserves existing tooltip, target, focus and shell behavior without a new control.
- Use the official white badge from Stripe's newsroom badge kit, unchanged, at the existing asset path. The previous repository asset is blurple; the preview's monochrome badge is the accepted variant.
- Reuse authoritative item pre-order facts and the existing order notice. Remove generic under-action prose, while retaining the legacy checkout recovery instruction.
- Keep accepted full delivery wording at checkout. Item information becomes a short shipping note with a single full-policy link; privacy remains with collecting forms and in the footer.
- Separate checkout's delivery copy from its support/legal-guarantee block so support follows the payment handoff. Existing statutory artwork, transcripts and product-safety components remain intact.
- Keep the existing cart action area, page columns, responsive order, typography and artwork. Only reorder the existing cost/delivery/pre-order blocks and shorten their repeated sentences.

## Risks / Trade-offs

- Shared styling and design documents already contain unrelated release work: preserve the starting contents and stage only this change's hunks.
- Compact summaries could conceal material conditions: test full terms/privacy access, conditional estimates and full-payment terms, mixed-cart delay, withdrawal, guarantee and safety access, unknown quotes and optional consent.
- Local acceptance does not prove hosted legal publication or real provider acceptance: preserve those gates and report the limitation explicitly.
