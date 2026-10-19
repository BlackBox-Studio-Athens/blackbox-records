## Context

Checkout renders two independent existing islands. Quantity edits publish the existing cart update event and trigger the payment panel's authoritative delivery quote. Their internals do not need to change.

## Decision

Render the summary first in the Astro document, so keyboard and assistive-technology reading order reaches item editing before payment. Name the existing grid areas to retain desktop payment-left and summary-right at the current 3:2 widths, and use summary/payment rows below 48rem. Keep one instance of each island. Native tab order remains summary then payment at every width; desktop visual columns retain their existing placement.

## Scope and checks

Check 320px, 390px and 1440px with multiple items and long titles. Exercise quantity editing, quote refresh and tab order without submitting payment. Use existing browser fixtures and house styles. No new dependencies, checkout steps or component changes. All-to-Distro filtering and Home film remain outside scope.
