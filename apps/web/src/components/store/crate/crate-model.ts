/**
 * The Store Crate in the shop's own words. Each format with enough items has a bin: Vinyl 12-inch and CDs flip,
 * tapes stand spine-out in a rack. Every input becomes an Intent, one pure reducer owns the State, and the types keep
 * impossible states out: a rack never holds a tipped sleeve, a hand never stands past the back board, and the Crate
 * never stands at a format without a bin.
 */
import { BINS, type Bin } from './crate-bins';

/** A Store Item's position in its collection, in page order. */
export type ItemId = number;

export type FlipBin = 'vinyl' | 'cd';
export type RackBin = 'tape';
export type Mechanic = 'flip' | 'rack';
export const MECHANIC: Readonly<Record<Bin, Mechanic>> = { vinyl: 'flip', cd: 'flip', tape: 'rack' };

export interface CrateItem {
  readonly slug: string;
  readonly artist: string;
  readonly title: string;
  /** The Grid filter that shows this item, or 'all' on collections without format filtering. */
  readonly formatKey: string;
  readonly bin: Bin | null;
}

/** Only `catalogOf` makes one, so `bins` lists exactly the bins the Crate can stand at. */
export interface Catalog {
  readonly items: readonly CrateItem[];
  readonly shelves: Readonly<Record<Bin, readonly ItemId[]>>;
  readonly bins: readonly Bin[];
  readonly reduce: boolean;
}

declare const tipBrand: unique symbol;
declare const reachBrand: unique symbol;
/** How far the held sleeve is tipped: -1 stands the top of the pile back up, 1 lays it on the pile. */
export type Tip = number & { readonly [tipBrand]: true };
/** How many spines a finger has slid along the rack. */
export type Reach = number & { readonly [reachBrand]: true };

/** A flip bin's hand is on a sleeve, or at the back board once every sleeve is flipped forward. */
export type FlipHand = { readonly on: 'sleeve'; readonly index: number } | { readonly on: 'backBoard' };
/** The rack's hand is always on a tape: the one pulled out to face you. */
export type RackHand = { readonly on: 'tape'; readonly index: number };
/** Every bin is where you left it; only bins that exist have a hand. */
export type Hands = { readonly vinyl?: FlipHand; readonly cd?: FlipHand; readonly tape?: RackHand };

export type Lean = 'none' | 'front' | 'pile' | 'lifted' | 'hint';

/** One motion at a time, and only the kinds its mechanic has. A dropping sleeve has left the finger for the pile. */
export type FlipMotion =
  | { readonly kind: 'arriving' }
  | { readonly kind: 'still'; readonly lean: Lean }
  | { readonly kind: 'held'; readonly tip: Tip }
  | { readonly kind: 'dropping' }
  | { readonly kind: 'settling'; readonly dir: -1 | 0 | 1 }
  | { readonly kind: 'riffling'; readonly from: number; readonly to: number };
export type RackMotion =
  | { readonly kind: 'arriving' }
  | { readonly kind: 'still' }
  | { readonly kind: 'held'; readonly reach: Reach }
  | { readonly kind: 'settling'; readonly dir: -1 | 0 | 1 };

/** The bin you are standing at, with its own kind of motion. */
export type Focus =
  { readonly at: FlipBin; readonly motion: FlipMotion } | { readonly at: RackBin; readonly motion: RackMotion };

/** `held` is the card the Grid is on: the one you came back from the Crate with, while it stays on screen. */
export type GridMode = { readonly view: 'grid'; readonly held: ItemId | null };
/** `returnTo` is the Grid filter the Crate was opened from. */
export type CrateMode = { readonly view: 'crate'; readonly focus: Focus; readonly returnTo: string };
export type State = { readonly hands: Hands; readonly mode: GridMode | CrateMode };

/** Slots in a flip bin run 0 to count; slot count is the back board. */
export type Intent =
  | { readonly type: 'tip'; readonly tip: number }
  | { readonly type: 'drop' }
  | { readonly type: 'letGo'; readonly speed: number }
  | { readonly type: 'cancel' }
  | { readonly type: 'flip'; readonly by: -1 | 1 }
  | { readonly type: 'digTo'; readonly slot: number }
  | { readonly type: 'lean'; readonly lean: Exclude<Lean, 'lifted'> }
  | { readonly type: 'lift' }
  | {
      readonly type: 'openCrate';
      /** The Grid's visible items, in order. */
      readonly grid: readonly ItemId[];
      /** The visible items whose artwork is on screen, in order. */
      readonly onScreen: readonly ItemId[];
      /** The Grid filter the Crate opens from. */
      readonly format: string;
    }
  | { readonly type: 'chooseBin'; readonly bin: Bin }
  | { readonly type: 'closeCrate' }
  | { readonly type: 'settled' };

