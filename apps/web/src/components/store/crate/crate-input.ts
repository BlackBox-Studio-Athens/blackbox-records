/**
 * Every input the Store Crate takes, turned into Intents. One finger recognizer serves mouse, touch and pen in every
 * bin; the wheel only reads sideways input so vertical scrolling stays with the page; keys dig like hands do.
 */
import type { Intent } from './crate-model';
import { type BinGeometry, tipForDrag } from './crate-pose';

/** The parts of a pointer event the recognizer reads, so tests can pass plain objects. */
export interface PointerSample {
  readonly pointerType: string;
  readonly button: number;
  readonly clientX: number;
  readonly clientY: number;
  readonly pointerId: number;
  readonly timeStamp: number;
  readonly currentTarget: EventTarget | null;
}

/** A drag picks its axis after this many pixels. */
const AXIS_DISTANCE = 6;

export interface TipGesture {
  down(event: PointerSample): void;
  move(event: PointerSample): void;
  up(): void;
  cancel(): void;
  /** True while a drag holds a sleeve or tape, so hover leans stay out of its way. */
  active(): boolean;
  /** True for the click that a drag's own release produces, so it is not taken as a tap. */
  wasDrag(): boolean;
  dispose(): void;
}

// Speed in px/s from the last few samples along the drag's axis.
const speedOf = (samples: readonly (readonly [number, number])[]) => {
  const first = samples[0];
  const last = samples[samples.length - 1];
  return first && last && samples.length > 1 ? ((last[1] - first[1]) / Math.max(16, last[0] - first[0])) * 1000 : 0;
};

/**
 * In a flip bin a vertical drag keeps the sleeve's top edge under the finger and a horizontal one maps linearly; in
 * the rack a horizontal drag slides along the spines and vertical input is left to the page. Tip intents go out at
 * most once per frame, then letGo with the finger's speed, or cancel. Past the bin's tipping point gravity takes the
 * sleeve: drop goes out and the drag is spent, so one drag never turns more than one sleeve.
 */
export function createTipGesture(focusedBin: () => BinGeometry | null, dispatch: (intent: Intent) => void): TipGesture {
  type Drag = {
    x: number;
    y: number;
    id: number;
    target: { setPointerCapture?(pointerId: number): void } | null;
    axis: 'x' | 'y' | null;
    tip: number;
    spent: boolean;
    samples: [number, number][];
  };
  let drag: Drag | null = null;
  let frame = 0;
  let dragged = false;
  const flush = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    if (drag?.axis && !drag.spent) dispatch({ type: 'tip', tip: drag.tip });
  };
  const finish = (toIntent: (d: Drag) => Intent) => {
    const d = drag;
    if (!d?.axis) {
      drag = null;
      return;
    }
    flush();
    drag = null;
    dragged = true;
    setTimeout(() => {
      dragged = false;
    }, 0);
    if (!d.spent) dispatch(toIntent(d));
  };
  return {
    down(event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      drag = {
        x: event.clientX,
        y: event.clientY,
        id: event.pointerId,
        target: event.currentTarget as { setPointerCapture?(pointerId: number): void } | null,
        axis: null,
        tip: 0,
        spent: false,
        samples: [],
      };
    },
    move(event) {
      const bin = focusedBin();
      if (!drag || !bin || drag.spent || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      const flip = bin.mechanic === 'flip';
      if (!drag.axis) {
        if (Math.abs(dx) < AXIS_DISTANCE && Math.abs(dy) < AXIS_DISTANCE) return;
        drag.axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x';
        if (drag.axis === 'y' && !flip) {
          drag = null;
          return;
        }
        try {
          drag.target?.setPointerCapture?.(drag.id);
        } catch {
          // Capture is an optimisation; the drag still works without it.
        }
      }
      drag.samples.push([event.timeStamp, flip && drag.axis === 'y' ? dy : flip ? -dx : dx]);
      if (drag.samples.length > 6) drag.samples.shift();
      if (bin.mechanic === 'rack') drag.tip = dx / bin.pitch;
      else drag.tip = drag.axis === 'y' ? tipForDrag(dy, bin) : -dx / bin.dragScale;
      if (bin.mechanic === 'flip' && drag.tip >= bin.fall) {
        drag.spent = true;
        cancelAnimationFrame(frame);
        frame = 0;
        dispatch({ type: 'drop' });
        return;
      }
      if (!frame) frame = requestAnimationFrame(flush);
    },
    up() {
      finish((d) => ({ type: 'letGo', speed: speedOf(d.samples) }));
    },
    cancel() {
      finish(() => ({ type: 'cancel' }));
    },
    active() {
      return Boolean(drag?.axis);
    },
    wasDrag() {
      return dragged;
    },
    dispose() {
      cancelAnimationFrame(frame);
      drag = null;
    },
  };
}

