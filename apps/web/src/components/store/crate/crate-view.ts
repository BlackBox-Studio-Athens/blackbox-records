/**
 * The Store Crate on the page. It builds a bin's stage the first time the shopper visits it, writes only the poses
 * that change, flies the covers on screen between Grid and Crate, uses the item in hand's own Store card as the panel
 * and keeps its place in the history entry so Back reopens it. All state lives in this instance and every listener
 * sits on its own elements, so leaving the route and calling destroy() leaves nothing behind.
 */
import { readRootScrollPaddingTop } from '@/platform/lib/lenis-scroll';
import { BIN_WORDS, BINS, type Bin } from './crate-bins';
import {
  advanceWheelGesture,
  createTipGesture,
  crateWheelDelta,
  dividerOf,
  keyIntent,
  restingWheelGesture,
} from './crate-input';
import {
  ARRIVE_MS,
  catalogOf,
  followUp,
  formatAfterCrate,
  initialState,
  itemInHand,
  landed,
  MECHANIC,
  recordOf,
  reduce,
  restoreState,
  slotOf,
  type Catalog,
  type CrateItem,
  type CrateRecord,
  type FlipBin,
  type Focus,
  type Intent,
  type ItemId,
  type State,
} from './crate-model';
import {
  EASE,
  flightPose,
  flipPose,
  flipTiming,
  rackPose,
  rackTiming,
  transformOf,
  transitionOf,
  type BinGeometry,
  type Box,
  type FlipGeometry,
  type Pose,
  type RackGeometry,
  type Timing,
} from './crate-pose';

export interface StoreCrateHost {
  /** True on collections whose Grid filters by format (Distro). */
  readonly filterable: boolean;
  /** The Grid filter applied now, or 'all'. */
  format(): string;
  /** Applies a Grid filter to the page before returning; collections without format filtering ignore it. */
  setFormat(formatKey: string): void;
}

export interface StoreCrate {
  readonly isOpen: boolean;
  /** The Grid filter that matches the bin in hand while the Crate is open, otherwise null. */
  readonly formatKey: string | null;
  /** Opens on the card the Grid is on; covers still flying from the last switch land at once first. */
  open(): void;
  /** A format choice: walks to its bin, or leaves for the Grid with that filter when it has no bin. */
  choose(formatKey: string): void;
  close(): void;
  destroy(): void;
}

type Rect = { readonly left: number; readonly bottom: number; readonly width: number; readonly height: number };
interface FlipLayout {
  readonly geometry: FlipGeometry;
  readonly sleeve: Rect;
  readonly board: Rect;
  readonly walls: string;
  readonly tab: { readonly top: number; readonly width: number; readonly height: number; readonly font: number };
  readonly stamp: number;
}
interface RackLayout {
  readonly geometry: Omit<RackGeometry, 'pitch' | 'left'>;
  readonly tape: Rect & { readonly depth: number };
  readonly rack: { readonly left: number; readonly top: number; readonly width: number; readonly height: number };
  readonly maxPitch: number;
  readonly spineFont: number;
}
interface StageLayout {
  readonly name: 'desktop' | 'phone';
  readonly width: number;
  readonly height: number;
  readonly hinge: number;
  readonly step: number;
  readonly vinyl: FlipLayout;
  readonly cd: FlipLayout;
  readonly tape: RackLayout;
}

// The approved canvas sizes. Each stage is drawn at its design size and scaled to fit as one 2D transform.
const DESKTOP: StageLayout = {
  name: 'desktop',
  width: 560,
  height: 524,
  hinge: 472,
  step: 220,
  vinyl: {
    geometry: {
      mechanic: 'flip',
      w: 360,
      h: 360,
      H: 763,
      P: 1260,
      ZS: 72,
      ZP: 27,
      A: 61,
      tilt: 6,
      hint: 0,
      lift: 24,
      pileLift: 5,
      dim: 0.15,
      peek: 4,
      dragScale: 200,
      fall: 0.16,
      tempo: 1,
    },
    sleeve: { left: 100, bottom: 52, width: 360, height: 360 },
    board: { left: 82, bottom: 52, width: 396, height: 270 },
    walls: 'M80 472 135 262M480 472 425 262',
    tab: { top: -22, width: 40, height: 22, font: 17 },
    stamp: 132,
  },
  cd: {
    geometry: {
      mechanic: 'flip',
      w: 300,
      h: 272,
      H: 577,
      P: 952,
      ZS: 80,
      ZP: 30,
      A: 60,
      tilt: 6,
      hint: 0,
      lift: 20,
      pileLift: 5,
      dim: 0.12,
      peek: 6,
      dragScale: 180,
      fall: 0.16,
      tempo: 0.85,
    },
    sleeve: { left: 130, bottom: 52, width: 300, height: 272 },
    board: { left: 110, bottom: 52, width: 340, height: 200 },
    walls: 'M120 472 168 292M440 472 392 292',
    tab: { top: -20, width: 34, height: 20, font: 15 },
    stamp: 100,
  },
  tape: {
    geometry: {
      mechanic: 'rack',
      W: 190,
      Hh: 297,
      T: 48,
      H: 763,
      P: 1260,
      rackScale: 0.62,
      pullScale: 0.9,
      pullY: 204,
      centerX: 280,
      tempo: 1,
    },
    tape: { left: 185, bottom: 52, width: 190, height: 297, depth: 48 },
    rack: { left: 126, top: 276, width: 308, height: 196 },
    maxPitch: 36,
    spineFont: 22,
  },
};
const PHONE: StageLayout = {
  name: 'phone',
  width: 358,
  height: 370,
  hinge: 330,
  step: 140,
  vinyl: {
    geometry: {
      mechanic: 'flip',
      w: 250,
      h: 250,
      H: 560,
      P: 1000,
      ZS: 80,
      ZP: 24,
      A: 63,
      tilt: 0,
      hint: 12,
      lift: 20,
      pileLift: 0,
      dim: 0.17,
      peek: 3,
      dragScale: 170,
      fall: 0.2,
      tempo: 1,
    },
    sleeve: { left: 54, bottom: 40, width: 250, height: 250 },
    board: { left: 39, bottom: 40, width: 280, height: 190 },
    walls: 'M38 330 73 190M320 330 285 190',
    tab: { top: -20, width: 34, height: 20, font: 16 },
    stamp: 92,
  },
  cd: {
    geometry: {
      mechanic: 'flip',
      w: 208,
      h: 189,
      H: 423,
      P: 756,
      ZS: 60,
      ZP: 23,
      A: 62,
      tilt: 0,
      hint: 10,
      lift: 16,
      pileLift: 0,
      dim: 0.13,
      peek: 5,
      dragScale: 150,
      fall: 0.2,
      tempo: 0.85,
    },
    sleeve: { left: 75, bottom: 40, width: 208, height: 189 },
    board: { left: 64, bottom: 40, width: 230, height: 140 },
    walls: 'M65 330 97 210M293 330 261 210',
    tab: { top: -17, width: 28, height: 17, font: 13 },
    stamp: 68,
  },
  tape: {
    geometry: {
      mechanic: 'rack',
      W: 132,
      Hh: 206,
      T: 33,
      H: 560,
      P: 1000,
      rackScale: 0.62,
      pullScale: 0.9,
      pullY: 140,
      centerX: 179,
      tempo: 1,
    },
    tape: { left: 113, bottom: 40, width: 132, height: 206, depth: 33 },
    rack: { left: 69, top: 196, width: 220, height: 134 },
    maxPitch: 25,
    spineFont: 17,
  },
};
/** Below this desk width the phone stage reads better than a shrunken desktop one. */
const DESKTOP_FROM = 480;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SVG = 'http://www.w3.org/2000/svg';

