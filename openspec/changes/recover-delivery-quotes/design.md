## Context

useDeliveryQuote already debounces cart changes by 250 ms, aborts abandoned requests and hides results for a different cart key. PublicCheckoutApiError preserves HTTP status. The Worker returns HTTP 200 with a null quote for ineligible carts and HTTP 503 for service failures.

## Goals / Non-Goals

Recover temporary failures in place, preserve shopper choices and authoritative payment gating. Keep existing controls, typography and layout. No automatic retries, new dependencies, payment submission or broad hydration work.

## Decisions

Track a retry generation alongside the existing cart key. A result belongs to both identities; pending or mismatched results expose no usable quote. Preserve abort and active-effect guards. A synchronous ref prevents repeated activation before React renders the loading state. Retry only temporary errors (transport, timeout, rate limit, server); completed null quotes and other client errors retain cart-review guidance.

Render the existing outline Button in DeliverySummary for recovery, retain it disabled with Checking delivery… while retrying, and announce progress through the existing polite live region. CheckoutOfferStatus labels a temporary failure Delivery check failed instead of Delivery unavailable. Both drawer and checkout use the same recovery behavior.

## Risks / Trade-offs

The browser quote is advisory: Worker validation still authorizes checkout. Cart changes must invalidate a quote immediately, including when retrying. No automatic retry means a recovered connection waits for the shopper's explicit action. Source identity and test evidence are recorded in validation.md.