const WHEEL_THRESHOLD = 48;
const WHEEL_GESTURE_GAP_MS = 160;
const WHEEL_REPEAT_GAP_MS = 120;

export type WheelGestureState = {
  accumulatedDelta: number;
  direction: -1 | 0 | 1;
  lastEventAt: number | null;
  lastMoveAt: number | null;
};

export const restingWheelGesture = (): WheelGestureState => ({
  accumulatedDelta: 0,
  direction: 0,
  lastEventAt: null,
  lastMoveAt: null,
});

/**
 * The sideways part of a wheel event, in pixels, or null when it is vertical scrolling the page should keep.
 * Shift turns a vertical wheel sideways, as browsers do.
 */
export function crateWheelDelta(
  input: Pick<WheelEvent, 'deltaMode' | 'deltaX' | 'deltaY' | 'shiftKey' | 'ctrlKey'>,
  stageWidth: number,
) {
  if (input.ctrlKey) return null;
  const rawDelta = input.shiftKey && input.deltaX === 0 ? input.deltaY : input.deltaX;
  if (rawDelta === 0 || (!input.shiftKey && Math.abs(input.deltaX) <= Math.abs(input.deltaY))) return null;
  const multiplier = input.deltaMode === 1 ? 16 : input.deltaMode === 2 ? stageWidth : 1;
  return rawDelta * multiplier;
}

/** One move per notch: a sustained gesture repeats no faster than every 120ms, and a pause or reversal starts over. */
export function advanceWheelGesture(
  state: WheelGestureState,
  delta: number,
  eventTime: number,
): { move: -1 | 0 | 1; state: WheelGestureState } {
  const direction = Math.sign(delta) as -1 | 1;
  const startsNewGesture =
    state.lastEventAt === null || eventTime - state.lastEventAt > WHEEL_GESTURE_GAP_MS || direction !== state.direction;
  const nextState: WheelGestureState = startsNewGesture
    ? { accumulatedDelta: 0, direction, lastEventAt: eventTime, lastMoveAt: null }
    : { ...state, lastEventAt: eventTime };

  nextState.accumulatedDelta += delta;
  if (Math.abs(nextState.accumulatedDelta) < WHEEL_THRESHOLD) return { move: 0, state: nextState };
  if (nextState.lastMoveAt !== null && eventTime - nextState.lastMoveAt < WHEEL_REPEAT_GAP_MS) {
    return { move: 0, state: nextState };
  }

  nextState.accumulatedDelta -= direction * WHEEL_THRESHOLD;
  nextState.lastMoveAt = eventTime;
  return { move: direction, state: nextState };
}

/** The first letter an artist files under: A to Z, or # for anything else. */
export const dividerOf = (artist: string) => {
  const letter = artist.normalize('NFD').charAt(0).toUpperCase();
  return letter >= 'A' && letter <= 'Z' ? letter : '#';
};

/** The Intent a key press asks for in a bin, or null to leave the key alone. `slotOfLetter` returns -1 for none. */
export function keyIntent(
  event: Pick<KeyboardEvent, 'key' | 'altKey' | 'ctrlKey' | 'metaKey'>,
  lastSlot: number,
  slotOfLetter: (letter: string) => number,
): Intent | null {
  if (event.altKey || event.ctrlKey || event.metaKey) return null;
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
    case 'PageDown':
      return { type: 'flip', by: 1 };
    case 'ArrowLeft':
    case 'ArrowUp':
    case 'PageUp':
      return { type: 'flip', by: -1 };
    case 'Home':
      return { type: 'digTo', slot: 0 };
    case 'End':
      return { type: 'digTo', slot: lastSlot };
    case 'Enter':
    case ' ':
      return { type: 'lift' };
    default: {
      if (!/^[a-z]$/i.test(event.key)) return null;
      const slot = slotOfLetter(event.key.toUpperCase());
      return slot >= 0 ? { type: 'digTo', slot } : null;
    }
  }
}
