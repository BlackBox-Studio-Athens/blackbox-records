import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Intent } from './crate-model';
import {
  advanceWheelGesture,
  crateWheelDelta,
  createTipGesture,
  dividerOf,
  keyIntent,
  restingWheelGesture,
  type PointerSample,
} from './crate-input';
import type { FlipGeometry, RackGeometry } from './crate-pose';

const phoneCrate: FlipGeometry = {
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
};
const rack: RackGeometry = {
  mechanic: 'rack',
  W: 132,
  Hh: 206,
  T: 33,
  H: 560,
  P: 1000,
  rackScale: 0.62,
  pullScale: 0.9,
  pullY: 140,
  pitch: 25,
  left: 79,
  centerX: 179,
  tempo: 1,
};

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', () => 1);
  vi.stubGlobal('cancelAnimationFrame', () => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const at = (clientX: number, clientY: number, timeStamp: number, pointerType = 'mouse'): PointerSample => ({
  pointerType,
  button: 0,
  clientX,
  clientY,
  pointerId: 1,
  timeStamp,
  currentTarget: null,
});

describe('the tip gesture', () => {
  it('turns one sleeve however far a drag goes, and sends nothing once it is spent', () => {
    const sent: Intent['type'][] = [];
    const finger = createTipGesture(
      () => phoneCrate,
      (intent) => sent.push(intent.type),
    );
    finger.down(at(0, 0, 0, 'touch'));
    for (const [y, t] of [
      [10, 10],
      [60, 30],
      [200, 40],
      [400, 50],
    ] as const)
      finger.move(at(0, y, t, 'touch'));
    finger.up();
    expect(sent).toEqual(['drop']);
    expect(finger.wasDrag()).toBe(true);
  });

  it('reports the held tip, then lets go with the finger speed before the tipping point', () => {
    const sent: Intent[] = [];
    const finger = createTipGesture(
      () => phoneCrate,
      (intent) => sent.push(intent),
    );
    finger.down(at(0, 0, 0));
    finger.move(at(0, 8, 16));
    finger.up();
    expect(sent.map((intent) => intent.type)).toEqual(['tip', 'letGo']);
    expect(sent[1]).toMatchObject({ type: 'letGo' });
  });

  it('ignores small jitters, other buttons and vertical drags in the rack', () => {
    const sent: Intent[] = [];
    const finger = createTipGesture(
      () => rack,
      (intent) => sent.push(intent),
    );
    finger.down({ ...at(0, 0, 0), button: 2 });
    finger.move(at(0, 30, 10));
    finger.down(at(0, 0, 0));
    finger.move(at(3, 3, 10));
    finger.move(at(0, 30, 20));
    finger.up();
    expect(sent).toEqual([]);
    expect(finger.active()).toBe(false);
  });

  it('slides along the rack by spines', () => {
    const sent: Intent[] = [];
    const finger = createTipGesture(
      () => rack,
      (intent) => sent.push(intent),
    );
    finger.down(at(0, 0, 0, 'touch'));
    finger.move(at(50, 0, 16, 'touch'));
    finger.up();
    expect(sent[0]).toEqual({ type: 'tip', tip: 2 });
  });
});

describe('the wheel', () => {
  const wheel = (deltaX: number, deltaY: number, shiftKey = false, ctrlKey = false) => ({
    deltaMode: 0,
    deltaX,
    deltaY,
    shiftKey,
    ctrlKey,
  });

  it('only reads sideways input, so vertical scrolling stays with the page', () => {
    expect(crateWheelDelta(wheel(0, 120), 560)).toBeNull();
    expect(crateWheelDelta(wheel(30, 40), 560)).toBeNull();
    expect(crateWheelDelta(wheel(60, 10), 560)).toBe(60);
    expect(crateWheelDelta(wheel(0, 120, true), 560)).toBe(120);
    expect(crateWheelDelta(wheel(60, 0, false, true), 560)).toBeNull();
    expect(crateWheelDelta({ ...wheel(3, 0), deltaMode: 1 }, 560)).toBe(48);
  });

  it('moves once per notch and repeats a sustained gesture no faster than every 120ms', () => {
    let state = restingWheelGesture();
    const moves: number[] = [];
    for (const [delta, time] of [
      [30, 0],
      [30, 16],
      [48, 32],
      [48, 100],
      [48, 160],
    ] as const) {
      const result = advanceWheelGesture(state, delta, time);
      state = result.state;
      moves.push(result.move);
    }
    expect(moves).toEqual([0, 1, 0, 0, 1]);
    expect(advanceWheelGesture(state, -48, 170).move).toBe(-1);
  });
});

describe('keys', () => {
  const slotOfLetter = (letter: string) => ({ K: 4 })[letter] ?? -1;

  it('flips, digs to the ends, lifts and jumps to a letter', () => {
    const key = (k: string) => keyIntent({ key: k, altKey: false, ctrlKey: false, metaKey: false }, 9, slotOfLetter);
    expect(key('ArrowDown')).toEqual({ type: 'flip', by: 1 });
    expect(key('PageUp')).toEqual({ type: 'flip', by: -1 });
    expect(key('End')).toEqual({ type: 'digTo', slot: 9 });
    expect(key(' ')).toEqual({ type: 'lift' });
    expect(key('k')).toEqual({ type: 'digTo', slot: 4 });
    expect(key('z')).toBeNull();
    expect(keyIntent({ key: 'ArrowDown', altKey: false, ctrlKey: true, metaKey: false }, 9, slotOfLetter)).toBeNull();
  });

  it('files artists under A to Z or #', () => {
    expect(dividerOf('Malämmar')).toBe('M');
    expect(dividerOf('Ølfest')).toBe('#');
    expect(dividerOf('7 Seconds')).toBe('#');
    expect(dividerOf('Émile')).toBe('E');
  });
});
