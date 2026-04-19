# Phase 4: BOX NOW Locker Shipping Slice - Research

**Researched:** 2026-04-19
**Domain:** Greece-only BOX NOW locker selection, widget-first pickup UX, minimal locker data storage, manual partner-portal fulfillment
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- MVP native commerce shipping is Greece only.
- BOX NOW should be used only for shoppers buying from Greece.
- Do not plan a second non-Greek shipping path in this phase; non-Greece shipping is explicitly deferred.
- Country gating must happen before payment proceeds.
- Locker selection happens before payment, in the site-owned flow.
- The shopper must have a valid Greek BOX NOW locker selected before entering the authoritative payment path.
- The flow fails closed for BOX NOW shipments: if locker selection or locker lookup cannot complete, payment must not proceed.
- v1 should store the least amount of locker data needed for correct manual operations.
- The locked minimal storage posture is: `locker_id`, `country_code`, and one human-readable `locker_name_or_label` snapshot.
- Do not plan a fuller address snapshot unless research finds a concrete operational reason the thinnest set is unsafe.
- v1 fulfillment remains manual partner-portal fulfillment only.
- Do not plan thin server-assisted label creation or fuller BOX NOW automation in this phase.

### the agent's Discretion
- Exact route/state where Greek-country gating happens
- Exact stored locker label field name
- Whether the integration uses the official widget/iframe route or a fuller custom map
- Exact failure-copy and blocked-state placement

### Deferred Ideas (OUT OF SCOPE)
- Non-Greece shipping paths
- Thin server-assisted BOX NOW API fulfillment
- Fuller locker address snapshots
- Multi-carrier abstraction

</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Greece-only shipping eligibility gating | Frontend Server | Browser/Client | The storefront owns the checkout route and must block non-Greek payment progression before Stripe becomes active. |
| Locker selection UI | Browser/Client | Frontend Server | The shopper interacts with a BOX NOW picker/widget inside the site-owned checkout route. |
| Minimal locker data capture | Frontend Server | Database/Storage | The site needs to persist only the selected locker identifier, country, and human-readable label. |
| Paid-order shipping context | Database/Storage | Frontend Server | Locker data becomes part of the order context consumed later during manual fulfillment. |
| Parcel creation / voucher management | Operator | API/Backend | The partner portal already supports manual order and voucher management, so no MVP automation layer is required. |

</architectural_responsibility_map>

<research_summary>
## Summary

BOX NOW’s current official materials support both a partner API integration path and a lighter widget-based selection path. The public API docs describe the locker “Destination Map” as a widget or custom map integration, and explicitly position the widget as an out-of-the-box solution that can be embedded in the checkout page. For a low-maintenance MVP, that is the correct default: use the official picker/widget inside the site-owned shipping step rather than building a custom locker map around the lower-level destination endpoints.

The official partner portal documentation also supports the user’s chosen fulfillment posture. The partner portal exists specifically to create, manage, search, and cancel vouchers/orders, which makes it a valid MVP operator surface without requiring immediate API automation. That means Phase 4 should treat the locker-selection flow and the fulfillment workflow as deliberately separate concerns: collect the minimal locker choice before payment, store only the minimum manual-ops data, and let the operator finish shipment creation in BOX NOW’s own tooling after payment is confirmed.

The one real design risk is over-optimizing for future automation too early. BOX NOW’s API and custom map options expose richer location details like `name`, address lines, postal code, and notes, but the user explicitly chose the thinnest stored dataset. Since the site is Greece-only in MVP and the operator will use the partner portal, Phase 4 should not expand storage unless implementation research finds that the widget or selected-order view cannot reliably reconstruct operations from `locker_id` + label snapshot.

**Primary recommendation:** Plan Phase 4 around the official BOX NOW widget/picker inside a Greece-only pre-payment shipping step, store only `locker_id`, `country_code`, and a `locker_name_or_label` snapshot, and keep fulfillment manual through the BOX NOW partner portal.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Official BOX NOW widget / picker | current hosted widget | Locker selection UI | Lowest-maintenance path supported by current BOX NOW docs. |
| `astro` + Cloudflare runtime | existing repo stack | Site-owned shipping step and data handoff | Already chosen runtime and routing model. |
| `D1` | managed platform service | Persist minimal locker data on the order context | Already chosen operational state store. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| BOX NOW Partner Portal | hosted BOX NOW tool | Manual parcel/voucher management | Use for MVP operator workflow after payment confirmation. |
| BOX NOW Partner API | current official version | Future automation reference | Defer for v2 unless manual portal usage proves insufficient. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Official widget integration | Custom map integration | More control, but more implementation and maintenance cost. |
| Manual partner-portal fulfillment | Thin API-assisted voucher creation | Less manual work later, but unjustified for current order volume. |
| Minimal locker storage | Full address snapshot | More resilient for support, but contradicts the user’s explicit storage minimization choice. |

