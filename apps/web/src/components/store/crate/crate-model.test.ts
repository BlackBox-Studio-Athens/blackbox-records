import { describe, expect, it } from 'vitest';
import { binOfFormatGroup, CRATE_BIN_FROM, openBinsOf, type Bin } from './crate-bins';
import {
  catalogOf,
  crateTarget,
  followUp,
  formatAfterCrate,
  initialState,
  itemInHand,
  landed,
  recordOf,
  reduce,
  restoreState,
  type Catalog,
  type CrateItem,
  type Intent,
  type State,
} from './crate-model';

const VINYL = 'distro-group-vinyl-12-inch';
const CDS = 'distro-group-cds';
const TAPES = 'distro-group-tapes';
const SEVEN = 'distro-group-vinyl-7-inch';
const keyOf: Record<Bin, string> = { vinyl: VINYL, cd: CDS, tape: TAPES };

const item = (bin: Bin | null, artist: string, formatKey = bin ? keyOf[bin] : SEVEN): CrateItem => ({
  slug: artist.toLowerCase().replaceAll(' ', '-'),
  artist,
  title: artist + ' title',
  formatKey,
  bin,
});

// Page order: Adolf (cd), Allochiria (vinyl), Band in the pit (tape), Kokomo (vinyl), Magmarus (tape),
// Mammock (vinyl), Ten Inch (7-inch, no bin), Toundra (cd).
const items = [
  item('cd', 'Adolf'),
  item('vinyl', 'Allochiria'),
  item('tape', 'Band in the pit'),
  item('vinyl', 'Kokomo'),
  item('tape', 'Magmarus'),
  item('vinyl', 'Mammock'),
  item(null, 'Ten Inch'),
  item('cd', 'Toundra'),
];
const everyBin: Bin[] = ['vinyl', 'cd', 'tape'];
const grid = items.map((_, id) => id);

function run(cat: Catalog, intents: Intent[], from: State = initialState(cat)) {
  return intents.reduce((state, intent) => reduce(state, intent, cat), from);
}
const open = (onScreen: number[], format = 'all'): Intent => ({ type: 'openCrate', grid, onScreen, format });
// Three sleeves thumb forward one at a time, the last onto the back board.
const toBackBoard: Intent[] = [
  { type: 'digTo', slot: 3 },
  { type: 'thumbOn' },
  { type: 'thumbOn' },
  { type: 'thumbOn' },
  { type: 'settled' },
];

describe('crate bins', () => {
  it('maps only Vinyl 12-inch, CDs and Tapes to bins', () => {
    expect(binOfFormatGroup('Vinyl 12-inch')).toBe('vinyl');
    expect(binOfFormatGroup('CDs')).toBe('cd');
    expect(binOfFormatGroup('Tapes')).toBe('tape');
    for (const group of ['Vinyl 7-inch', 'Vinyl 10-inch', 'Clothes', 'Other'])
      expect(binOfFormatGroup(group)).toBeNull();
  });

  it('opens a bin from seven items, in counter order', () => {
    const groups = [
      ...Array<string>(CRATE_BIN_FROM).fill('CDs'),
      ...Array<string>(CRATE_BIN_FROM - 1).fill('Tapes'),
      ...Array<string>(52).fill('Vinyl 12-inch'),
      ...Array<string>(9).fill('Vinyl 7-inch'),
    ];
    expect(openBinsOf(groups)).toEqual([
      { bin: 'vinyl', count: 52 },
      { bin: 'cd', count: CRATE_BIN_FROM },
    ]);
  });
});

