## Context

See `proposal.md` for motivation. Commit `81ce9976` produced repeatable mobile-stress LCP around 3.26 seconds for Store All and Store Distro, with roughly 5.5–5.8 MB transferred. Browser Use found 104 canonical Store cards, six positioned cards, 98 display-hidden cards, and only seven completed Store images. Request cardinality is therefore bounded; the positioned covers are selecting oversized candidates because both card types still declare ordinary grid `sizes`.

The current Coverflow CSS renders covers near `56vw` below 40 rem and caps desktop covers at 16 rem. Existing card width ladders already contain useful 320, 480, and 640 pixel candidates.

## Goals / Non-Goals

**Goals:**

- Make the browser select candidates from the actual Coverflow slot geometry.
- Keep Store Item and Distro Coverflow image behavior aligned.
- Preserve server-rendered catalog completeness and all current interaction semantics.
- Stop after the smallest responsive-metadata change that passes the measured gates.

**Non-Goals:**

- No new image loader, client hydration, preload manager, observer, carousel dependency, or generated asset.
- No card removal, virtualization, pagination, batching, static price, or commerce-authority change.
- No source-image edits, width-ladder expansion, controller change, or visual Coverflow redesign.
- No optimization of Home, Artists, or unrelated route findings in this child.

## Decisions

### Use one conditional `sizes` value in each existing card component

When `coverflowPreview` is true, both card components use `(min-width: 40rem) 16rem, 56vw`. Otherwise they retain their existing catalog-grid `sizes`.

This is the smallest change that tells the browser the truth while preserving Astro image handling and current source sets. The same literal is deliberately repeated at the two image-owning components and protected by one parity test; a shared module for one static HTML hint would add a dependency edge without removing meaningful behavior.

Alternative considered: add a deferred-image template/controller. Rejected because Browser Use proves hidden cards already remain unloaded, so request cardinality is not the cause. Alternative considered: shrink width ladders. Rejected because the same cards need larger candidates in complete catalog mode.

### Keep existing loading priority

The first three Store entries and current Distro leading set remain eager; other cards remain lazy. This child changes candidate selection, not discovery or loading policy.

### Measure the current route shape

The archived vertical traversal profiles still run for comparability, but Store acceptance also uses the existing same-document Store activation profile and direct Coverflow interaction. The report must classify static-only local listing-price `404` responses separately from Store 5xx and provider behavior.

If accurate slot metadata does not remove the Store-attributable mobile load and first-interaction miss, stop and amend the child before adding another mechanism.

## Risks / Trade-offs

- **A slot hint is too small for high-DPR active covers** → Keep the existing 480 and 640 candidates and verify mobile/desktop sharpness through Browser Use.
- **The two card components drift** → Add one focused source/markup parity assertion for the exact preview contract and unchanged catalog sizes.
- **Lower transfer does not fix the trace** → Retain before/after evidence and amend rather than layering speculative loading code.
- **Static preview returns listing-price 404** → Record it as frontend-only API unavailability; require zero Store 5xx and unchanged one-projection/zero-per-card counts.

## Migration Plan

1. Preserve `81ce9976` raw baseline evidence under the ignored runtime-performance folder.
2. Add focused failing parity and conditional-size coverage.
3. Change only the two image-owning card components.
4. Rebuild and rerun Store/Distro mobile load, Store activation, fixed traversal, and Browser Use against one exact implementation commit.
5. Record accepted evidence in the parent readiness README, sync the delta, and archive this child.

Rollback is one code commit plus its focused tests. No data, provider, dependency, content, or infrastructure rollback is required.