**Installation:**
```bash
# No new package is required at planning time.
# Later implementation may load the official BOX NOW widget script in the checkout route.
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### System Architecture Diagram

```text
Product Detail
  -> Buy Now
    -> Checkout Route / Shipping Step
      -> Greece eligibility confirmed
      -> BOX NOW widget/picker shown
      -> locker selected
      -> store { locker_id, country_code, locker_name_or_label }
      -> activate payment step

Paid order confirmed later by Stripe webhook
  -> operator uses BOX NOW Partner Portal
    -> search / create / manage voucher manually
```

### Recommended Project Structure
```text
.planning/phases/04-box-now-locker-shipping-slice/
├── 04-SHIPPING-CONTRACT.md
├── 04-FULFILLMENT-MODEL.md
└── 04-UI-SPEC.md
```

### Pattern 1: Widget-first locker selection
**What:** Embed the official BOX NOW widget/picker inside the site-owned shipping step and wrap it with BlackBox-native layout and copy.
**When to use:** MVP storefronts that need fast, correct locker selection without building a custom map experience.
**Example:**
```text
Checkout route
  -> shipping panel
    -> widget container
    -> selected locker summary
    -> continue to payment
```

### Pattern 2: Greece-only fail-closed gating
**What:** Enforce `country = GR` before payment is activated and stop the flow if locker selection is unavailable.
**When to use:** Single-country shipping launches where no alternate carrier/path exists in MVP.
**Example:**
```text
if country != GR
  -> blocked shipping state
if locker not selected
  -> payment unavailable
```

### Pattern 3: Thin locker persistence
**What:** Persist only the minimum locker fields needed to support manual portal fulfillment.
**When to use:** Low-volume operations where the shipping provider’s own tools remain the primary operator interface.
**Example:**
```text
locker_id
country_code
locker_name_or_label
```

### Anti-Patterns to Avoid
- **Building a second shipping method:** The user explicitly chose Greece-only shipping and no alternate path.
- **Letting payment activate before locker selection:** This breaks the fail-closed rule and complicates fulfillment context.
- **Expanding storage “just in case”:** That directly conflicts with the user’s explicit minimization goal.
- **Treating BOX NOW branding as the route’s dominant visual system:** The storefront still owns the UX.
- **Designing API automation into the MVP plan:** The partner portal already covers the required operator workflow.

</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Locker map UI | Custom interactive map from scratch | Official BOX NOW widget/picker | Lower maintenance and directly supported by current docs. |
| Shipping admin | Internal fulfillment dashboard | BOX NOW Partner Portal | Enough for MVP manual operations. |
| Multi-country shipping rules | Secondary shipping-path abstraction | Greece-only gating | Matches the locked scope and avoids hidden expansion. |
| Rich locker profile model | Full locker address record | Minimal locker snapshot | Aligns to the user’s storage-minimization requirement. |

**Key insight:** The correct MVP tradeoff is to keep the shopper flow polished while pushing operational complexity into the partner’s existing tooling, not into new app code or new data models.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Letting the payment step outrun shipping selection
**What goes wrong:** Orders reach payment without a valid locker attached.
**Why it happens:** Teams treat shipping as optional or post-payment metadata.
**How to avoid:** Keep Stripe payment inactive until a valid locker has been selected and stored.
**Warning signs:** Specs say “collect locker later” or allow payment-side fallback.

### Pitfall 2: Building for multi-country shipping too early
**What goes wrong:** The MVP grows a second shipping branch with its own copy, validation, and ops rules.
**Why it happens:** Teams optimize for future expansion instead of the current launch scope.
**How to avoid:** Explicitly keep shipping Greece-only and defer non-Greek flows.
**Warning signs:** Plans mention alternate carriers, manual DM contact, or placeholder international shipping states.

### Pitfall 3: Storing more locker data than the operator actually needs
**What goes wrong:** The order model gets a broader locker snapshot than the user approved.
**Why it happens:** API docs expose many location fields, so teams store them by default.
**How to avoid:** Keep the storage contract to `locker_id`, `country_code`, and `locker_name_or_label` unless a concrete blocker appears.
**Warning signs:** Plans add address lines or postal codes “for convenience” without an approved operational reason.

### Pitfall 4: Over-automating fulfillment
**What goes wrong:** MVP time gets spent on voucher creation or parcel APIs instead of the locker-selection contract itself.
**Why it happens:** The partner API exists, so teams feel pressure to use it immediately.
**How to avoid:** Use the partner portal for v1 and park automation in backlog.
**Warning signs:** Plans describe API parcel creation, label fetching, or webhook chaining in MVP.

</common_pitfalls>

<code_examples>
## Code Examples

Verified patterns from official sources:

### Official widget integration direction
```html
<div id="boxnowmap"></div>
<script>
  (function(d){
    var e = d.createElement("script");
    e.src = "https://widget-cdn.boxnow.bg/map-widget/client/v5.js";
    e.async = true;
    e.defer = true;
    d.getElementsByTagName("head")[0].appendChild(e);
  })(document);