describe('opening the Crate', () => {
  const cat = catalogOf(items, everyBin, false);

  it('opens the bin of the first card on screen and puts earlier items on the pile', () => {
    const state = run(cat, [open([3, 4, 5])]);
    expect(state.mode).toMatchObject({ view: 'crate', focus: { at: 'vinyl', motion: { kind: 'arriving' } } });
    expect(state.hands.vinyl).toEqual({ on: 'sleeve', index: 1 });
  });

  it('returns to the item in hand after a round trip through the Grid', () => {
    const inRack = run(cat, [open([4]), { type: 'settled' }]);
    expect(inRack.hands.tape).toEqual({ on: 'tape', index: 1 });
    const back = run(cat, [{ type: 'closeCrate' }], inRack);
    expect(back.mode).toEqual({ view: 'grid', held: 4 });
    // Magmarus is on screen but not first: the Crate still returns to it, not to the first card of its row.
    const again = run(cat, [open([3, 4, 5])], back);
    expect(again.mode).toMatchObject({ view: 'crate', focus: { at: 'tape' } });
    expect(itemInHand(again, cat, 'tape')).toBe(4);
  });

  it('forgets the held card once it scrolls away', () => {
    const back = run(cat, [open([4]), { type: 'closeCrate' }]);
    expect(run(cat, [open([0, 1])], back).mode).toMatchObject({ focus: { at: 'cd' } });
  });

  it('skips cards without a bin, then looks further down and finally up', () => {
    expect(crateTarget(null, grid, [6], cat)).toBe(7);
    const onlyVinyl = catalogOf(items, ['vinyl'], false);
    expect(crateTarget(null, grid, [6, 7], onlyVinyl)).toBe(5);
    expect(crateTarget(null, [6], [6], onlyVinyl)).toBeNull();
  });

  it('does nothing when the Grid holds nothing with a bin', () => {
    const none = catalogOf(items, [], false);
    const state = initialState(none);
    expect(reduce(state, open([0, 1, 2]), none)).toBe(state);
    expect(state.hands).toEqual({});
  });

  it('opens still under reduced motion', () => {
    const reduced = catalogOf(items, everyBin, true);
    expect(run(reduced, [open([1])]).mode).toMatchObject({ focus: { motion: { kind: 'still', lean: 'none' } } });
  });
});

describe('walking between bins', () => {
  const cat = catalogOf(items, ['vinyl', 'cd'], false);

  it('keeps each bin where it was left', () => {
    const state = run(cat, [open([1]), { type: 'settled' }, { type: 'flip', by: 1 }, { type: 'chooseBin', bin: 'cd' }]);
    expect(state.mode).toMatchObject({ focus: { at: 'cd', motion: { kind: 'still' } } });
    expect(state.hands.vinyl).toEqual({ on: 'sleeve', index: 1 });
    expect(run(cat, [{ type: 'chooseBin', bin: 'vinyl' }], state).hands.vinyl).toEqual({ on: 'sleeve', index: 1 });
  });

  it('never stands at a bin that does not exist', () => {
    const state = run(cat, [open([1])]);
    expect(reduce(state, { type: 'chooseBin', bin: 'tape' }, cat)).toBe(state);
  });

  it('chooses the Grid filter to return to', () => {
    const fromAll = run(cat, [open([1], 'all'), { type: 'chooseBin', bin: 'cd' }]);
    expect(formatAfterCrate(fromAll, cat, null)).toBe('all');
    const fromVinyl = run(cat, [open([1], VINYL), { type: 'chooseBin', bin: 'cd' }]);
    expect(formatAfterCrate(fromVinyl, cat, null)).toBe(CDS);
    expect(formatAfterCrate(fromVinyl, cat, SEVEN)).toBe(SEVEN);
  });
});

