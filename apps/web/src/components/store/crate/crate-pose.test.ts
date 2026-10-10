import { describe, expect, it } from 'vitest';
import { DROP_MS, type FlipMotion, type RackMotion, type Tip } from './crate-model';
import {
  flightPose,
  flipPose,
  flipTiming,
  rackPose,
  rackTiming,
  tipForDrag,
  topY,
  transformOf,
  type FlipGeometry,
  type RackGeometry,
} from './crate-pose';

const crate: FlipGeometry = {
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
};
const rack: RackGeometry = {
  mechanic: 'rack',
  W: 190,
  Hh: 297,
  T: 48,
  H: 763,
  P: 1260,
  rackScale: 0.62,
  pullScale: 0.9,
  pullY: 204,
  pitch: 36,
  left: 136,
  centerX: 280,
  tempo: 1,
};
const sleeve = { on: 'sleeve', index: 3 } as const;
const still: FlipMotion = { kind: 'still', lean: 'none' };
const functions = (transform: string) => transform.match(/[a-zA-Z]+(?=\()/g);

describe('poses', () => {
  it('uses one transform-function list for the bin, the pile, the rack and the flight', () => {
    const list = functions(transformOf(flipPose(sleeve, still, 5, 10, crate), crate));
    expect(list).toEqual([
      'translate',
      'translateY',
      'perspective',
      'translateY',
      'translateZ',
      'rotateX',
      'rotateY',
      'scale',
    ]);
    expect(functions(transformOf(flipPose(sleeve, still, 0, 10, crate), crate))).toEqual(list);
    expect(functions(transformOf(rackPose({ on: 'tape', index: 1 }, null, 4, 8, rack), rack))).toEqual(list);
    const flight = flightPose(
      { left: 0, top: 0, width: 180, height: 180 },
      { left: 100, top: 112, width: 360, height: 360 },
    );
    expect(functions(transformOf(flight, crate))).toEqual(list);
  });

  it('stands sleeves behind the hand, tips the held one and lays the flipped ones on the pile', () => {
    expect(flipPose(sleeve, still, 3, 10, crate)).toMatchObject({ z: 0, rx: 0, opacity: 1, shade: 0 });
    expect(flipPose(sleeve, still, 5, 10, crate)).toMatchObject({ z: -144, rx: 0 });
    expect(flipPose(sleeve, still, 9, 10, crate).opacity).toBe(0);
    expect(flipPose(sleeve, still, 2, 10, crate)).toMatchObject({ rx: -61 });
    const held: FlipMotion = { kind: 'held', tip: 0.5 as Tip };
    expect(flipPose(sleeve, held, 3, 10, crate).rx).toBeCloseTo(-30.5);
  });

  it('pulls the tape in hand out to face you and shows the rest by their spines', () => {
    const hand = { on: 'tape', index: 1 } as const;
    expect(rackPose(hand, null, 1, 4, rack)).toMatchObject({ x: 0, y: -204, ry: 0, s: 0.9 });
    expect(rackPose(hand, null, 2, 4, rack)).toMatchObject({ ry: 90, s: 0.62, x: 136 + 36 * 2.5 - 280 });
  });

  it('puts a flown sleeve over the card artwork, scaled around its bottom centre', () => {
    const rest = { left: 100, top: 112, width: 360, height: 360 };
    const pose = flightPose({ left: 10, top: 20, width: 180, height: 180 }, rest);
    expect(pose.s).toBe(0.5);
    // Centre x lands on the card's centre; the scaled box's centre y does too.
    expect(100 + 180 + pose.x).toBe(100);
    expect(112 + 360 + pose.y - (360 * pose.s) / 2).toBe(110);
  });
});

describe('the finger', () => {
  it('keeps the top edge under the finger as the sleeve tips', () => {
    for (const dy of [12, 40, 120]) {
      const tip = tipForDrag(dy, crate);
      expect(topY(tip * crate.A, crate) - topY(0, crate)).toBeCloseTo(dy, 0);
    }
    expect(tipForDrag(0, crate)).toBeCloseTo(0);
    expect(tipForDrag(-10_000, crate)).toBeCloseTo(-1);
  });
});

describe('timings', () => {
  const hand = { on: 'sleeve', index: 3 } as const;

  it('lets the finger lead and skips motion under reduced motion', () => {
    expect(flipTiming(hand, { kind: 'held', tip: 0 as Tip }, 3, 10, crate, false)).toBeNull();
    expect(flipTiming(hand, { kind: 'settling', dir: 1 }, 3, 10, crate, true)).toBeNull();
    expect(rackTiming({ on: 'tape', index: 0 }, { kind: 'settling', dir: 1 } as RackMotion, 0, rack, true)).toBeNull();
  });

  it('drops the sleeve with gravity and settles the bin inside the drop window', () => {
    const dropping: FlipMotion = { kind: 'dropping' };
    const fall = flipTiming(hand, dropping, 2, 10, crate, false)!;
    expect(fall.ease).toContain('0.55');
    for (const k of [0, 1, 2, 3, 4, 10]) {
      const t = flipTiming(hand, dropping, k, 10, crate, false)!;
      expect(t.dur + t.delay).toBeLessThanOrEqual(DROP_MS);
    }
  });
});