/** A dropped sleeve lands, and the bin settles under it, within this many milliseconds. */
export const DROP_MS = 260;
/** Covers on screen have landed in their bin by this many milliseconds after the Crate opens. */
export const ARRIVE_MS = 800;
/** A long dig riffles at most this many sleeves past the hand: the first ones in reach and the last before the target. */
export const RIFFLE_MAX = 8;
/** A riffled sleeve falls onto the pile, the pile gives under it, and the stack steps up into the hand at the end. */
export const RIFFLE_FALL_MS = 260;
export const RIFFLE_SETTLE_MS = 110;
export const RIFFLE_ARRIVE_MS = 340;

/**
 * When each of `n` riffled sleeves leaves the hand, slowing into the target. A dig back plays its plan reversed, so
 * its gaps shrink along the plan instead.
 */
export function riffleStarts(n: number, dir: -1 | 1): number[] {
  const starts = [0];
  for (let j = 1; j < n; j += 1) {
    const r = n > 2 ? (dir > 0 ? j - 1 : n - 1 - j) / (n - 2) : 0;
    starts.push(starts[j - 1]! + 36 + 54 * r * r);
  }
  return starts;
}

export const riffleMs = (n: number, dir: -1 | 1) =>
  riffleStarts(n, dir)[n - 1]! + Math.max(RIFFLE_FALL_MS + RIFFLE_SETTLE_MS, RIFFLE_ARRIVE_MS);

const FLIP_STILL: FlipMotion = { kind: 'still', lean: 'none' };
const RACK_STILL: RackMotion = { kind: 'still' };

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const isFlip = (bin: Bin): bin is FlipBin => MECHANIC[bin] === 'flip';

export const flipHandAt = (slot: number, count: number): FlipHand =>
  slot >= count ? { on: 'backBoard' } : { on: 'sleeve', index: Math.max(0, slot) };
export const rackHandAt = (index: number, count: number): RackHand => ({
  on: 'tape',
  index: clamp(index, 0, count - 1),
});
export const slotOf = (hand: FlipHand | RackHand, count: number) => (hand.on === 'backBoard' ? count : hand.index);

/** Nothing to lift before the first sleeve and nothing to flip past the back board. */
export const tipOf = (value: number, slot: number, count: number) =>
  clamp(value, slot === 0 ? -0.06 : -1, slot === count ? 0 : 1) as Tip;
/** A finger can only slide as far as the rack has tapes. */
export const reachOf = (value: number, index: number, count: number) =>
  clamp(value, -index, count - 1 - index) as Reach;

const still = (bin: Bin): Focus => (isFlip(bin) ? { at: bin, motion: FLIP_STILL } : { at: bin, motion: RACK_STILL });
const arriving = (bin: Bin, reduce: boolean): Focus =>
  reduce
    ? still(bin)
    : isFlip(bin)
      ? { at: bin, motion: { kind: 'arriving' } }
      : { at: bin, motion: { kind: 'arriving' } };

/** The items a collection shows, in page order; a bin opens only for a format with at least `binFrom` items. */
export function catalogOf(items: readonly CrateItem[], openBins: readonly Bin[], reduce: boolean): Catalog {
  const shelves: Record<Bin, ItemId[]> = { vinyl: [], cd: [], tape: [] };
  items.forEach((item, id) => {
    if (item.bin) shelves[item.bin].push(id);
  });
  return { items, shelves, bins: BINS.filter((bin) => openBins.includes(bin) && shelves[bin].length > 0), reduce };
}

export function initialState(cat: Catalog): State {
  const hands: { vinyl?: FlipHand; cd?: FlipHand; tape?: RackHand } = {};
  for (const bin of cat.bins) {
    if (bin === 'tape') hands.tape = rackHandAt(0, cat.shelves.tape.length);
    else hands[bin] = flipHandAt(0, cat.shelves[bin].length);
  }
  return { hands, mode: { view: 'grid', held: null } };
}