describe('a flip bin', () => {
  const cat = catalogOf(items, everyBin, false);
  const inCrate = run(cat, [open([1]), { type: 'settled' }]);

  it('drops one sleeve past the tipping point and settles after the fall', () => {
    const dropped = run(cat, [{ type: 'tip', tip: 0.1 }, { type: 'drop' }], inCrate);
    expect(dropped.hands.vinyl).toEqual({ on: 'sleeve', index: 1 });
    expect(dropped.mode).toMatchObject({ focus: { motion: { kind: 'dropping' } } });
    expect(followUp(dropped)).toEqual({ intent: { type: 'settled' }, after: 260 });
    expect(reduce(dropped, { type: 'letGo', speed: 5000 }, cat)).toBe(dropped);
  });

  it('turns one sleeve for the hardest flick', () => {
    const flicked = run(
      cat,
      [
        { type: 'tip', tip: 0.05 },
        { type: 'letGo', speed: 9000 },
      ],
      inCrate,
    );
    expect(flicked.hands.vinyl).toEqual({ on: 'sleeve', index: 1 });
    const leaned = run(
      cat,
      [
        { type: 'tip', tip: 0.05 },
        { type: 'letGo', speed: 0 },
      ],
      inCrate,
    );
    expect(leaned.hands.vinyl).toEqual({ on: 'sleeve', index: 0 });
    expect(leaned.mode).toMatchObject({ focus: { motion: { kind: 'settling', dir: 0 } } });
  });

  it('ends at the back board and lifts nothing there', () => {
    const end = run(cat, toBackBoard, inCrate);
    expect(end.hands.vinyl).toEqual({ on: 'backBoard' });
    expect(reduce(end, { type: 'flip', by: 1 }, cat).hands.vinyl).toEqual({ on: 'backBoard' });
    expect(reduce(end, { type: 'lift' }, cat)).toBe(end);
    expect(reduce(end, { type: 'drop' }, cat)).toBe(end);
    expect(run(cat, [{ type: 'tip', tip: 1 }], end).mode).toMatchObject({ focus: { motion: { tip: 0 } } });
  });

  it('thumbs through long digs and stands a handful back up in one push', () => {
    const long = catalogOf(
      Array.from({ length: 20 }, (_, n) => item('vinyl', 'Artist ' + String(n).padStart(2, '0'))),
      ['vinyl'],
      false,
    );
    const start = run(long, [{ type: 'openCrate', grid: [0], onScreen: [0], format: 'all' }, { type: 'settled' }]);
    const digging = reduce(start, { type: 'digTo', slot: 15 }, long);
    expect(digging.hands.vinyl).toEqual({ on: 'sleeve', index: 9 });
    expect(digging.mode).toMatchObject({ focus: { motion: { kind: 'thumbing', to: 15, total: 6 } } });
    expect(followUp(digging)?.intent).toEqual({ type: 'thumbOn' });
    const fifth: State = { ...start, hands: { vinyl: { on: 'sleeve', index: 5 } } };
    const back = reduce(fifth, { type: 'digTo', slot: 0 }, long);
    expect(back.mode).toMatchObject({ focus: { motion: { kind: 'standingUp', from: 5 } } });
  });

  it('leans only what is there and never overrides a lifted sleeve', () => {
    const lifted = reduce(inCrate, { type: 'lift' }, cat);
    expect(lifted.mode).toMatchObject({ focus: { motion: { kind: 'still', lean: 'lifted' } } });
    expect(reduce(lifted, { type: 'lean', lean: 'front' }, cat)).toBe(lifted);
    expect(reduce(inCrate, { type: 'lean', lean: 'pile' }, cat)).toBe(inCrate);
  });

  it('teaches the pull once a flip bin has landed', () => {
    const arriving = run(cat, [open([1])]);
    expect(landed(arriving, reduce(arriving, { type: 'settled' }, cat))).toBe(true);
    const rack = run(cat, [open([2])]);
    expect(landed(rack, reduce(rack, { type: 'settled' }, cat))).toBe(false);
  });
});

describe('the tape rack', () => {
  const cat = catalogOf(items, everyBin, false);
  const inRack = run(cat, [open([2]), { type: 'settled' }]);

  it('ignores flip-only intents', () => {
    for (const intent of [{ type: 'lift' }, { type: 'lean', lean: 'front' }, { type: 'drop' }] as Intent[]) {
      expect(reduce(inRack, intent, cat)).toBe(inRack);
    }
  });

  it('clamps a slide to the rack and pulls the tape under the finger', () => {
    const held = reduce(inRack, { type: 'tip', tip: 5 }, cat);
    expect(held.mode).toMatchObject({ focus: { motion: { kind: 'held', reach: 1 } } });
    expect(reduce(held, { type: 'letGo', speed: 0 }, cat).hands.tape).toEqual({ on: 'tape', index: 1 });
  });
});

describe('Back restore', () => {
  const cat = catalogOf(items, everyBin, false);

  it('records slugs and reopens the same bin and hands, still', () => {
    const state = run(cat, [open([1]), { type: 'settled' }, { type: 'flip', by: 1 }, { type: 'settled' }]);
    const record = recordOf(state, cat);
    expect(record).toEqual({
      bin: 'vinyl',
      returnTo: 'all',
      hands: { vinyl: 'kokomo', cd: 'adolf', tape: 'band-in-the-pit' },
    });
    const restored = restoreState(record!, cat);
    expect(restored?.hands).toEqual(state.hands);
    expect(restored?.mode).toMatchObject({ view: 'crate', focus: { at: 'vinyl', motion: { kind: 'still' } } });
  });

  it('keeps a hand at the back board and drops a record whose bin is gone', () => {
    const end = run(cat, [open([1]), { type: 'settled' }, ...toBackBoard]);
    expect(restoreState(recordOf(end, cat)!, cat)?.hands.vinyl).toEqual({ on: 'backBoard' });
    expect(restoreState(recordOf(end, cat)!, catalogOf(items, ['cd'], false))).toBeNull();
    expect(recordOf(initialState(cat), cat)).toBeNull();
  });
});
