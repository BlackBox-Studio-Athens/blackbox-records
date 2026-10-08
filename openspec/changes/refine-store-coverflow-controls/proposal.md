# Refine Store Coverflow controls

## Why

In Coverflow the dashed progress rail repeats what the three counts and "You're viewing N of T" already say. Grid and Coverflow are two 32px chips that look like filter tags rather than a view switch, so Coverflow does not invite a press. The front cover hides its Listen action in Coverflow, so a visitor browsing covers cannot hear one without returning to Grid.

## What changes

- The continuation rail under the counts is removed, with its ratio custom property and motion.
- Grid and Coverflow become one 44px switch (option A, "Glyph switch", chosen on 8 October 2026 from a rendered canvas of four options): a quiet framed track holding two segments, each with a drawn glyph (a 2×2 grid; one front panel between two angled side panels) and its Bebas label. The pressed segment takes the ink face. Below 40rem the switch fills its row and Previous and Next share the next one; Previous and Next grow from 32px to 44px.
- The title plaque above the stage gains a Listen end (option 1, "On the plaque", chosen the same day over a corner badge and a button under the cover). It is the shared Listen trigger, with the amber equalizer, a divider and the plaque's frame. While Coverflow shows, it carries the front cover's player data and session state, so it opens the existing player for that record, reads In player for the active source and receives focus back when the player closes. A front cover without a listening source hides it. The front card's own Listen leaves Coverflow; with reduced motion the plaque stays hidden and the flat card keeps its own Listen.

## Scope

Public web storefront only: `StoreCoverflowControls.astro`, the shared Store Coverflow controller, shell snapshot sanitation and `global.css`. Player behavior, sessions and providers are unchanged; the plaque copies the card trigger's existing attributes and the shell's document click routing handles it like any Listen trigger.

## Acceptance

On Distro and flat Store collections with Coverflow, no rail shows; the switch reads as one control with the pressed segment in ink; the plaque's Listen opens the player for the front record and returns focus to itself; it hides for a record without listening data and outside Coverflow. Focused unit tests, the Coverflow Playwright tests, strict OpenSpec validation and `pnpm validate` pass, and a browser pass covers 1280px and 390px.