type Written = {
  transform: string;
  transition: string;
  opacity: string;
  z: string;
  pe: string;
  shade: string;
  label: string;
  behind: boolean;
};
type Piece = {
  readonly el: HTMLElement;
  readonly shades: readonly HTMLElement[];
  /** The faces that carry opacity: the sleeve itself, or a tape's front and spine. */
  readonly faces: readonly HTMLElement[];
  readonly img: HTMLImageElement | null;
  readonly id: ItemId | null;
  written: Written | null;
};
type BinView = {
  readonly bin: Bin;
  readonly el: HTMLElement;
  readonly chrome: readonly HTMLElement[];
  readonly pieces: readonly Piece[];
  readonly board: Piece | null;
  readonly geometry: BinGeometry;
  readonly rest: Box;
};

const px = (n: number) => `${n}px`;

/**
 * Rewrites an element's text in place. Replacing its text node is a child-list change, which makes Chromium re-check
 * every `:has()` rule against the whole page (the header cart has one), so each flip would restyle every card.
 */
function setText(element: Element | null, text: string) {
  if (!element) return;
  const node = element.firstChild;
  if (node instanceof Text && node === element.lastChild) {
    if (node.data !== text) node.data = text;
  } else if (element.textContent !== text) element.textContent = text;
}

function readItems(cards: readonly HTMLElement[]): CrateItem[] {
  return cards.map((card) => {
    const bin = card.dataset.storeCrateBin;
    return {
      slug: card.dataset.storeCrateSlug ?? '',
      artist: card.dataset.storeArtist ?? '',
      title: card.querySelector('.brand-card-title')?.textContent?.trim() ?? '',
      formatKey: card.dataset.distroFormatKey ?? 'all',
      bin: bin === 'vinyl' || bin === 'cd' || bin === 'tape' ? bin : null,
    };
  });
}

function readRecord(value: unknown): CrateRecord | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Partial<CrateRecord>;
  return typeof record.bin === 'string' &&
    BINS.includes(record.bin) &&
    typeof record.returnTo === 'string' &&
    record.hands &&
    typeof record.hands === 'object'
    ? (record as CrateRecord)
    : null;
}