</script>
```

### Minimal locker fields derived from the selection
```text
locker_id
country_code = GR
locker_name_or_label
```

### Manual fulfillment posture
```text
paid order
  -> operator opens BOX NOW Partner Portal
  -> searches / manages voucher manually
  -> no MVP API automation required
```

</code_examples>

## Validation Architecture

- Phase 4 plans should generate planning artifacts only, not code implementation.
- Validate the plan artifacts with grep checks for Greece-only gating, fail-closed shipping behavior, minimal locker data, and manual partner-portal fulfillment.
- Use `pnpm check` as the quick smoke command and `pnpm test:unit && pnpm check && pnpm build` as the full suite after execution waves.
- Treat any introduced non-Greece path, any payment-before-locker path, or any premature fulfillment automation as a validation failure.

<sota_updates>
## State of the Art (2025-2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom shipping map expected for serious integrations | BOX NOW docs still present an official widget as an out-of-the-box solution | checked 2026-04-19 | Widget-first planning is justified for MVP. |
| API automation as the default partner path | BOX NOW also maintains a Partner Portal with order/voucher management | checked 2026-04-19 | Manual portal fulfillment is a valid low-volume MVP posture. |
| Storefront shipping assumed to be multi-country by default | This project intentionally locks Greece-only shipping for MVP | project decision locked 2026-04-19 | Phase 4 plans should optimize for one-country correctness, not expansion. |

**New tools/patterns to consider:**
- Official BOX NOW widget/picker shell
- Greece-only blocked state before payment
- Minimal locker summary carried into the payment step

**Deprecated/outdated:**
- Planning a second shipping path inside the MVP
- Assuming BOX NOW automation is mandatory for first launch
</sota_updates>

<open_questions>
## Open Questions

1. **Does the selected-locker payload from the official widget reliably expose the exact human-readable field name needed for `locker_name_or_label`?**
   - What we know: The API docs expose `id`, `name`, address lines, postal code, and note for custom map integrations.
   - What's unclear: Whether the widget callback exposes those fields under the same names or through a thinner selection object.
   - Recommendation: Keep the Phase 4 plan field-name-agnostic and lock only the conceptual `locker_name_or_label` snapshot.

2. **Should country gating occur on the product detail page or only when the checkout route opens?**
   - What we know: The user approved gating before payment, but not the exact checkpoint.
   - What's unclear: Which point gives the cleanest UX while respecting the app-shell flow.
   - Recommendation: Let the plan decide the exact checkpoint, but require that payment never activates before Greek eligibility is known.

3. **How much of the selected locker should remain visible during payment and return states?**
   - What we know: The UI-SPEC keeps the summary minimal.
   - What's unclear: Whether the implementation should show only the locker label or also a short “Greece” line everywhere.
   - Recommendation: Keep the planning contract minimal and consistent with the thinnest stored dataset.

</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- [BOX NOW partner API page](https://www.boxnow.bg/en/partner-api) — checked that official docs provide API manual, widget docs, and webhook docs from one official hub
- [BOX NOW API documentation EN](https://boxnow.bg/en/diy/eshops/api) — checked OAuth setup, stage vs production, destination map widget, custom map fields, and widget script/config
- [BOX NOW Partner Portal EN](https://boxnow.gr/en/diy/eshops/partner-portal) — checked the purpose of the partner portal as an order/voucher management tool
- [BOX NOW Partner Portal manual EN PDF](https://boxnow.gr/media/PDF/Partner-Portal-English-v1.33.pdf) — checked portal capabilities like order search, voucher creation, cancellation, and parcel details
- [BOX NOW API manual v7.2 PDF](https://boxnow.gr/media/hidden/BoxNow%20API%20Manual%20%28v.7.2%29.pdf) — checked current API manual structure, environment model, partner registration, and widget/custom-destination sections

### Secondary (MEDIUM confidence)
- `.planning/phases/02-native-catalog-and-embedded-checkout-slice/02-UI-SPEC.md` — checkout route and calm shopper messaging already locked
- `.planning/phases/02-native-catalog-and-embedded-checkout-slice/02-02-PLAN.md` — site-owned pre-payment flow assumption
- `.planning/phases/03-webhook-authoritative-orders-and-inventory/03-CONTEXT.md` — minimal order state and manual exception posture

### Tertiary (LOW confidence - needs validation)
- None
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: BOX NOW widget, partner API, and partner portal
- Ecosystem: Greece-only shipping path, manual portal fulfillment, D1-backed order context
- Patterns: pre-payment locker selection, fail-closed shipping flow, minimal locker persistence
- Pitfalls: premature automation, multi-country scope creep, over-storage

**Confidence breakdown:**
- Standard stack: HIGH - based on official BOX NOW docs and current project constraints
- Architecture: HIGH - strongly aligned with the user’s locked Phase 4 decisions
- Pitfalls: HIGH - directly tied to scope and official integration paths
- Code examples: MEDIUM - simplified planning-oriented snippets from official widget docs
</metadata>
