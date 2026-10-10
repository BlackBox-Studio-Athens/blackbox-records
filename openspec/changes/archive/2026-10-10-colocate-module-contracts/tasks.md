## 1. Implementation

- [x] 1.1 Move module contracts into each `project.json` `metadata.boundaries`; derive the module map in the loader.
- [x] 1.2 Verify the loaded manifest is deep-equal to the previous one; run architecture checks and strict OpenSpec validation.
- [x] 1.3 Drop exports no other module imports; use pattern exports for the staff and web UI kits.