const hasBin = (cat: Catalog, id: ItemId) => {
  const bin = cat.items[id]?.bin;
  return bin !== undefined && bin !== null && cat.bins.includes(bin);
};

/**
 * The item the Crate puts in your hand: the card the Grid is on while it stays on screen and has a bin, otherwise
 * the first card on screen with a bin, then the next one down, then the nearest one above. Null when the Grid holds
 * nothing with a bin.
 */
export function crateTarget(
  held: ItemId | null,
  grid: readonly ItemId[],
  onScreen: readonly ItemId[],
  cat: Catalog,
  /** Prefer this bin; the item you brought back from the Crate still wins while it is on screen. */
  prefer?: Bin,
): ItemId | null {
  if (held !== null && onScreen.includes(held) && hasBin(cat, held)) return held;
  const fits = (id: ItemId) => hasBin(cat, id) && (!prefer || cat.items[id]!.bin === prefer);
  const shown = onScreen.find(fits);
  if (shown !== undefined) return shown;
  const top = onScreen.length > 0 ? Math.max(0, grid.indexOf(onScreen[0]!)) : 0;
  const after = grid.slice(top).find(fits);
  if (after !== undefined) return after;
  const before = grid.slice(0, top).reverse().find(fits);
  return before ?? (prefer ? crateTarget(null, grid, onScreen, cat) : null);
}

/** The item in hand: the sleeve or tape the hand is on, or the last sleeve when the hand is at the back board. */
export function itemInHand(state: State, cat: Catalog, bin: Bin): ItemId | null {
  const hand = state.hands[bin];
  const shelf = cat.shelves[bin];
  if (!hand || shelf.length === 0) return null;
  return shelf[Math.min(slotOf(hand, shelf.length), shelf.length - 1)] ?? null;
}

/**
 * The Grid filter to show on leaving the Crate: the filter it was opened from when that shows the item in hand,
 * otherwise the item's own format. `to` overrides both, for All formats or a format without a bin.
 */
export function formatAfterCrate(state: State, cat: Catalog, to: string | null): string {
  if (to !== null) return to;
  if (state.mode.view !== 'crate') return 'all';
  const id = itemInHand(state, cat, state.mode.focus.at);
  const item = id === null ? undefined : cat.items[id];
  const returnTo = state.mode.returnTo;
  return !item || returnTo === 'all' || item.formatKey === returnTo ? returnTo : item.formatKey;
}

// Past a third of the way or a quick flick turns one sleeve. A drag never turns more than one.
const commitStep = (progress: number, speed: number): -1 | 0 | 1 =>
  progress > 0.3 || speed > 500 ? 1 : progress < -0.3 || speed < -500 ? -1 : 0;

type FlipStep = { readonly hand: FlipHand; readonly motion: FlipMotion };
type RackStep = { readonly hand: RackHand; readonly motion: RackMotion };

// Moving a flip bin's hand: one sleeve settles, a dig past more riffles them in one planned motion.
function flipTo(hand: FlipHand, motion: FlipMotion, target: number, count: number, reduce: boolean): FlipStep {
  const from = slotOf(hand, count);
  const to = clamp(target, 0, count);
  if (to === from) return motion.kind === 'held' ? { hand, motion: { kind: 'settling', dir: 0 } } : { hand, motion };
  const dir = to > from ? 1 : -1;
  if (reduce || Math.abs(to - from) === 1) return { hand: flipHandAt(to, count), motion: { kind: 'settling', dir } };
  return { hand: flipHandAt(to, count), motion: { kind: 'riffling', from, to } };
}

