# Design inspiration library

Living repository reference for people and AI agents. Last source review: **2026-09-23**.

Start here when designing or redesigning an element. This is a source directory and decision log; the existing [UI pattern dataset](ui-design-patterns.csv) remains the canonical pattern evidence library. [PRODUCT.md](../PRODUCT.md) and [DESIGN.md](../DESIGN.md) govern BlackBox's identity.

## Find a reference

| Need / search terms                               | Start with                                   | BlackBox application                             |
| ------------------------------------------------- | -------------------------------------------- | ------------------------------------------------ |
| Button, hover, press, pointer, border             | RB, GS                                       | Listen, player controls, compact actions         |
| Material, light, depth, shader, texture           | TU, VA                                       | Release feature art or a small interaction study |
| Sequence, transition, timeline, choreography      | GS, GSK                                      | Player and overlay transitions                   |
| Scroll, inertia, parallax, scroll synchronization | LE                                           | Deliberate future page-level motion              |
| Typography, navigation, hierarchy, layout         | [Pattern guide](ui-design-patterns-guide.md) | Existing research before new library adoption    |

## Source register

### TU · ThreeUI

- **Repository:** https://github.com/MengTo/threeui
- **Explore:** https://threeui.com
- **Code entry:** [Community README](https://github.com/MengTo/threeui/blob/main/README.md), [component catalog](https://github.com/MengTo/threeui/blob/main/src/data/shaders.tsx), [source bundles](https://github.com/MengTo/threeui/blob/main/public/source-code.json).
- **Ideas:** Directional light, dimensional surfaces, parameterized visual studies. Translate selectively to BlackBox's restrained monochrome surface.
- **Adoption:** Community includes source and assets; Pro/Beta implementations are excluded. React components may require runtime assets at their documented paths. Review the individual component before adding dependencies.
- **License checkpoint:** Community code is MIT; fonts and assets have separate notices. Check [asset notices](https://github.com/MengTo/threeui/blob/main/ASSET-LICENSES.md) before reuse.
- **Status:** Researched; inspiration only. No package installed or code copied.

### LE · Lenis

- **Repository and code entry:** https://github.com/darkroomengineering/lenis
- **Explore:** https://lenis.darkroom.engineering
- **Ideas:** Controlled acceleration and deceleration; consistent scroll pacing.
- **Adoption:** A scroll engine, not a button component. Consider only for an approved scrolling task. BlackBox already owns scroll resets, overlays and navigation; evaluate those interactions before introduction.
- **License checkpoint:** [MIT](https://github.com/darkroomengineering/lenis/blob/main/LICENSE).
- **Status:** Researched; future scroll reference. No installation for the Listen study.

### GS · GSAP

- **Repository:** https://github.com/greensock/GSAP
- **Explore / API:** https://gsap.com/docs/v3/
- **Code entry:** [README](https://github.com/greensock/GSAP/blob/master/README.md).
- **Ideas:** Short press feedback, deliberate easing, ordered reveals and reversible timelines.
- **Adoption:** Use when sequencing needs exceed CSS. Scope selectors and clean up with the component/shell lifecycle. Respect reduced motion and keep the hit target stable.
- **License checkpoint:** Follow the current [GSAP license](https://gsap.com/standard-license/); do not assume MIT from its GitHub availability.
- **Status:** Researched; timing inspiration only for the Listen study.

### GSK · Official GSAP AI skills

- **Repository:** https://github.com/greensock/gsap-skills
- **Agent index:** https://github.com/greensock/gsap-skills/blob/main/skills/llms.txt
- **Read for implementation:** [core](https://github.com/greensock/gsap-skills/blob/main/skills/gsap-core/SKILL.md), [timelines](https://github.com/greensock/gsap-skills/blob/main/skills/gsap-timeline/SKILL.md), [React](https://github.com/greensock/gsap-skills/blob/main/skills/gsap-react/SKILL.md), [performance](https://github.com/greensock/gsap-skills/blob/main/skills/gsap-performance/SKILL.md).
- **Purpose:** Task-specific AI guidance for actual GSAP adoption, not a visual component catalog.
- **Adoption:** Read the relevant skill when GSAP is selected. Repository instructions remain authoritative. Reading a reference does not install it or enable a new tool.
- **License checkpoint:** README declares MIT for the skills; GSAP itself has its own terms.
- **Status:** Indexed, not installed. README reviewed; individual skills have not been audited.

### VA · Vanta

- **Repository:** https://github.com/tengbao/vanta
- **Explore:** https://www.vantajs.com
- **Code entry:** [README and lifecycle](https://github.com/tengbao/vanta/blob/master/README.md), [effects](https://github.com/tengbao/vanta/tree/master/src).
- **Ideas:** Wave fields, surface movement and pointer-responsive atmosphere.
- **Adoption:** WebGL/Three.js or p5 backgrounds suit a bounded feature surface. Repeating a canvas across 96 Listen controls is a poor fit. Stop offscreen effects, provide a static fallback and destroy instances when their surface leaves.
- **License checkpoint:** [MIT-style license text](https://github.com/tengbao/vanta/blob/master/LICENSE.md); check renderer dependencies separately.
- **Status:** Researched; conceptual texture inspiration only.

### RB · React Bits

- **Repository:** https://github.com/DavidHDev/react-bits
- **Explore:** https://reactbits.dev
- **Code studied:** [Magnet](https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/Magnet/Magnet.jsx), [StarBorder](https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/StarBorder/StarBorder.jsx).
- **Ideas:** Pointer proximity, edge highlights, contained microinteractions.
- **Adoption:** Inspect a component's own dependencies and accessibility. Prefer a stationary button with a moving internal decoration. Avoid one global pointer listener per catalog item.
- **License checkpoint:** [MIT + Commons Clause](https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md). Check current terms and preserve notices for copied portions; this is not unmodified MIT.
- **Status:** Source reviewed; no code copied or package installed.

### PW · Cosmos Public Work

- **Visual reference:** https://www.cosmos.so/public-work
- **Type:** Aesthetic and image-discovery reference, not a component/code repository.
- **Observed in browser (2026-09-23):** An image-dominant archival collection, neutral floating controls, sparse labels and generous separation between images. This is a visual observation, not a claim about conversion or usability results.
- **Search terms:** Archival, image-first, gallery, curation, quiet controls, restrained hierarchy, negative space.
- **BlackBox translation:** Let sleeve artwork lead; keep utility controls compact and calm. Carry across restraint and spacing while retaining BlackBox's dark palette, square geometry and existing typography. Do not import the reference's light canvas or pill-shaped controls as a new site language.
- **Current application:** LISTEN-5's low-contrast frame and all five proposals' quieter hierarchy. The existing BlackBox button remains the primary reference.
- **Asset/code checkpoint:** No code or imagery copied. If an archival image is later selected, inspect its individual source, rights and attribution requirements before adoption.
- **Status:** Page and rendered design reviewed; included for current and future aesthetic exploration.

## Listen button study · 2026-09-23

[Open interactive comparison](design/listen-button-review.html). The studies use local CSS and the existing BlackBox button as their foundation. External references inform the direction; their implementations are not copied.

| ID       | Direction     | Reference connection                 | Decision                                          |
| -------- | ------------- | ------------------------------------ | ------------------------------------------------- |
| LISTEN-A | Transport key | GS timing; RB contained interaction  | Superseded: too far from the requested refinement |
| LISTEN-B | Signal pulse  | RB edge illumination; VA wave rhythm | Superseded by the five closer variations below    |
| LISTEN-C | Etched groove | TU material light; VA surface motion | Explicitly rejected by the user                   |

### Round 2: refine the original, explore a button family

**Confirmed feedback:** The user likes the original Listen design. Improve it without replacing its identity. Animation is optional and must be subtle. Every suggestion must fit the existing site closely. Use this study to inform a later redesign of all public-site buttons. Include Cosmos Public Work as an aesthetic reference.

| ID       | Direction         | What changes                                                                        | Family potential                                                               |
| -------- | ----------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| LISTEN-1 | Original, refined | Familiar luminous chamber; balanced spacing, quieter frame and optional single halo | Closest evolution of current primary, secondary and quiet actions; recommended |
| LISTEN-2 | Fine line         | Crisp ring, small light, flat face and precise border                               | A consistent flat outline system                                               |
| LISTEN-3 | Inset             | Shallow recessed surface and contained light                                        | Restrained pressed surfaces with tonal feedback                                |
| LISTEN-4 | Instrument        | Separate narrow indicator compartment and firmer edges                              | Structured controls; the indicator remains specific to Listen                  |
| LISTEN-5 | Soft contrast     | Calm charcoal surface, quieter border and simpler light                             | Image-first restraint inspired by PW; strongest alternative to 1               |

The current comparison shows the original appearance at rest, five candidates over the same album sleeve, larger Listen actions, and primary/secondary/quiet/disabled family sketches. Motion starts off and can be enabled. OS reduced-motion preferences take priority. No candidate is selected yet.

**Brief:** A listener browsing BlackBox's dark record shelf needs a familiar, compact invitation to open music. Preserve the original dark face, circular indicator, `Listen` label, square geometry and existing fonts. Use a 32px visible compact face within a 44px target, visible keyboard focus and static reduced-motion treatment. Explore border, spacing and surface refinements. Any motion responds briefly to intent and never claims audio is playing.

**Scope:** Review prototypes only. Selection is pending. The comparison's clicks acknowledge a demonstration; they do not load a provider. After a choice, apply it to the shared `MusicStreamingServiceListenTrigger.astro` and shared stylesheet, preserving player data attributes, shell ownership and click isolation. Verify cards, detail pages, mobile, keyboard and player continuity then.

**Review:** Compare against the original first, then hover or Tab to the buttons and press them. Compare narrow and wide layouts, optionally enable subtle motion, and inspect the family sketches. Choose a direction and tell the agent its number. The radio choice stays in that page only; it is not transmitted to Codex or applied to the site.

**Round 1 verification (2026-09-23, superseded):** Native Browser Use in Chrome's blackbox profile checked the original three prototypes. Those checks do not establish acceptance of the revised comparison. Full repository validation follows when a selected treatment changes application code.

**Round 2 verification (2026-09-23):** Native Browser Use in the dedicated blackbox Chrome tab verified all five Listen keyboard responses, choice feedback, five disabled family examples and loaded artwork. Desktop and a 390px viewport override had no horizontal overflow. OS reduced-motion emulation disabled every proposed indicator animation and face transition, even with motion enabled in the page. No console warnings/errors were captured. Temporary browser overrides and test selections were cleared. Formatting and diff whitespace checks passed. These are prototype checks; application code is unchanged by this study.

**Launch again:** From the repository root, run `python -m http.server 4399 --bind 127.0.0.1`, then open `http://127.0.0.1:4399/docs/design/listen-button-review.html`. This is a local review server, not a product route. Stop it with Ctrl+C when finished.

### Round 3: music color and stronger motion · 2026-09-24

User requested colors that suggest playing music and testing motion beyond subtle animation for some options. This expands the exploration allowance; it does not approve a shipped palette or animation.

[Open the color and motion study](design/listen-button-review.html#color-motion). Keep the original dark rectangular face and off-white text. Concentrate color in the indicator and a faint frame tint. The comparison pairs neutral idle buttons with clearly labeled active-state simulations.

| Color                 | Suggested association, not a universal meaning | Prototype motion                     | Tradeoff                                                         |
| --------------------- | ---------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------- |
| Warm white `#eee4d2`  | Illuminated audio equipment                    | Soft opacity breathing               | Closest to current design; less distinct state                   |
| Ember `#ed806c`       | Energy, live signal                            | Expanding ring plus luminous center  | Close to current accent indicator, but may suggest recording     |
| Amber `#e3b56c`       | Amplifier lights and level meters              | Animated five-bar equalizer          | Recommended for exploration; may suggest caution elsewhere       |
| Muted green `#91c5ad` | Active/connected state                         | Expanding ring with breathing center | Clear activity cue, but a new color in the current brand palette |

Color and motion are independent choices. The equalizer can be warm white; the original orb can be amber. Preserve a static fallback and the site's reduced-motion behavior. Stronger continuous motion would belong only to the single verified active session, not every Listen button across the catalog. Idle/hint animation should be brief and user-triggered.

The current third-party embeds do not provide reliable app-level playback truth. The study's “Playing” labels and decorative meters are explicitly simulated. Production must retain truthful “Player Ready” language until playback can actually be verified. Color alone must never communicate state, and a synthetic meter must not be presented as audio-reactive.

**Round 3 verification:** Native Browser Use in Chrome's blackbox profile confirmed the color values and active animation styles, the animation-off control, OS reduced-motion overrides and single-column reflow without horizontal overflow at a 390px viewport override. No browser console warnings/errors were captured. Temporary device and media overrides were cleared. This validates the standalone simulation, not playback detection or production player behavior.

### Round 4: equalizer in the Bandcamp flow · 2026-09-24

**Confirmed direction:** The user likes the animated equalizer and wants iterations considered in the actual Bandcamp modal experience. Neither the final bar pattern nor the color is selected.

[Open the interactive player study](design/equalizer-player-review.html). Each variant opens the real Disintegration Bandcamp embed on explicit click. Amber and warm white can be compared independently. A clearly labeled prototype control simulates interaction for silent minimize/reopen review.

| ID   | Iteration     | Motion and application                                                                                |
| ---- | ------------- | ----------------------------------------------------------------------------------------------------- |
| EQ-1 | Fluid five    | Five thin bars, staggered smooth movement; recommended balance for card, modal header and mini player |
| EQ-2 | Bold three    | Three thicker bars with a quicker cycle; strongest compact legibility                                 |
| EQ-3 | Stepped seven | Seven segmented bars with stepped movement; expressive equipment reference, visually busier           |

#### Recommended interaction contract

The equalizer identifies the music action. It is not an audio meter, play/pause control or proof of playback. Movement acts as a short invitation and a transition cue, then settles so the provider's Play control owns attention. Keep the same silhouette and accent across trigger, modal header and minimized player.

| State or action        | Label / visual behavior                                                                     | Session behavior                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Shelf idle             | Listen, static equalizer; no catalog-wide loops                                             | No provider iframe or warmup before intent                           |
| Hover / keyboard focus | Two short cycles; border and visible focus remain stable                                    | No provider request                                                  |
| Touch / click          | Immediate modal; brief header motion provides touch feedback                                | Create the selected embed once                                       |
| Loading                | Loading Bandcamp with a distinct loading line; do not use musical motion as progress        | Wait for iframe load; Close remains available                        |
| Loaded, untouched      | Bandcamp · Player Ready; header settles                                                     | Close destroys this session                                          |
| Embed interaction      | Bandcamp owns Play, Pause, track selection and progress                                     | Interaction enables Minimize, but does not establish playback        |
| Minimized              | Player Ready · Bandcamp, title, Open Player, Stop; static mark, brief motion on hover/focus | Preserve the exact iframe node                                       |
| Reopen same release    | Open Player, brief handoff                                                                  | Reuse iframe without changing src or resetting the provider          |
| Stop                   | Restore Listen and neutral action state                                                     | Remove iframe and restore focus                                      |
| Slow/unavailable embed | Plain failure message, Retry, direct Bandcamp link, Close; no musical activity cue          | Prototype offers a 15-second timeout and an explicit failure preview |

**Current implementation evidence:** `player-session-ui.ts`, `shell-player-view-state.ts`, `shell-player-modal-open-request.ts`, `shell-player-session-controller.ts` and `ShellPlayerSurface.tsx` already separate loaded/interaction/modal/minimized state. The existing reducer allows minimizing only after load plus interaction. A same-release request reuses the current session; a different release or provider replaces it. There is no reliable play/pause state in this model. `iframe.load` confirms frame loading, not successful audio playback or a guarantee that the provider page is usable.

**Proposed refinements, not shipped behavior:** The equalizer in the modal header/mini player, same-release trigger label changing to Open Player, and timeout/retry UI are study proposals. The prototype uses a native dialog and the site's existing approximately 480px modal / 350px Bandcamp geometry. It is not a replacement player architecture. Production should retain the shell's existing routing, provider switching, focus and iframe ownership. Tidal, other releases, shell navigation and coverflow require separate integration acceptance after a design choice.

**Accessibility and performance:** Decorative bars are aria-hidden; the text names the action/state. Button hit targets remain at least 44px. Motion only changes transforms, uses finite repetitions and stops under reduced motion or the study's disable control. Native dialog traps focus in this study; Escape follows Close/Minimize semantics. On mobile the modal occupies the viewport with its top controls accessible; the mini player wraps without horizontal overflow. Do not place controls over the provider iframe or infer playback from focus, clicks or elapsed time.

#### Repeatable prototype check

1. Load the study fresh: no iframe exists. Tab to each Listen button; compare motion and focus.
2. Open a variant: the modal appears immediately, then the real artwork and track list load. Before any embed interaction, Close or Escape removes the frame and returns focus to its trigger.
3. Open again, use **Simulate embed interaction**, then Minimize. Record `document.querySelector('iframe').dataset.instance` before and after Open Player: it must be unchanged.
4. Minimize then Stop: `document.querySelectorAll('iframe').length` must be zero; all three sample labels return to Listen.
5. Preview unavailable embed, Retry, then close: failure is recoverable and old frames do not accumulate.
6. Repeat at a 390px viewport and with OS reduced motion. No modal/mini horizontal overflow, and all equalizer animation names are `none` under reduced motion.

**Observed verification:** Native Browser Use with blackbox Chrome passed the steps above, including the real Bandcamp embed, untouched Escape/focus return, simulated interaction, same iframe instance through minimize/reopen, retry, Stop cleanup and all three visual variants. The mobile modal and mini player fit a 390px override; reduced motion disabled all seven potential bar animations. No console warning/error was captured. No audio playback was initiated or validated. Application source was not changed; full repository and production-flow gates apply at integration.

### Adopted: Fluid five with animation · 2026-09-24

The user selected **Fluid five with animation**. The local application now uses five amber (`#e3b56c`) bars in shared Listen controls, the modal heading and the minimized player. The familiar dark rectangular button remains, with a 44px minimum target and a visible amber keyboard outline. An 820ms transform cycle repeats twice with staggered bars, then returns to the static silhouette. Reduced motion disables it. No animation dependency or per-card hydration was added.

`MusicEqualizer.tsx` is the player module's shared decorative entrypoint. The existing shell continues to own provider selection, iframe loading, interaction, close/minimize, reopening and Stop. `Player Ready` remains truthful; the synthetic equalizer is not audio-reactive. The prototype's timeout/retry and dynamic trigger-label experiments remain proposals outside this selection.

Native Chrome Browser Use confirmed 96 five-bar Listen controls, no iframe before intent, keyboard focus return on untouched Close, Bandcamp/Tidal switching, minimize/reopen, header and mobile navigation continuity, Stop cleanup, and the modal/mini layout at a 390px device override. Reduced motion produced `animation-name: none`. Bandcamp's own progress advanced during the interaction check; the app still labels the session `Player Ready`. This frontend-only preview has no commerce Worker, so unavailable listing prices are outside the visual acceptance.

For future button redesigns, reuse the square dark face, compact type, stable border, visible focus and finite interaction motion. Keep music-specific bars and amber scoped to listening. Preserve the source register above, including Cosmos, as inspiration rather than adopting another site's component styling wholesale.

### Store placement and shared session state study · 2026-09-24

[Open the placement showcase](design/store-listen-placement-review.html). These are proposals for selection, not changes to the application. The user requested a visual comparison of Store sizing/placement and the matching button state in Store and Releases while the player is minimized.

| Option               | Store placement                 | Size       | Tradeoff                                                                    |
| -------------------- | ------------------------------- | ---------- | --------------------------------------------------------------------------- |
| A, Compact overlay   | Bottom-left of artwork          | 104 × 44px | Closest refinement of the current 122px-wide button; still overlaps artwork |
| B, Below the artwork | Dedicated row before the title  | 112 × 44px | Preserves the artwork, adds 52px to each card                               |
| C, Equalizer corner  | Top-right of artwork, icon only | 44 × 44px  | Small footprint; text discoverability relies on tooltip/accessibility label |

Proposed matching-session state: use **Open player**, an amber outline and a quiet amber background, without changing button dimensions. Apply the same recording identity across Store and Releases. Other recordings retain Listen; selecting one replaces the current session. Stop clears the matching state everywhere. Releases keeps its current placement and larger primary control. The icon-only option retains its silhouette and changes its accessible name and tooltip to Open player.

The study deliberately simulates the session without loading audio. It offers a four-record Store preview, Releases preview, narrow layout, animation toggle, minimize/reopen and Stop. An existing session can be playing or paused inside Bandcamp; neither interaction nor minimization proves playback. Keep `Player Ready`, with finite equalizer motion and reduced-motion support. Do not add pause controls or a continuous playing indicator without reliable provider playback events.

Browser review in blackbox Chrome confirmed the three target sizes, loaded artwork, matching state across Store/Releases, switching to another recording, reopen/minimize and Stop reset. The narrow preview and 390px device viewport had no horizontal overflow; reduced motion disabled all bar animations. No warning/error was captured after the asset paths were corrected. This evidence covers the standalone study only; application integration awaits selection.

### Selected: Below the artwork with In player status · 2026-09-24

The user selected **B, Below the artwork** and requested an inactive control for the recording already in the player, relying on the floating player's Open and Stop controls. This supersedes the study's Open player card label. The live implementation uses **In player** because iframe playback may be paused or playing without a reliable parent-page signal.

Store uses a 112 × 44px button below artwork and before the title; the 52px row stays aligned for source-less records. Releases keeps its existing placement. Matching editorial source IDs receive an amber border/tint, readable text, static bars and a native disabled button. Other records remain actionable. The existing shell synchronizes status on session changes, page/cached navigation and overlay rendering, without adding playback state or per-card scripts. Open and Stop stay in the floating player; both have 44px touch targets.

The earlier comparison remains historical exploration. Future designs should preserve this separation between an in-session status on the record and controls in the persistent player. The amber state must not imply confirmed playback or an error/unavailable recording.

### Selected: mode-aware Listen alignment · 2026-09-24

[Review Grid and Coverflow alignment](design/store-listen-alignment-review.html). The user selected C: keep Grid actions aligned with the title and artist gutter, and center the Coverflow action beneath the active record. The selected 112 × 44px control and In player status remain consistent in both views.

The Store applies this alignment only to the active Coverflow action row. Grid keeps its existing left content rail. This follows each view’s visual anchor without changing the button’s size, status, or interaction.

## Add a source or revisit a decision

1. Search this register and the pattern dataset first. Reuse IDs.
2. Add a stable short ID, repository URL, visual demo, exact code entry, useful search terms, intended surfaces, limitations, license link and review date.
3. Mark evidence accurately: README reviewed, source reviewed, prototype tried, selected, rejected or shipped. Link the task/prototype and record why.
4. Reopen upstream source before copying code or choosing a dependency. Pin the exact revision and preserve required notices if code is adopted.
5. Add distinct reusable patterns to the existing CSV. Keep source discovery here and task planning in OpenSpec; do not create parallel specification systems.

Future-agent prompt: “Read DESIGN.md and docs/design-inspiration.md. For [element], shortlist relevant source IDs, inspect current upstream examples, and propose options consistent with PRODUCT.md. Record the selection and its rationale here.”

This is a Git-versioned living reference. It does not automatically monitor upstream repositories or synchronize to a cloud document.
