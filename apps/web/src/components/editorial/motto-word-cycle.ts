import type { animate as animateMotion } from 'motion/mini';

// Cycles the last word of the Staff-written home motto through a short word list.
// The motto stays CMS prose: the element only animates when its last word is one of the list,
// so a rewritten motto simply renders as written.

/**
 * Records holds through the hero's fade-in (about 0.9 s) and a brief look, then the first change finishes by about
 * 2.9 s: well before the 4 to 9 s in which visitors typically start scrolling. Later words hold for one glance, so a
 * second change starts within the roughly 7 s a phone visitor spends on the first screen.
 */
export const MOTTO_FIRST_HOLD_MS = 1500;
export const MOTTO_HOLD_MS = 2800;
export const MOTTO_SCRUB_MS = 1400;
// Leaves fast and settles into the last letter, so the new word reads early and lands calmly.
const SCRUB_EASE: [number, number, number, number] = [0.3, 0.05, 0.2, 1];

export type MottoCycleWord = { before: string; word: string; punctuation: string; after: string };

/** Finds the cycling word at the end of a text node, keeping the Staff-written casing and punctuation. */
export function findMottoCycleWord(text: string, words: readonly string[]): MottoCycleWord | null {
  const match = /(\p{L}+)(\p{P}*)(\s*)$/u.exec(text);
  if (!match || !words.includes(match[1]!.toLowerCase())) return null;
  return { before: text.slice(0, match.index), word: match[1]!, punctuation: match[2]!, after: match[3]! };
}

/** The cycle starts from the written word and spells each other word in the same case. */
export function mottoCycleLabels(found: MottoCycleWord, words: readonly string[]) {
  const start = words.indexOf(found.word.toLowerCase());
  const upper = found.word === found.word.toUpperCase();
  const capital = !upper && /^\p{Lu}/u.test(found.word);
  return [...words.slice(start), ...words.slice(0, start)].map((word) => {
    const cased = upper ? word.toUpperCase() : capital ? word[0]!.toUpperCase() + word.slice(1) : word;
    return cased + found.punctuation;
  });
}

/**
 * One peak level (0.04 to 1) per column, shaped like a clip in a recording session: a drifting section
 * loudness under a kick on each beat and a lighter snare halfway, each decaying fast, with sample-level grain.
 */
export function trackPeaks(count: number, beat: number, seed: number) {
  let state = seed >>> 0 || 1;
  const random = () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 2 ** 32;
  const peaks: number[] = [];
  let loudness = 0.4;
  let accent = 1;
  for (let index = 0; index < count; index += 1) {
    const phase = (index % beat) / beat;
    if (index % beat === 0) accent = random() < 0.85 ? 0.7 + random() * 0.3 : 0.2;
    loudness = Math.min(0.55, Math.max(0.22, loudness + (random() - 0.5) * 0.03));
    const kick = accent * Math.exp(-phase * 7);
    const snare = phase < 0.5 ? 0 : accent * Math.exp(-(phase - 0.5) * 10);
    const level = loudness * (0.55 + 0.45 * random()) + 0.5 * kick + 0.3 * snare;
    peaks.push(Math.min(1, Math.max(0.04, level * (0.8 + 0.2 * random()))));
  }
  return peaks;
}

/** Draws a waveform shard as one filled, mirrored outline at device-pixel resolution, with a centre line. */
function drawWaveShard(canvas: HTMLCanvasElement, width: number, height: number, fontSize: number) {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const context = canvas.getContext('2d');
  if (!context) return;
  const columns = canvas.width;
  const middle = canvas.height / 2;
  const reach = canvas.height * 0.42;
  const peaks = trackPeaks(columns, Math.round(fontSize * 0.32 * ratio), Math.floor(Math.random() * 2 ** 32));
  context.fillStyle = getComputedStyle(canvas).color;
  context.beginPath();
  context.moveTo(0, middle);
  peaks.forEach((peak, column) => context.lineTo(column, middle - peak * reach));
  for (let column = columns - 1; column >= 0; column -= 1) context.lineTo(column, middle + peaks[column]! * reach);
  context.closePath();
  context.fill();
  context.globalAlpha = 0.5;
  context.fillRect(0, middle - ratio / 2, columns, ratio);
}

/**
 * Keyframes for one glitch layer: brief bursts at random moments of the scrub, each held still at its own
 * offset and cut in and out without easing, like the tears in the owner's original mockup.
 */