function flipReduce(hand: FlipHand, motion: FlipMotion, intent: Intent, count: number, reduce: boolean): FlipStep {
  const slot = slotOf(hand, count);
  const same = { hand, motion };
  switch (intent.type) {
    case 'tip':
      return { hand, motion: { kind: 'held', tip: tipOf(intent.tip, slot, count) } };
    case 'drop':
      // Past its tipping point a sleeve leaves the finger and falls onto the pile; the hand moves on.
      if (hand.on !== 'sleeve') return same;
      return { hand: flipHandAt(slot + 1, count), motion: reduce ? FLIP_STILL : { kind: 'dropping' } };
    case 'letGo': {
      if (motion.kind !== 'held') return same;
      const by = commitStep(motion.tip, intent.speed);
      return by ? flipTo(hand, motion, slot + by, count, reduce) : { hand, motion: { kind: 'settling', dir: 0 } };
    }
    case 'cancel':
      return motion.kind === 'held' ? { hand, motion: { kind: 'settling', dir: 0 } } : same;
    case 'flip':
      return flipTo(hand, motion, slot + intent.by, count, reduce);
    case 'digTo':
      return flipTo(hand, motion, intent.slot, count, reduce);
    case 'lean': {
      if (motion.kind === 'still' && motion.lean === intent.lean) return same;
      // A pointer or the hint never overrides a lifted or moving sleeve, and only leans on what is there.
      const free = motion.kind === 'settling' || (motion.kind === 'still' && motion.lean !== 'lifted');
      const fits = intent.lean === 'none' || (intent.lean === 'pile' ? slot > 0 : hand.on === 'sleeve');
      return free && fits ? { hand, motion: { kind: 'still', lean: intent.lean } } : same;
    }
    case 'lift':
      if (hand.on !== 'sleeve' || !(motion.kind === 'still' || motion.kind === 'settling')) return same;
      return {
        hand,
        motion: { kind: 'still', lean: motion.kind === 'still' && motion.lean === 'lifted' ? 'none' : 'lifted' },
      };
    case 'settled':
      return motion.kind === 'arriving' ||
        motion.kind === 'dropping' ||
        motion.kind === 'settling' ||
        motion.kind === 'riffling'
        ? { hand, motion: FLIP_STILL }
        : same;
    default:
      return same;
  }
}

function rackReduce(hand: RackHand, motion: RackMotion, intent: Intent, count: number): RackStep {
  const same = { hand, motion };
  // Pulling another tape out puts the one in hand back in its slot.
  const pull = (index: number): RackStep => {
    const to = clamp(index, 0, count - 1);
    if (to === hand.index && motion.kind !== 'held') return same;
    return { hand: rackHandAt(to, count), motion: { kind: 'settling', dir: Math.sign(to - hand.index) as -1 | 0 | 1 } };
  };
  switch (intent.type) {
    case 'tip':
      return { hand, motion: { kind: 'held', reach: reachOf(intent.tip, hand.index, count) } };
    case 'letGo': {
      if (motion.kind !== 'held') return same;
      const flick = Math.abs(intent.speed) > 600 ? Math.sign(intent.speed) : 0;
      return pull(hand.index + Math.round(motion.reach) + flick);
    }
    case 'cancel':
      return motion.kind === 'held' ? { hand, motion: { kind: 'settling', dir: 0 } } : same;
    case 'flip':
      return pull(hand.index + intent.by);
    case 'digTo':
      return pull(intent.slot);
    case 'settled':
      return motion.kind === 'arriving' || motion.kind === 'settling' ? { hand, motion: RACK_STILL } : same;
    default:
      return same;
  }
}

function openCrate(state: State, cat: Catalog, intent: Extract<Intent, { type: 'openCrate' }>): State {
  const held = state.mode.view === 'grid' ? state.mode.held : null;
  // With no format chosen the Crate opens at the records, unless the Grid is on the item you brought back.
  const records = intent.format === 'all' && cat.bins.includes('vinyl');
  const id = crateTarget(held, intent.grid, intent.onScreen, cat, records ? 'vinyl' : undefined);
  const bin = id === null ? null : cat.items[id]?.bin;
  if (id === null || !bin) return state;
  const shelf = cat.shelves[bin];
  const index = shelf.indexOf(id);
  const hands =
    bin === 'tape'
      ? { ...state.hands, tape: rackHandAt(index, shelf.length) }
      : { ...state.hands, [bin]: flipHandAt(index, shelf.length) };
  return { hands, mode: { view: 'crate', focus: arriving(bin, cat.reduce), returnTo: intent.format } };
}

