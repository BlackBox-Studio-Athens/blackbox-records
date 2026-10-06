# Proposal

## Why

Staff changed the UAT and PRD home motto to "No borders. No genres. Just records." The owner wants its last word to cycle between Records, Art and Noise with an audio-related transition, starting on Records. The owner's mockup used a horizontal glitch swap; from a rendered study of three waveform transitions (Signal, Scan, Scrub) the owner chose Scrub, asked for a realistic track waveform that never overlaps "Just" (referencing recording-session clip waveforms), then over recorded iterations asked for the mockup's chaos, for the waveform to survive only as fragments inside it, and for a faster change that every visitor sees at least once.

## What Changes

- `HomeHero` wraps the Staff motto in `<motto-word-cycle data-words="records art noise">`. When the motto's last word is one of the list, the element replaces it with a stacked word slot; otherwise the motto renders unchanged.
- Timing: the written word holds 2.5 s on entry, then each word holds 2.8 s and a 1.4 s scrub changes it, a 12.6 s loop. Visitors typically scroll 4 to 9 s after arriving (Chartbeat) and mobile visitors spend about 7 s above the fold, so the first change finishes by about 3.9 s (after the hero's 0.9 s fade-in) and the second starts within the mobile window. The scrub eases out fast so the new word reads early and settles into its last letter.
- Scrub: a playhead travels from the start of the word to the end of the next word; behind it the next word, ahead of it the current one. The mockup's chaos rides on it: random bursts of word slices tearing sideways and torn fragments of a filled, mirrored session-clip waveform (drifting loudness, kick and snare transients, centre line, device-pixel canvas) flash during the first two thirds of each scrub, cut in and out without easing. The chaos is clipped to a span that grows or shrinks from the old word's length to the new word's length, so it never crosses "Just" and every word lands clean.
- The playhead and word clips run on `motion/mini` (already a web dependency, lazily loaded as in the shell transition); the span and tears use native Web Animations with the same duration and ease, so they stay aligned.
- The rest of the hero keeps its single fade-rise entrance; the owner chose not to animate the three motto lines on load. Screen readers read the written word only. Cycling pauses while the hero is off screen or the tab is hidden; reduced motion keeps the written word.
- `HomeHero` registers the element through a null-rendering `client:load` island. Shell navigation inserts pages without running their scripts but hydrates their islands, so the element reaches Home on every visit, including one that starts on another page, while other pages' eager JavaScript stays unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell-and-player`: The homepage motto may cycle its last word.

## Impact

Home hero, global styles and Home's eager bundle (the element, about 2.2 KB brotli, within Home's budget; Motion mini stays lazy). No content, Worker or commerce change. Staff content stays authoritative: a motto that does not end in a listed word is not animated.