export function tearKeyframes(random: () => number, offset: () => string): Keyframe[] {
  const frames: Keyframe[] = [{ offset: 0, opacity: 0, transform: 'none' }];
  let start = 0.06 + random() * 0.2;
  // Bursts stop while the playhead settles, so every change lands on a clean word.
  while (start < 0.56) {
    const end = Math.min(0.64, start + 0.025 + random() * 0.05);
    const transform = offset();
    frames.push(
      { offset: start, opacity: 0, transform },
      { offset: start, opacity: 1, transform },
      { offset: end, opacity: 1, transform },
      { offset: end, opacity: 0, transform },
    );
    start = end + 0.03 + random() * 0.18;
  }
  frames.push({ offset: 1, opacity: 0, transform: 'none' });
  return frames;
}

/**
 * Slices of either word and torn waveform shards jump sideways while the playhead runs, cropped to a span
 * that moves from the previous word's length to the length of the word being revealed.
 */
function tear(stage: HTMLElement, words: HTMLElement[], from: number, to: number, fontSize: number) {
  const layer = document.createElement('span');
  layer.className = 'motto-word-cycle__tears';
  stage.append(layer);
  const span = (length: number) => `inset(-50% ${stage.offsetWidth - length}px -50% 0)`;
  layer.animate(
    { clipPath: [span(from), span(to)] },
    { duration: MOTTO_SCRUB_MS, easing: `cubic-bezier(${SCRUB_EASE.join()})` },
  );
  const shift = (reach: number) => () =>
    `translateX(${((Math.random() * 1.15 - 0.15) * reach * fontSize).toFixed(1)}px)`;
  for (let index = 0; index < 7; index += 1) {
    const slice = document.createElement('span');
    slice.className = 'motto-word-cycle__tear';
    slice.textContent = words[index % words.length]!.textContent;
    const top = Math.random() * 88;
    const bottom = Math.max(0, 100 - top - (3 + Math.random() * 13));
    slice.style.clipPath = `inset(${top}% -3em ${bottom}% 0)`;
    layer.append(slice);
    slice.animate(tearKeyframes(Math.random, shift(0.32)), MOTTO_SCRUB_MS);
  }
  // Fragments of a session-clip waveform flash with the slices; the flattest read as the mockup's streaks.
  for (let index = 0; index < 5; index += 1) {
    const shard = document.createElement('canvas');
    shard.className = 'motto-word-cycle__shard';
    const shardWidth = (0.35 + Math.random() * 1.1) * fontSize;
    const shardHeight = (0.06 + Math.random() * 0.3) * fontSize;
    shard.style.top = `${15 + Math.random() * 70}%`;
    shard.style.marginTop = `${-shardHeight / 2}px`;
    shard.style.left = `${Math.random() * Math.max(0, Math.max(from, to) - shardWidth / 2)}px`;
    layer.append(shard);
    drawWaveShard(shard, shardWidth, shardHeight, fontSize);
    shard.animate(tearKeyframes(Math.random, shift(0.4)), MOTTO_SCRUB_MS);
  }
}

let animate: typeof animateMotion | undefined;
let motionLoad: Promise<void> | undefined;
function loadMotion() {
  return (motionLoad ??= import('motion/mini')
    .then((motion) => {
      animate = motion.animate;
    })
    .catch(() => {
      // Without the animation code the words still change, just without the scrub.
    }));
}

/** Registers <motto-word-cycle> once; Home's loader island calls it. */
export function defineMottoWordCycle() {
  if (customElements.get('motto-word-cycle')) return;
  customElements.define('motto-word-cycle', MottoWordCycle);
}

// Node tests import the pure helpers above, where HTMLElement does not exist.
const ElementBase = (globalThis.HTMLElement ?? class {}) as typeof HTMLElement;

class MottoWordCycle extends ElementBase {
  #words: HTMLElement[] = [];
  #playhead: HTMLElement | null = null;
  #index = 0;
  #holdLeft = MOTTO_FIRST_HOLD_MS;
  #dueAt = 0;
  #timer = 0;
  #scrub: ReturnType<typeof animateMotion>[] = [];
  #inView = false;
  #observer: IntersectionObserver | null = null;
  #reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  #update = () => this.#schedule();