/** Returns the same object when nothing changes, so a view can skip work by identity. */
export function reduce(state: State, intent: Intent, cat: Catalog): State {
  const mode = state.mode;
  if (intent.type === 'openCrate') return mode.view === 'grid' ? openCrate(state, cat, intent) : state;
  if (mode.view === 'grid') return state;
  if (intent.type === 'closeCrate') {
    return { hands: state.hands, mode: { view: 'grid', held: itemInHand(state, cat, mode.focus.at) } };
  }
  if (intent.type === 'chooseBin') {
    if (intent.bin === mode.focus.at || !cat.bins.includes(intent.bin)) return state;
    return { hands: state.hands, mode: { view: 'crate', focus: still(intent.bin), returnTo: mode.returnTo } };
  }
  const focus = mode.focus;
  const count = cat.shelves[focus.at].length;
  if (focus.at === 'tape') {
    const hand = state.hands.tape;
    if (!hand) return state;
    const next = rackReduce(hand, focus.motion, intent, count);
    if (next.hand === hand && next.motion === focus.motion) return state;
    return {
      hands: { ...state.hands, tape: next.hand },
      mode: { view: 'crate', focus: { at: 'tape', motion: next.motion }, returnTo: mode.returnTo },
    };
  }
  const hand = state.hands[focus.at];
  if (!hand) return state;
  const next = flipReduce(hand, focus.motion, intent, count, cat.reduce);
  if (next.hand === hand && next.motion === focus.motion) return state;
  return {
    hands: { ...state.hands, [focus.at]: next.hand },
    mode: { view: 'crate', focus: { at: focus.at, motion: next.motion }, returnTo: mode.returnTo },
  };
}

/** The single timed follow-up a state asks for: the end of a motion, or of the hint. */
export function followUp(state: State): { readonly intent: Intent; readonly after: number } | null {
  if (state.mode.view === 'grid') return null;
  const motion = state.mode.focus.motion;
  switch (motion.kind) {
    case 'riffling':
      return {
        intent: { type: 'settled' },
        after: riffleMs(Math.min(Math.abs(motion.to - motion.from), RIFFLE_MAX), motion.to > motion.from ? 1 : -1),
      };
    case 'arriving':
      return { intent: { type: 'settled' }, after: ARRIVE_MS };
    case 'dropping':
      return { intent: { type: 'settled' }, after: DROP_MS };
    case 'settling':
      return { intent: { type: 'settled' }, after: 900 };
    case 'still':
      return 'lean' in motion && motion.lean === 'hint' ? { intent: { type: 'lean', lean: 'none' }, after: 380 } : null;
    default:
      return null;
  }
}

/** True when a flip bin has just finished opening: the moment to show, once, that a sleeve can be pulled. */
export const landed = (prev: State, next: State) =>
  prev.mode.view === 'crate' &&
  prev.mode.focus.motion.kind === 'arriving' &&
  next.mode.view === 'crate' &&
  next.mode.focus.motion.kind === 'still' &&
  MECHANIC[next.mode.focus.at] === 'flip';

/** What the history entry keeps so Back can reopen the Crate where it was: Store Item slugs, never positions. */
export type CrateRecord = {
  readonly bin: Bin;
  readonly returnTo: string;
  readonly hands: Readonly<Partial<Record<Bin, string | 'backBoard'>>>;
};

export function recordOf(state: State, cat: Catalog): CrateRecord | null {
  if (state.mode.view !== 'crate') return null;
  const hands: Partial<Record<Bin, string | 'backBoard'>> = {};
  for (const bin of cat.bins) {
    const hand = state.hands[bin];
    if (!hand) continue;
    const id = hand.on === 'backBoard' ? null : cat.shelves[bin][hand.index];
    hands[bin] = id === null || id === undefined ? 'backBoard' : cat.items[id]!.slug;
  }
  return { bin: state.mode.focus.at, returnTo: state.mode.returnTo, hands };
}

/** Reopens a recorded Crate, still and without the fly-in. Null when its bin no longer exists. */
export function restoreState(record: CrateRecord, cat: Catalog): State | null {
  if (!cat.bins.includes(record.bin)) return null;
  const base = initialState(cat);
  const hands: { vinyl?: FlipHand; cd?: FlipHand; tape?: RackHand } = { ...base.hands };
  for (const bin of cat.bins) {
    const kept = record.hands[bin];
    const shelf = cat.shelves[bin];
    const index =
      kept === undefined || kept === 'backBoard' ? -1 : shelf.findIndex((id) => cat.items[id]!.slug === kept);
    if (bin === 'tape') hands.tape = rackHandAt(Math.max(0, index), shelf.length);
    else hands[bin] = kept === 'backBoard' ? { on: 'backBoard' } : flipHandAt(Math.max(0, index), shelf.length);
  }
  return { hands, mode: { view: 'crate', focus: still(record.bin), returnTo: record.returnTo } };
}
