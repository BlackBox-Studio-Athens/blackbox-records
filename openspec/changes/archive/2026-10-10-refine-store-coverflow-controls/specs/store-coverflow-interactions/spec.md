## MODIFIED Requirements

### Requirement: Store Coverflow interaction work remains bounded

Store Coverflow MUST keep initial parsing linear in the canonical card count and each navigation event bounded to the positioned stage, without continuous rendering, delayed input queues, or global input listeners.

#### Scenario: Active Store Item changes

- **WHEN** Previous, Next, side-cover selection, focus, touch, wheel, or an arrow key changes the active Store Item
- **THEN** the controller clears no more than the previously positioned six cards and assigns no more than the next six positions
- **AND** only fixed status, count, summary, and plaque Listen fields update alongside those cards, the plaque Listen copying the front card's existing trigger attributes
- **AND** no clone, virtualized window, request, full-card rebuild, layout animation, or image preload is introduced.

#### Scenario: Interaction listeners run

- **WHEN** Store Coverflow is enhanced
- **THEN** pointer and non-passive wheel listeners remain stage-local, the keydown listener remains group-local, and every listener is removed during cleanup
- **AND** wheel repeat gating uses event timestamps and retained residual state rather than a delayed timer or queued navigation
- **AND** no document-level wheel, keydown, or scroll listener, autoplay, timer loop, animation-frame loop, continuous drag rendering, fling physics, or card-by-card catalog stagger runs
- **AND** the enhancement adds no carousel, gesture, animation, or state-management dependency.

#### Scenario: All controller joins Store shell activation

- **WHEN** `/store/` enters through uncached navigation, a cached or prefetched snapshot, or history restoration
- **THEN** Store HTML application, transition-veil closure, and listing-price presentation do not await the Coverflow controller import or mount
- **AND** the activation retains exactly one Store HTML request, one Store listing-price projection request, zero per-card Store Offer reads, and the existing `Cache-Control: no-store` listing response
- **AND** Coverflow does not start, clear, replace, or otherwise change Store route loading feedback.

#### Scenario: Practical performance regression checks run

- **WHEN** the exact final tree runs focused All and Distro interaction checks plus the required repository gates
- **THEN** each handled wheel or key event performs at most one reducer move and bounded prior-six/next-six position work
- **AND** the page shows no visible layout instability or repeatable interaction stall outside authored motion
- **AND** native page wheel behavior resumes when the pointer leaves the preview stage or the group leaves `preview` mode
- **AND** existing project LCP, CLS, and INP budgets remain applicable without requiring a new Store activation matrix unless focused evidence identifies a repeatable Coverflow-attributable regression.

## ADDED Requirements

### Requirement: Store Coverflow switches views with one glyph switch

Every enhanced Store Coverflow SHALL offer Grid and Coverflow as two native pressed-state buttons inside one framed switch, each with a decorative drawn glyph and a visible label, with the pressed segment on the ink face. Each segment SHALL keep visible focus and its existing disabled and `aria-disabled` behavior.

#### Scenario: Visitor sees the view switch

- **WHEN** an enhanced Store Coverflow group renders its controls
- **THEN** Grid shows a two-by-two glyph and Coverflow shows a front panel between two angled side panels, both hidden from assistive technology
- **AND** the pressed segment has the ink face and the other a quiet face that lifts on hover-capable devices
- **AND** the switch with its frame is at least 44 CSS pixels high, as are Previous and Next.

#### Scenario: Controls fit a phone

- **WHEN** the viewport is narrower than 40rem
- **THEN** the switch fills its own row and Previous and Next share the next row
- **AND** the page does not scroll horizontally.