  connectedCallback() {
    if (!this.#words.length && !this.#enhance()) return;
    this.#observer = new IntersectionObserver(([entry]) => {
      this.#inView = Boolean(entry?.isIntersecting);
      this.#schedule();
    });
    // The element is display: contents, so its section supplies the box to observe.
    this.#observer.observe(this.closest('section') ?? this.parentElement ?? this);
    document.addEventListener('visibilitychange', this.#update);
    this.#reducedMotion.addEventListener('change', this.#update);
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
    this.#observer = null;
    this.#inView = false;
    document.removeEventListener('visibilitychange', this.#update);
    this.#reducedMotion.removeEventListener('change', this.#update);
    this.#pause();
    for (const animation of this.#scrub) animation.complete();
  }

  #enhance() {
    const list = (this.dataset.words ?? '').toLowerCase().split(/\s+/).filter(Boolean);
    // A shell snapshot can return a copy of the already enhanced markup.
    const stage = this.querySelector<HTMLElement>('.motto-word-cycle__stage');
    if (stage) {
      this.#words = [...stage.querySelectorAll<HTMLElement>('.motto-word-cycle__word')];
      this.#playhead = stage.querySelector('.motto-word-cycle__playhead');
      this.#settle(
        Math.max(
          0,
          this.#words.findIndex((word) => !word.hasAttribute('data-hidden')),
        ),
      );
      return this.#words.length > 1;
    }

    const walker = document.createTreeWalker(this, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => (node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP),
    });
    let last: Text | null = null;
    while (walker.nextNode()) last = walker.currentNode as Text;
    const found = last?.textContent ? findMottoCycleWord(last.textContent, list) : null;
    if (!last || !found) return false;

    const labels = mottoCycleLabels(found, list);
    const spoken = document.createElement('span');
    spoken.className = 'sr-only';
    spoken.textContent = labels[0]!;
    const visual = document.createElement('span');
    visual.className = 'motto-word-cycle__stage';
    visual.setAttribute('aria-hidden', 'true');
    this.#words = labels.map((label, index) => {
      const word = document.createElement('span');
      word.className = 'motto-word-cycle__word';
      word.textContent = label;
      word.toggleAttribute('data-hidden', index > 0);
      return word;
    });
    this.#playhead = document.createElement('span');
    this.#playhead.className = 'motto-word-cycle__playhead';
    this.#playhead.toggleAttribute('data-hidden', true);
    visual.append(...this.#words, this.#playhead);
    last.replaceWith(found.before, spoken, visual, found.after);
    return this.#words.length > 1;
  }

  #schedule() {
    const canRun = this.#inView && document.visibilityState === 'visible' && !this.#reducedMotion.matches;
    if (!canRun) return this.#pause();
    if (this.#timer || this.#scrub.length) return;
    void loadMotion();
    this.#dueAt = performance.now() + this.#holdLeft;
    this.#timer = window.setTimeout(() => {
      this.#timer = 0;
      void this.#transition();
    }, this.#holdLeft);
  }

  #pause() {
    if (!this.#timer) return;
    clearTimeout(this.#timer);
    this.#timer = 0;
    this.#holdLeft = Math.max(0, this.#dueAt - performance.now());
  }

  /** A playhead crosses the word with the new word behind it and the old one ahead, torn by glitch bursts. */
  async #transition() {
    const next = (this.#index + 1) % this.#words.length;
    const from = this.#words[this.#index]!;
    const to = this.#words[next]!;
    const playhead = this.#playhead!;
    await loadMotion();

    if (animate && this.isConnected) {
      to.removeAttribute('data-hidden');
      const fontSize = parseFloat(getComputedStyle(playhead).fontSize);
      const fromLength = from.offsetWidth;
      const toLength = to.offsetWidth;
      playhead.removeAttribute('data-hidden');
      tear(playhead.parentElement!, [from, to], fromLength, toLength, fontSize);

      // Every layer is linear in the playhead position, so one duration and ease keep them aligned.
      const options = { duration: MOTTO_SCRUB_MS / 1000, ease: SCRUB_EASE };
      // Every side but the playhead edge stays open so the text shadow is never cut.
      const open = -fontSize;
      const clip = (left: number, right: number) => `inset(${open}px ${right}px ${open}px ${left}px)`;
      // The playhead runs from the first letter to the end of the new word, which it reveals behind it. A longer
      // old word also closes from its end, so the change starts at the old length and finishes at the new one.
      this.#scrub = [
        animate(playhead, { transform: ['translateX(0px)', `translateX(${toLength}px)`] }, options),
        animate(from, { clipPath: [clip(0, open), clip(toLength, fromLength - toLength)] }, options),
        animate(to, { clipPath: [clip(open, toLength), clip(open, 0)] }, options),
      ];
      await Promise.all(this.#scrub.map((animation) => animation.finished)).catch(() => undefined);
      this.#scrub = [];
    }

    this.#settle(next);
    this.#holdLeft = MOTTO_HOLD_MS;
    this.#schedule();
  }

  #settle(index: number) {
    this.#index = index;
    this.#words.forEach((word, wordIndex) => {
      word.style.removeProperty('clip-path');
      word.toggleAttribute('data-hidden', wordIndex !== index);
    });
    this.#playhead?.setAttribute('data-hidden', '');
    this.querySelector('.motto-word-cycle__tears')?.remove();
  }
}