/** Mounts the Crate on a Store collection's `.store-crate` root. Null when the page has no bin. */
export function mountStoreCrate(
  root: HTMLElement,
  host: StoreCrateHost,
  options: { restore?: boolean } = {},
): StoreCrate | null {
  const stage = root.querySelector<HTMLElement>('[data-store-crate-stage]');
  const desk = root.querySelector<HTMLElement>('[data-store-crate-desk]');
  const nav = root.querySelector<HTMLElement>('[data-store-crate-nav]');
  const end = root.querySelector<HTMLElement>('[data-store-crate-end]');
  const rail = root.querySelector<HTMLElement>('[data-store-crate-rail]');
  const counter = root.querySelector<HTMLElement>('[data-store-crate-counter]');
  const status = root.querySelector<HTMLElement>('[data-store-crate-status]');
  const stamp = root.querySelector<HTMLTemplateElement>('template[data-store-crate-stamp]');
  const openBins = (root.dataset.storeCrateBins ?? '')
    .split(' ')
    .filter((bin): bin is Bin => BINS.includes(bin as Bin));
  const cards = [...root.querySelectorAll<HTMLElement>('.store-item-card--listing')];
  if (!stage || !desk || !nav || !end || !rail || !counter || !status || openBins.length === 0 || cards.length === 0)
    return null;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hoverless = window.matchMedia('(hover: none)').matches;
  let cat: Catalog = catalogOf(readItems(cards), openBins, motion.matches);
  let state: State = initialState(cat);
  let layout: StageLayout = DESKTOP;
  let scale = 1;
  let built = new Map<Bin, BinView>();
  let space: HTMLElement | null = null;
  let timer = 0;
  let flying: Animation[] = [];
  let taught = false;
  let railBin: Bin | null = null;
  let recorded = 'null';
  let resize: ResizeObserver | null = null;
  let wheelState = restingWheelGesture();
  let handCard: HTMLElement | null = null;
  const disposers: (() => void)[] = [];

  const listen = <K extends keyof HTMLElementEventMap>(
    el: HTMLElement,
    type: K,
    handler: (event: HTMLElementEventMap[K]) => void,
    opts?: AddEventListenerOptions,
  ) => {
    el.addEventListener(type, handler as EventListener, opts);
    disposers.push(() => el.removeEventListener(type, handler as EventListener, opts));
  };

  const focusedGeometry = (): BinGeometry | null =>
    state.mode.view === 'crate' ? (built.get(state.mode.focus.at)?.geometry ?? null) : null;
  const finger = createTipGesture(focusedGeometry, (intent) => dispatch(intent));

  // ---- Layout -------------------------------------------------------------------------------------------------
  function sizeStage() {
    const width = desk!.clientWidth || layout.width;
    const next = width >= DESKTOP_FROM ? DESKTOP : PHONE;
    scale = Math.min(1, width / next.width);
    if (next !== layout) {
      layout = next;
      // Geometry differs between the two stages, so their bins are rebuilt on the next render.
      built.forEach((view) => view.el.remove());
      built = new Map();
    }
    stage!.style.height = px(Math.round(layout.height * scale));
    if (space) {
      space.style.width = px(layout.width);
      space.style.height = px(layout.height);
      // A desk wider than the bin keeps the bin in its middle.
      space.style.left = px(Math.max(0, Math.round((width - layout.width * scale) / 2)));
      space.style.transform = `scale(${scale})`;
    }
  }

  function stampOf(size: number, label: string): HTMLElement {
    const node = stamp?.content.firstElementChild?.cloneNode(true) as HTMLElement | undefined;
    if (!node) {
      const fallback = document.createElement('span');
      fallback.className = 'store-crate-stamp';
      fallback.textContent = label;
      return fallback;
    }
    const logo = node.querySelector('img');
    if (logo) {
      logo.style.width = px(size);
      logo.style.height = px(size);
    }
    node.style.fontSize = px(Math.round(size * 0.27));
    return node;
  }

  function shade(): HTMLElement {
    const el = document.createElement('span');
    el.className = 'store-crate-shade';
    el.style.opacity = '0';
    return el;
  }

  function floor(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'store-crate-floor';
    el.style.top = px(layout.hinge);
    el.style.height = px(layout.height - layout.hinge);
    el.setAttribute('aria-hidden', 'true');
    return el;
  }

  function buildFlip(bin: 'vinyl' | 'cd', container: HTMLElement): BinView {
    const spec = layout[bin];
    const g = spec.geometry;
    const walls = document.createElementNS(SVG, 'svg');
    walls.setAttribute('width', String(layout.width));
    walls.setAttribute('height', String(layout.height));
    walls.setAttribute('aria-hidden', 'true');
    walls.style.position = 'absolute';
    walls.style.inset = '0';
    const path = document.createElementNS(SVG, 'path');
    path.setAttribute('d', spec.walls);
    path.setAttribute('stroke', '#262626');
    path.setAttribute('fill', 'none');
    walls.append(path);

    const boardEl = document.createElement('div');
    boardEl.className = 'store-crate-board';
    boardEl.setAttribute('aria-hidden', 'true');
    Object.assign(boardEl.style, {
      left: px(spec.board.left),
      bottom: px(spec.board.bottom),
      width: px(spec.board.width),
      height: px(spec.board.height),
    });
    const boardShade = shade();
    boardEl.append(stampOf(spec.stamp, root.dataset.storeCrateLabel ?? ''), boardShade);

    const shelf = cat.shelves[bin];
    let previous = '';
    const pieces = shelf.map((id): Piece => {
      const item = cat.items[id]!;
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'store-crate-sleeve';
      el.tabIndex = -1;
      Object.assign(el.style, {
        left: px(spec.sleeve.left),
        bottom: px(spec.sleeve.bottom),
        width: px(spec.sleeve.width),
        height: px(spec.sleeve.height),
        opacity: '0',
        visibility: 'hidden',
      });
      const img = document.createElement('img');
      img.className = 'store-crate-art';
      img.alt = '';
      img.decoding = 'async';
      img.draggable = false;
      const sleeveShade = shade();
      el.append(img, sleeveShade);
      const shades = [sleeveShade];
      const letter = dividerOf(item.artist);
      if (letter !== previous) {
        const tab = document.createElement('span');
        tab.className = 'store-crate-tab';
        tab.setAttribute('aria-hidden', 'true');
        const position = letter === '#' ? 0 : ALPHABET.indexOf(letter) / 25;
        Object.assign(tab.style, {
          top: px(spec.tab.top),
          left: px(Math.round(position * (spec.sleeve.width - spec.tab.width))),
          width: px(spec.tab.width),
          height: px(spec.tab.height),
          fontSize: px(spec.tab.font),
          lineHeight: px(spec.tab.height + 2),
        });
        tab.textContent = letter;
        const tabShade = shade();
        tab.append(tabShade);
        shades.push(tabShade);
        el.append(tab);
        previous = letter;
      }
      return { el, shades, faces: [el], img, id, written: null };
    });

    container.append(walls, boardEl, ...pieces.map((piece) => piece.el), floor());
    return {
      bin,
      el: container,
      chrome: [walls as unknown as HTMLElement],
      pieces,
      board: { el: boardEl, shades: [boardShade], faces: [boardEl], img: null, id: null, written: null },
      geometry: g,
      rest: {
        left: spec.sleeve.left,
        top: layout.height - spec.sleeve.bottom - spec.sleeve.height,
        width: spec.sleeve.width,
        height: spec.sleeve.height,
      },
    };
  }

  function buildRack(container: HTMLElement): BinView {
    const spec = layout.tape;
    const shelf = cat.shelves.tape;
    const pitch = Math.min(spec.maxPitch, (spec.rack.width - 20) / Math.max(1, shelf.length));
    const geometry: RackGeometry = { ...spec.geometry, pitch, left: spec.rack.left + 10 };
    const back = document.createElement('div');
    back.className = 'store-crate-rack';
    back.setAttribute('aria-hidden', 'true');
    Object.assign(back.style, {
      left: px(spec.rack.left),
      top: px(spec.rack.top),
      width: px(spec.rack.width),
      height: px(spec.rack.height),
    });
    const { width: W, height: Hh, depth: T } = spec.tape;
    const pieces = shelf.map((id): Piece => {
      const item = cat.items[id]!;
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'store-crate-tape';
      el.tabIndex = -1;
      Object.assign(el.style, {
        left: px(spec.tape.left),
        bottom: px(spec.tape.bottom),
        width: px(W),
        height: px(Hh),
        visibility: 'hidden',
      });
      const front = document.createElement('img');
      front.className = 'store-crate-face store-crate-front';
      front.alt = '';
      front.decoding = 'async';
      front.draggable = false;
      front.style.transform = `translateZ(${T / 2}px)`;
      const spine = document.createElement('span');
      spine.className = 'store-crate-face store-crate-spine';
      spine.setAttribute('aria-hidden', 'true');
      Object.assign(spine.style, {
        left: px((W - T) / 2),
        width: px(T),
        height: px(Hh),
        fontSize: px(spec.spineFont),
        transform: `rotateY(-90deg) translateZ(${W / 2}px)`,
      });
      const title = document.createElement('span');
      title.textContent = item.title;
      spine.append(item.artist, title);
      el.append(front, spine);
      return { el, shades: [], faces: [front, spine], img: front, id, written: null };
    });
    container.append(back, ...pieces.map((piece) => piece.el), floor());
    return {
      bin: 'tape',
      el: container,
      chrome: [back],
      pieces,
      board: null,
      geometry,
      rest: { left: spec.tape.left, top: layout.height - spec.tape.bottom - Hh, width: W, height: Hh },
    };
  }

  function binView(bin: Bin): BinView {
    const existing = built.get(bin);
    if (existing) return existing;
    if (!space) {
      space = document.createElement('div');
      space.className = 'store-crate-space';
      stage!.append(space);
      sizeStage();
    }
    const container = document.createElement('div');
    container.className = 'store-crate-bin';
    container.dataset.bin = bin;
    const view = bin === 'tape' ? buildRack(container) : buildFlip(bin, container);
    view.pieces.forEach((piece, k) => {
      piece.el.addEventListener('click', () => pick(bin, k));
      piece.el.addEventListener('pointerenter', (event) => enter(bin, k, event));
      piece.el.addEventListener('pointerleave', () => {
        if (MECHANIC[bin] === 'flip') dispatch({ type: 'lean', lean: 'none' });
      });
    });
    space.append(container);
    built.set(bin, view);
    return view;
  }

  // ---- Rendering ----------------------------------------------------------------------------------------------
  const cardImageOf = (id: ItemId) => cards[id]?.querySelector<HTMLImageElement>('img.store-item-card__image') ?? null;

  /** A sleeve takes its card's image only once it is drawn, reusing the exact image a visible card already shows. */
  function load(piece: Piece, width: number) {
    const img = piece.img;
    if (!img || piece.id === null || img.dataset.loaded !== undefined) return;
    const source = cardImageOf(piece.id);
    if (!source) return;
    img.dataset.loaded = '';
    if (source.complete && source.currentSrc) {
      img.src = source.currentSrc;
      return;
    }
    if (source.srcset) {
      img.sizes = px(Math.ceil(width * scale));
      img.srcset = source.srcset;
    }
    img.src = source.getAttribute('src') ?? '';
  }

  function write(piece: Piece, next: Written, opacity: number, shadeTransition: string) {
    const was = piece.written;
    const style = piece.el.style;
    if (was?.transition !== next.transition) style.transition = next.transition;
    if (was?.transform !== next.transform) style.transform = next.transform;
    if (was?.opacity !== next.opacity) {
      for (const face of piece.faces) face.style.opacity = next.opacity;
      style.visibility = opacity > 0 ? 'visible' : 'hidden';
    }
    if (was?.z !== next.z) style.zIndex = next.z;
    if (was?.pe !== next.pe) style.pointerEvents = next.pe;
    if (was?.shade !== next.shade) {
      for (const layer of piece.shades) {
        layer.style.transition = shadeTransition;
        layer.style.opacity = next.shade;
      }
    }
    if (was?.label !== next.label) {
      if (next.label) piece.el.setAttribute('aria-label', next.label);
      else piece.el.removeAttribute('aria-label');
    }
    if (was?.behind !== next.behind) piece.el.toggleAttribute('data-behind', next.behind);
    piece.written = next;
  }

  type Place = { readonly pose: Pose; readonly timing: Timing | null };

  /** Where each sleeve and the back board stand in a flip bin, and how they move there. */
  function flipPlaces(bin: FlipBin, g: FlipGeometry, focus: Focus | null): Place[] {
    const hand = state.hands[bin]!;
    const count = cat.shelves[bin].length;
    const motion = focus && focus.at !== 'tape' ? focus.motion : null;
    return Array.from({ length: count + 1 }, (_, k) => ({
      pose: flipPose(hand, motion, k, count, g),
      timing: motion ? flipTiming(hand, motion, k, count, g, cat.reduce) : null,
    }));
  }

  /** Where each tape stands in the rack, and how it moves there. */
  function rackPlaces(g: RackGeometry, focus: Focus | null): Place[] {
    const hand = state.hands.tape!;
    const count = cat.shelves.tape.length;
    const motion = focus && focus.at === 'tape' ? focus.motion : null;
    return Array.from({ length: count }, (_, k) => ({
      pose: rackPose(hand, motion, k, count, g),
      timing: motion ? rackTiming(hand, motion, k, g, cat.reduce) : null,
    }));
  }

  function renderBin(view: BinView, focused: boolean) {
    const bin = view.bin;
    const hand = state.hands[bin];
    if (!hand) return;
    const count = cat.shelves[bin].length;
    const slot = slotOf(hand, count);
    const focus = focused && state.mode.view === 'crate' ? state.mode.focus : null;
    const g = view.geometry;
    const places =
      g.mechanic === 'flip' && bin !== 'tape' ? flipPlaces(bin, g, focus) : rackPlaces(g as RackGeometry, focus);
    view.pieces.forEach((piece, k) => {
      const { pose, timing } = places[k]!;
      const opacity = focused ? pose.opacity : 0;
      // Sleeves that stay out of sight keep their last pose: writing them every frame would only cost style work.
      if (opacity === 0 && piece.written?.opacity === '0') return;
      const item = cat.items[piece.id!]!;
      const d = k - slot;
      const drawn = opacity > 0;
      if (drawn) load(piece, g.mechanic === 'flip' ? g.w : g.W);
      const front = d === 0 && hand.on !== 'backBoard';
      const label =
        g.mechanic === 'rack'
          ? front
            ? `${item.title} by ${item.artist}, pulled out`
            : `Pull out ${item.title} by ${item.artist}`
          : front
            ? `Lift out ${item.title} by ${item.artist}`
            : d === -1
              ? `Stand back up ${item.title} by ${item.artist}`
              : `Dig to ${item.title} by ${item.artist}`;
      const transition = transitionOf(timing, ['transform', 'opacity', 'visibility']);
      write(
        piece,
        {
          transform: transformOf(pose, g),
          transition,
          opacity: String(opacity),
          z: String(g.mechanic === 'rack' ? (front ? 50 : 10 + k) : d < 0 ? 130 + d : 100 - d),
          pe: drawn && (g.mechanic === 'rack' || d >= -1) ? 'auto' : 'none',
          shade: pose.shade.toFixed(3),
          label: drawn ? label : '',
          behind: g.mechanic === 'flip' && !hoverless && d > 0,
        },
        opacity,
        transitionOf(timing, ['opacity']),
      );
      const willChange = drawn ? 'transform, opacity' : 'auto';
      if (piece.el.style.willChange !== willChange) {
        piece.el.style.willChange = willChange;
        // Shades fade with every flip; their own layer keeps that off the artwork's paint.
        for (const layer of piece.shades) layer.style.willChange = drawn ? 'opacity' : 'auto';
      }
    });
    const boardPlace = places[count];
    if (view.board && boardPlace && g.mechanic === 'flip') {
      const opacity = focused ? boardPlace.pose.opacity : 0;
      const transition = transitionOf(boardPlace.timing, ['transform', 'opacity', 'visibility']);
      write(
        view.board,
        {
          transform: transformOf(boardPlace.pose, g),
          transition,
          opacity: String(opacity),
          z: String(100 - (count - slot)),
          pe: 'none',
          shade: boardPlace.pose.shade.toFixed(3),
          label: '',
          behind: false,
        },
        opacity,
        transitionOf(boardPlace.timing, ['opacity']),
      );
    }
  }

  function setHand(card: HTMLElement | null) {
    if (handCard === card) return;
    const hadFocus = handCard?.contains(document.activeElement) ?? false;
    handCard?.removeAttribute('data-store-crate-hand');
    handCard = card;
    card?.setAttribute('data-store-crate-hand', '');
    if (hadFocus) stage!.focus({ preventScroll: true });
  }

  function renderRail(bin: Bin, current: string) {
    if (railBin !== bin) {
      railBin = bin;
      const letters: string[] = [];
      for (const id of cat.shelves[bin]) {
        const letter = dividerOf(cat.items[id]!.artist);
        if (!letters.includes(letter)) letters.push(letter);
      }
      rail!.replaceChildren(
        ...letters.map((letter) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'store-crate-letter';
          button.dataset.letter = letter;
          button.textContent = letter;
          button.setAttribute('aria-label', `Artists under ${letter}`);
          return button;
        }),
      );
    }
    rail!.querySelectorAll<HTMLElement>('[data-letter]').forEach((button) => {
      button.setAttribute('aria-current', String(button.dataset.letter === current));
    });
  }

  function slotOfLetter(bin: Bin, letter: string) {
    return cat.shelves[bin].findIndex((id) => dividerOf(cat.items[id]!.artist) === letter);
  }

  function renderPanel() {
    if (state.mode.view !== 'crate') return;
    const bin = state.mode.focus.at;
    const shelf = cat.shelves[bin];
    const hand = state.hands[bin]!;
    const n = shelf.length;
    const atBoard = hand.on === 'backBoard';
    const id = atBoard ? null : itemInHand(state, cat, bin);
    const item = id === null ? null : cat.items[id]!;
    setHand(id === null ? null : (cards[id] ?? null));
    end!.hidden = !atBoard;
    const words = BIN_WORDS[bin];
    const letter = item ? dividerOf(item.artist) : '';
    renderRail(bin, letter);
    const slot = slotOf(hand, n);
    setText(counter, item ? `${String(slot + 1).padStart(2, '0')} / ${n}  ·  ${letter}` : `${n} / ${n}  ·  End`);
    root.querySelectorAll<HTMLElement>('[data-store-crate-restart]').forEach((button) => {
      if (button.closest('[data-store-crate-nav]')) button.hidden = slot === 0;
    });
    const previous = root.querySelector<HTMLButtonElement>('[data-store-crate-nav] [data-store-crate-previous]');
    const next = root.querySelector<HTMLButtonElement>('[data-store-crate-next]');
    const rack = MECHANIC[bin] === 'rack';
    if (previous) {
      previous.disabled = slot === 0;
      const before = shelf[slot - 1];
      previous.setAttribute(
        'aria-label',
        before === undefined ? 'Previous' : `${rack ? 'Pull out' : 'Stand back up'} ${cat.items[before]!.title}`,
      );
    }
    if (next) {
      next.disabled = rack ? slot === n - 1 : atBoard;
      const after = shelf[slot + 1];
      next.setAttribute(
        'aria-label',
        rack
          ? after === undefined
            ? 'Next'
            : `Pull out ${cat.items[after]!.title}`
          : item
            ? `Flip ${item.title} forward`
            : 'Next',
      );
    }
    setText(root.querySelector('[data-store-crate-end-title]'), `End of the ${words.bin}`);
    setText(
      root.querySelector('[data-store-crate-end-text]'),
      `All ${n} ${words.things} are flipped forward. Stand them back up to dig again, or lift the last one back.`,
    );
    setText(
      status,
      item
        ? `${item.artist}, ${item.title}. ${words.group}, ${slot + 1} of ${n} in the ${words.bin}.`
        : `End of the ${words.bin}. All ${n} ${words.things} flipped.`,
    );
    stage!.dataset.mechanic = MECHANIC[bin];
    stage!.setAttribute(
      'aria-label',
      rack
        ? 'Tape rack. Slide along the spines to pull a tape out. Arrow keys move along, a letter key jumps to that artist.'
        : `${words.group} ${words.bin}. Drag a sleeve down to flip it and up to lift it back. Arrow keys flip, Home stands it all back up, a letter key jumps to that artist.`,
    );
    root.querySelectorAll<HTMLElement>('[data-store-crate-bin-choice]').forEach((choice) => {
      choice.setAttribute('aria-pressed', String(choice.dataset.storeCrateBinChoice === bin));
    });
  }

  /** Each drag frame touches only the focused bin; walking, a new hand or a rebuilt stage also redraws the rest. */
  function render(prev: State, full = false) {
    if (state.mode.view !== 'crate') return;
    const at = state.mode.focus.at;
    const walked = full || prev.mode.view !== 'crate' || prev.mode.focus.at !== at;
    const moved = walked || prev.hands[at] !== state.hands[at];
    const focusIndex = BINS.indexOf(at);
    if (!built.has(at)) binView(at);
    built.forEach((view) => {
      const focused = view.bin === at;
      if (walked) {
        view.el.style.transform = `translateX(${(BINS.indexOf(view.bin) - focusIndex) * layout.step}px)`;
        view.el.style.opacity = focused ? '1' : '0';
        view.el.style.visibility = focused ? 'visible' : 'hidden';
        view.el.style.zIndex = focused ? '3' : '2';
      }
      if (focused || walked) renderBin(view, focused);
    });
    if (moved) renderPanel();
    // On Distro the format selection always equals the bin, so its format links highlight where you stand.
    if (walked && host.filterable) {
      const binFormat = cat.items[cat.shelves[at][0]!]!.formatKey;
      if (host.format() !== binFormat) host.setFormat(binFormat);
    }
  }

  // ---- State --------------------------------------------------------------------------------------------------
  // Browsers limit how often a page may rewrite history, so the place is recorded once digging pauses, and at once
  // when the shopper presses anything inside the Crate, such as the item link that leaves the page.
  let recordTimer = 0;
  function writeRecord() {
    clearTimeout(recordTimer);
    recordTimer = 0;
    const record = recordOf(state, cat);
    const serialised = JSON.stringify(record);
    if (serialised === recorded) return;
    recorded = serialised;
    const current = (history.state ?? {}) as Record<string, unknown>;
    history.replaceState({ ...current, storeCrate: record }, '');
  }
  function remember() {
    clearTimeout(recordTimer);
    recordTimer = window.setTimeout(writeRecord, 400);
  }
  const flushRecord = () => {
    if (recordTimer) writeRecord();
  };

  function schedule() {
    clearTimeout(timer);
    const next = followUp(state);
    if (next) timer = window.setTimeout(() => dispatch(next.intent), next.after);
  }

  function dispatch(intent: Intent) {
    const next = reduce(state, intent, cat);
    if (next === state) return;
    const prev = state;
    state = next;
    render(prev);
    schedule();
    remember();
    if (!taught && hoverless && landed(prev, next)) {
      taught = true;
      dispatch({ type: 'lean', lean: 'hint' });
    }
  }

  function pick(bin: Bin, k: number) {
    if (finger.wasDrag() || state.mode.view !== 'crate' || state.mode.focus.at !== bin) return;
    const hand = state.hands[bin];
    const front = hand && hand.on !== 'backBoard' && hand.index === k;
    dispatch(front ? { type: 'lift' } : { type: 'digTo', slot: k });
  }

  function enter(bin: Bin, k: number, event: PointerEvent) {
    if (hoverless || MECHANIC[bin] !== 'flip' || event.pointerType !== 'mouse' || finger.active()) return;
    if (state.mode.view !== 'crate' || state.mode.focus.at !== bin) return;
    const hand = state.hands[bin];
    if (!hand || hand.on === 'tape') return;
    const slot = slotOf(hand, cat.shelves[bin].length);
    if (k === slot) dispatch({ type: 'lean', lean: 'front' });
    else if (k === slot - 1) dispatch({ type: 'lean', lean: 'pile' });
  }

  // ---- Grid and Crate -----------------------------------------------------------------------------------------
  const visibleIds = () =>
    cards.flatMap((card, id) => (card.hidden || card.hasAttribute('data-distro-search-hidden') ? [] : [id]));
  const frameOf = (id: ItemId) => cards[id]?.querySelector<HTMLElement>('.store-item-card__image-frame') ?? null;

  /** The visible cards whose artwork centre is on screen below the sticky bar, found by binary search over rows. */
  function onScreen(ids: readonly ItemId[]): ItemId[] {
    const bar = root.querySelector('[data-store-crate-bar]')?.getBoundingClientRect();
    const top = Math.max(readRootScrollPaddingTop(), bar?.bottom ?? 0);
    const bottom = window.innerHeight;
    const centre = (id: ItemId) => {
      const rect = (frameOf(id) ?? cards[id]!).getBoundingClientRect();
      return rect.top + rect.height / 2;
    };
    let low = 0;
    let high = ids.length;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (centre(ids[mid]!) < top) low = mid + 1;
      else high = mid;
    }
    const shown: ItemId[] = [];
    for (let i = low; i < ids.length && shown.length < 24; i += 1) {
      const y = centre(ids[i]!);
      if (y > bottom) break;
      shown.push(ids[i]!);
    }
    return shown;
  }

  // Every flight lands within ARRIVE_MS, so a timeline paused in a background tab never leaves the switch ignored.
  function settle(animations: Animation[]) {
    flying = animations;
    root.removeAttribute('data-store-crate-settled');
    const done = () => {
      if (flying !== animations) return;
      flying = [];
      root.setAttribute('data-store-crate-settled', '');
    };
    if (animations.length === 0) return done();
    void Promise.allSettled(animations.map((animation) => animation.finished)).then(done);
    window.setTimeout(done, ARRIVE_MS + 200);
  }

  function enterLayout() {
    root.dataset.storeCrate = 'open';
    desk!.hidden = false;
    nav!.hidden = false;
    root.querySelector('[data-store-crate-grid]')?.setAttribute('aria-pressed', 'false');
    root.querySelector('[data-store-crate-open]')?.setAttribute('aria-pressed', 'true');
    sizeStage();
    if (!resize) {
      resize = new ResizeObserver(() => {
        const was = layout;
        sizeStage();
        if (was !== layout && state.mode.view === 'crate') render(state, true);
      });
      resize.observe(desk!);
    }
    stage!.addEventListener('wheel', onWheel, { passive: false });
  }

  function leaveLayout() {
    root.dataset.storeCrate = 'grid';
    desk!.hidden = true;
    nav!.hidden = true;
    end!.hidden = true;
    setHand(null);
    root.querySelector('[data-store-crate-grid]')?.setAttribute('aria-pressed', 'true');
    root.querySelector('[data-store-crate-open]')?.setAttribute('aria-pressed', 'false');
    resize?.disconnect();
    resize = null;
    stage!.removeEventListener('wheel', onWheel);
    wheelState = restingWheelGesture();
  }

  /** Covers on screen fly from their cards into the bin, back first and the item in hand last. */
  function flyIn(from: ReadonlyMap<ItemId, DOMRect>) {
    if (cat.reduce || state.mode.view !== 'crate') return settle([]);
    const bin = state.mode.focus.at;
    const view = built.get(bin)!;
    const hand = state.hands[bin]!;
    const slot = slotOf(hand, cat.shelves[bin].length);
    const box = stage!.getBoundingClientRect();
    const local = (rect: DOMRect): Box => ({
      left: (rect.left - box.left) / scale,
      top: (rect.top - box.top) / scale,
      width: rect.width / scale,
      height: rect.height / scale,
    });
    const animations: Animation[] = [];
    const flown = view.pieces.filter((piece) => piece.written?.opacity !== '0' && from.has(piece.id!));
    const last = Math.max(0, ...flown.map((piece) => view.pieces.indexOf(piece) - slot));
    view.pieces.forEach((piece, k) => {
      if (!piece.written || piece.written.opacity === '0') return;
      const rect = from.get(piece.id!);
      const d = k - slot;
      if (rect) {
        const start = transformOf(flightPose(local(rect), view.rest), view.geometry);
        animations.push(
          piece.el.animate([{ transform: start }, { transform: piece.written.transform }], {
            duration: 520,
            delay: 60 + (last - d) * 24,
            easing: EASE,
            fill: 'backwards',
          }),
        );
        for (const layer of piece.shades) {
          animations.push(
            layer.animate([{ opacity: 0 }, { opacity: Number(piece.written.shade) }], {
              duration: 520,
              delay: 60 + (last - d) * 24,
              easing: EASE,
              fill: 'backwards',
            }),
          );
        }
      } else {
        for (const face of piece.faces) {
          animations.push(
            face.animate([{ opacity: 0 }, { opacity: Number(piece.written.opacity) }], {
              duration: 240,
              delay: 280,
              easing: EASE,
              fill: 'backwards',
            }),
          );
        }
      }
    });
    for (const el of [
      ...view.chrome,
      ...(view.board ? [view.board.el] : []),
      desk!.querySelector<HTMLElement>('[data-store-crate-rail]'),
      nav!,
    ]) {
      if (el)
        animations.push(
          el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, delay: 220, easing: EASE, fill: 'backwards' }),
        );
    }
    settle(animations);
  }

  /** Covers fly back from the bin into their cards, the item in hand first and its neighbours after. */
  function flyOut(from: ReadonlyMap<ItemId, DOMRect>, held: ItemId | null) {
    if (cat.reduce) return settle([]);
    const animations: Animation[] = [];
    const ids = visibleIds();
    const heldAt = held === null ? 0 : ids.indexOf(held);
    from.forEach((rect, id) => {
      const frame = frameOf(id);
      const target = frame?.getBoundingClientRect();
      if (!frame || !target || target.width === 0 || target.bottom < 0 || target.top > window.innerHeight) return;
      const s = rect.width / target.width;
      const delay = 40 + Math.abs(ids.indexOf(id) - heldAt) * 24;
      animations.push(
        frame.animate(
          [
            {
              transformOrigin: '0 0',
              transform: `translate(${rect.left - target.left}px, ${rect.top - target.top}px) scale(${s})`,
            },
            { transformOrigin: '0 0', transform: 'none' },
          ],
          { duration: 440, delay, easing: EASE, fill: 'backwards' },
        ),
      );
      const content = cards[id]?.querySelector<HTMLElement>('.store-item-card__content');
      if (content)
        animations.push(
          content.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: 200,
            delay: delay + 280,
            easing: EASE,
            fill: 'backwards',
          }),
        );
    });
    settle(animations);
  }

  // A switch press while covers are still flying lands them at once and then switches, so it is never lost.
  function land() {
    flying.forEach((animation) => animation.cancel());
    flying = [];
  }

  function open() {
    land();
    if (state.mode.view === 'crate') return;
    const ids = visibleIds();
    const shown = onScreen(ids);
    const rects = new Map<ItemId, DOMRect>();
    for (const id of shown) {
      const frame = frameOf(id);
      if (frame) rects.set(id, frame.getBoundingClientRect());
    }
    const next = reduce(state, { type: 'openCrate', grid: ids, onScreen: shown, format: host.format() }, cat);
    if (next === state) return;
    const prev = state;
    state = next;
    enterLayout();
    render(prev);
    // The flight starts from where the cards were, so the stage must be in place before it is measured: an
    // instant scroll, never the page's smooth one.
    const deskTop = desk!.getBoundingClientRect().top;
    const headerBottom = readRootScrollPaddingTop();
    if (deskTop < headerBottom || deskTop > window.innerHeight * 0.4) {
      window.scrollTo({ top: window.scrollY + deskTop - headerBottom, behavior: 'instant' as ScrollBehavior });
    }
    flyIn(rects);
    schedule();
    remember();
    stage!.focus({ preventScroll: true });
  }

  function close(to: string | null = null) {
    land();
    if (state.mode.view !== 'crate') return;
    const bin = state.mode.focus.at;
    const view = built.get(bin);
    const rects = new Map<ItemId, DOMRect>();
    view?.pieces.forEach((piece) => {
      if (piece.written && piece.written.opacity !== '0' && piece.id !== null)
        rects.set(piece.id, piece.el.getBoundingClientRect());
    });
    const format = formatAfterCrate(state, cat, to);
    state = reduce(state, { type: 'closeCrate' }, cat);
    clearTimeout(timer);
    leaveLayout();
    host.setFormat(format);
    const held = state.mode.view === 'grid' ? state.mode.held : null;
    const heldCard = held === null ? null : cards[held];
    if (heldCard && !heldCard.hasAttribute('data-distro-search-hidden')) {
      heldCard.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' as ScrollBehavior });
      flyOut(rects, held);
      heldCard.querySelector<HTMLElement>('.prose-card-link')?.focus({ preventScroll: true });
    } else settle([]);
    remember();
  }

  function choose(formatKey: string) {
    if (state.mode.view !== 'crate') return;
    const bin = BINS.find(
      (candidate) => cat.bins.includes(candidate) && cat.items[cat.shelves[candidate][0]!]?.formatKey === formatKey,
    );
    if (bin) dispatch({ type: 'chooseBin', bin });
    else close(formatKey);
  }

  // ---- Input --------------------------------------------------------------------------------------------------
  function onWheel(event: WheelEvent) {
    if (state.mode.view !== 'crate') return;
    const delta = crateWheelDelta(event, stage!.clientWidth);
    if (delta === null) return;
    event.preventDefault();
    const result = advanceWheelGesture(wheelState, delta, event.timeStamp);
    wheelState = result.state;
    if (result.move) dispatch({ type: 'flip', by: result.move });
  }

  listen(root, 'pointerdown', flushRecord, { capture: true });
  listen(root, 'keydown', flushRecord, { capture: true });
  listen(stage, 'pointerdown', (event) => finger.down(event));
  listen(stage, 'pointermove', (event) => finger.move(event));
  listen(stage, 'pointerup', () => finger.up());
  listen(stage, 'pointercancel', () => finger.cancel());
  listen(stage, 'pointerleave', () => {
    wheelState = restingWheelGesture();
  });
  listen(stage, 'keydown', (event) => {
    if (state.mode.view !== 'crate') return;
    const bin = state.mode.focus.at;
    const intent = keyIntent(event, cat.shelves[bin].length - 1, (letter) => slotOfLetter(bin, letter));
    if (!intent) return;
    event.preventDefault();
    dispatch(intent);
  });
  listen(rail, 'click', (event) => {
    const letter =
      event.target instanceof Element ? event.target.closest<HTMLElement>('[data-letter]')?.dataset.letter : undefined;
    if (!letter || state.mode.view !== 'crate') return;
    const slot = slotOfLetter(state.mode.focus.at, letter);
    if (slot >= 0) dispatch({ type: 'digTo', slot });
  });
  for (const button of root.querySelectorAll<HTMLElement>('[data-store-crate-restart]'))
    listen(button, 'click', () => dispatch({ type: 'digTo', slot: 0 }));
  for (const button of root.querySelectorAll<HTMLElement>('[data-store-crate-previous]'))
    listen(button, 'click', () => dispatch({ type: 'flip', by: -1 }));
  for (const button of root.querySelectorAll<HTMLElement>('[data-store-crate-next]'))
    listen(button, 'click', () => dispatch({ type: 'flip', by: 1 }));
  for (const choice of root.querySelectorAll<HTMLElement>('[data-store-crate-bin-choice]')) {
    listen(choice, 'click', () => {
      const bin = choice.dataset.storeCrateBinChoice as Bin;
      if (state.mode.view === 'crate') dispatch({ type: 'chooseBin', bin });
    });
  }
  const onMotion = () => {
    cat = { ...cat, reduce: motion.matches };
  };
  motion.addEventListener('change', onMotion);
  disposers.push(() => motion.removeEventListener('change', onMotion));

  // Back from an item page reopens the Crate where it was, still and without the fly-in.
  if (options.restore) {
    const record = readRecord((history.state as { storeCrate?: unknown } | null)?.storeCrate);
    const restored = record ? restoreState(record, cat) : null;
    if (restored) {
      const prev = state;
      state = restored;
      enterLayout();
      render(prev);
      recorded = JSON.stringify(recordOf(state, cat));
      root.setAttribute('data-store-crate-settled', '');
    }
  }

  return {
    get isOpen() {
      return state.mode.view === 'crate';
    },
    get formatKey() {
      return state.mode.view === 'crate' ? (cat.items[cat.shelves[state.mode.focus.at][0]!]?.formatKey ?? null) : null;
    },
    open,
    choose,
    close: () => close(null),
    destroy() {
      // Never write history here: the shell has already moved to the next page's entry.
      clearTimeout(recordTimer);
      clearTimeout(timer);
      land();
      finger.dispose();
      disposers.forEach((dispose) => dispose());
      if (state.mode.view === 'crate') leaveLayout();
      built.forEach((view) => view.el.remove());
      built = new Map();
      space?.remove();
      space = null;
      rail.replaceChildren();
      railBin = null;
      root.removeAttribute('data-store-crate-settled');
    },
  };
}
