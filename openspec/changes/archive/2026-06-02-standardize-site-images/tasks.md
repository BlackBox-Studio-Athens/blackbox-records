## 1. Spec And Review

- [x] 1.1 Review current image surfaces and confirm the four image roles cover them without extra abstractions.
- [x] 1.2 Keep the proposal spec-only until implementation scope is approved.

## 2. Future Implementation Slice

- [x] 2.1 Add or update small helpers only where image URL projection is duplicated.
- [x] 2.2 Keep Astro `<Image>` as the default for static local content images.
- [x] 2.3 Keep raw `<img>` documented for runtime/public string URL surfaces.
- [x] 2.4 Ensure cart and checkout image fields remain display snapshots only.
- [x] 2.5 Ensure provider product image URLs derive from repo content and the target Product Environment.

## 3. Validation

- [x] 3.1 Extend `pnpm assets:check` with read-only policy checks where useful.
- [x] 3.2 Add focused tests for provider URL projection and cart/checkout image snapshots if those helpers change.
- [x] 3.3 Run `pnpm openspec -- validate standardize-site-images --type change --strict`.
- [x] 3.4 Run `pnpm openspec -- validate --all --strict`.

Planning notes:

- Do not rewrite image files, reorganize Decap media, introduce a CDN/DAM, or add generated image derivatives in this change.
- Browser Use is required only for later implementation that changes rendered image framing, loading, or layout behavior.
