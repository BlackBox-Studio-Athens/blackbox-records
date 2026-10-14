/**
 * Where every sleeve and tape stands, and how it moves there. Pure: a pose depends only on the hand, the motion and
 * the bin's geometry, and every pose uses one transform-function list so the compositor interpolates between any
 * two of them without falling back to matrices.
 */
import type { FlipHand, FlipMotion, RackHand, RackMotion } from './crate-model';
import {
  DROP_MS,
  RIFFLE_ARRIVE_MS,
  RIFFLE_FALL_MS,
  RIFFLE_MAX,
  RIFFLE_SETTLE_MS,
  riffleStarts,
  slotOf,
} from './crate-model';

/** A cubic-bezier easing's control points. */
export type Curve = readonly [number, number, number, number];
export const cssCurve = (c: Curve) => `cubic-bezier(${c.join(', ')})`;
const EASE_CURVE: Curve = [0.22, 1, 0.36, 1];
const FALL_CURVE: Curve = [0.55, 0.06, 0.85, 0.4];
const EASE_IN_CURVE: Curve = [0.32, 0, 0.67, 0];
const LINEAR: Curve = [0, 0, 1, 1];
/** The site's one curve, quint ease-out. */
export const EASE = cssCurve(EASE_CURVE);
/** Gravity: a falling sleeve speeds up until it lands. */
export const FALL = cssCurve(FALL_CURVE);

/** Where an easing stands at share `p` of its time, as the compositor computes it. */
export function eased(c: Curve, p: number) {
  const along = (a: number, b: number, t: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  let low = 0;
  let high = 1;
  for (let step = 0; step < 24; step += 1) {
    const mid = (low + high) / 2;
    if (along(c[0], c[2], mid) < p) low = mid;
    else high = mid;
  }
  return along(c[1], c[3], (low + high) / 2);
}

/**
 * A flip bin, in stage pixels: sleeve size `w` × `h`; the viewpoint `H` above the hinge at distance `P`; sleeves
 * `ZS` apart behind the hand and `ZP` apart on the pile; `A` degrees from upright to the pile; `fall` the share of
 * `A` past which a sleeve drops; `peek` sleeves visible behind the hand; `tempo` scales every duration.
 */
export interface FlipGeometry {
  readonly mechanic: 'flip';
  readonly w: number;
  readonly h: number;
  readonly H: number;
  readonly P: number;
  readonly ZS: number;
  readonly ZP: number;
  readonly A: number;
  readonly tilt: number;
  readonly hint: number;
  readonly lift: number;
  readonly pileLift: number;
  readonly dim: number;
  readonly peek: number;
  readonly dragScale: number;
  readonly fall: number;
  readonly tempo: number;
}

/** A tape rack: tape box `W` × `Hh` × `T`, spines `pitch` apart from `left`, the pulled tape raised by `pullY`. */
export interface RackGeometry {
  readonly mechanic: 'rack';
  readonly W: number;
  readonly Hh: number;
  readonly T: number;
  readonly H: number;
  readonly P: number;
  readonly rackScale: number;
  readonly pullScale: number;
  readonly pullY: number;
  readonly pitch: number;
  readonly left: number;
  readonly centerX: number;
  readonly tempo: number;
}

export type BinGeometry = FlipGeometry | RackGeometry;

export interface Pose {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly rx: number;
  readonly ry: number;
  readonly s: number;
  readonly opacity: number;
  readonly shade: number;
}

export interface Timing {
  readonly dur: number;
  readonly ease: string;
  readonly delay: number;
}

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));

/** `u` counts sleeves from the hand: 0 in hand, positive stands further back, -1 leans on the pile, below lies under it. */
function poseAt(u: number, g: FlipGeometry): Pose {
  let z: number;
  let rx: number;
  let opacity: number;
  let shade: number;
  if (u >= 0) {
    z = 0 - g.ZS * u;
    rx = 0;
    opacity = clamp(g.peek + 1 - u, 0, 1);
    shade = g.dim * Math.min(u, g.peek + 1);
  } else if (u >= -1) {
    z = 0;
    rx = g.A * u;
    opacity = 1;
    shade = 0.85 * -u;
  } else {
    z = g.ZP * Math.min(-u - 1, 2);
    rx = -g.A;
    opacity = clamp(3 + u, 0, 1);
    shade = 0.85;
  }
  return { x: 0, y: 0, z, rx, ry: 0, s: 1, opacity, shade };
}

/** The pose of sleeve `k` (k === count is the back board). A held sleeve's tip moves every sleeve's `u` with it. */
export function flipPose(hand: FlipHand, motion: FlipMotion | null, k: number, count: number, g: FlipGeometry): Pose {
  const slot = slotOf(hand, count);
  const pose = poseAt(k - slot - (motion?.kind === 'held' ? motion.tip : 0), g);
  if (motion?.kind !== 'still' || k >= count) return pose;
  if (k === slot && motion.lean === 'front') return { ...pose, rx: -g.tilt };
  if (k === slot && motion.lean === 'hint') return { ...pose, rx: -g.hint };
  if (k === slot && motion.lean === 'lifted') return { ...pose, y: -g.lift };
  if (k === slot - 1 && motion.lean === 'pile') return { ...pose, rx: -g.A + g.pileLift };
  return pose;
}

/** A pose a riffled sleeve reaches `at` milliseconds into the plan, eased from there to the next one by `ease`. */
export interface RiffleFrame {
  readonly at: number;
  readonly pose: Pose;
  readonly ease: Curve;
}
export interface RiffleTrack {
  /** The sleeve, or the back board at k === count. */
  readonly k: number;
  /** Its place in the riffle: 0 is the first sleeve to leave the hand, negative ones already lie on the pile. */
  readonly v: number;
  readonly frames: readonly RiffleFrame[];
  /** When a sleeve the hand passes lands on the pile; null for the rest. */
  readonly lands: number | null;
}
export interface Riffle {
  readonly duration: number;
  /** A dig back plays the plan backwards. */
  readonly reverse: boolean;
  /** How many sleeves pass the hand. */
  readonly n: number;
  readonly tracks: readonly RiffleTrack[];
}

/**
 * A dig past two or more sleeves as one planned riffle, so every sleeve moves once from where it is to where it ends.
 * Sleeves leave the hand one after another and fall onto the pile, which gives under each one, while the stack behind
 * steps up. A long dig riffles the sleeves in reach and the last few before the target; those between stay out of
 * sight at both ends. It is planned from the lower slot, and a dig back plays it reversed: the top of the pile stands
 * up first and pushes the rest back.
 */
export function flipRiffle(from: number, to: number, count: number, g: FlipGeometry): Riffle {
  const dir = to > from ? 1 : -1;
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  const n = Math.min(hi - lo, RIFFLE_MAX);
  // The sleeves in reach cover every one standing in sight, since no bin shows more than four behind the hand.
  const near = RIFFLE_MAX - 3;
  const starts = riffleStarts(n, dir).map((t) => t * g.tempo);
  const lands = starts.map((t) => t + RIFFLE_FALL_MS * g.tempo);
  const settle = RIFFLE_SETTLE_MS * g.tempo;
  const arrive = RIFFLE_ARRIVE_MS * g.tempo;
  const last = starts[n - 1]!;
  const duration = last + Math.max(RIFFLE_FALL_MS * g.tempo + settle, arrive);
  const tracks: RiffleTrack[] = [];
  for (let v = -2; v <= n + g.peek; v += 1) {
    const k = v < near ? lo + v : hi + v - n;
    if (k < 0 || k > count) continue;
    // Each point is a time, the sleeve's place from the hand then, and the easing on to the next point.
    const points: [number, number, Curve][] = [];
    if (v < 0) points.push([0, v, LINEAR]);
    for (let j = 0; j <= Math.min(v, n - 1); j += 1) points.push([starts[j]!, v - j, j === 0 ? EASE_IN_CURVE : LINEAR]);
    if (v >= n) {
      points[points.length - 1]![2] = EASE_CURVE;
      points.push([last + arrive, v - n, LINEAR]);
    } else {
      if (v >= 0) {
        points[points.length - 1]![2] = FALL_CURVE;
        points.push([lands[v]!, -1, LINEAR]);
      }
      // The pile gives under it as each later sleeve lands, sinking steadily until it lies out of sight beneath them.
      let u = points[points.length - 1]![1];
      for (let j = Math.max(0, v + 1); j < n && u > -3; j += 1) {
        if (j === Math.max(0, v + 1)) points.push([lands[j]!, u, LINEAR]);
        u -= 1;
        points.push([lands[j]! + settle, u, LINEAR]);
      }
    }
    points.push([duration, points[points.length - 1]![1], LINEAR]);
    tracks.push({
      k,
      v,
      frames: points.map(([at, u, ease]) => ({ at, pose: poseAt(u, g), ease })),
      lands: v >= 0 && v < n ? lands[v]! : null,
    });
  }
  return { duration, reverse: dir < 0, n, tracks };
}

/** Where a track's sleeve is `t` milliseconds into its plan, matching what the compositor draws then. */
export function poseOnTrack(frames: readonly RiffleFrame[], t: number): Pose {
  const next = frames.findIndex((frame) => frame.at > t);
  if (next === 0) return frames[0]!.pose;
  if (next < 0) return frames[frames.length - 1]!.pose;
  const a = frames[next - 1]!;
  const b = frames[next]!;
  const p = eased(a.ease, (t - a.at) / (b.at - a.at));
  const mix = (x: number, y: number) => x + (y - x) * p;
  return {
    x: mix(a.pose.x, b.pose.x),
    y: mix(a.pose.y, b.pose.y),
    z: mix(a.pose.z, b.pose.z),
    rx: mix(a.pose.rx, b.pose.rx),
    ry: mix(a.pose.ry, b.pose.ry),
    s: mix(a.pose.s, b.pose.s),
    opacity: mix(a.pose.opacity, b.pose.opacity),
    shade: mix(a.pose.shade, b.pose.shade),
  };
}

/** The tape in hand is pulled up out of the rack and turned to face you; the rest show their spines. */
export function rackPose(hand: RackHand, motion: RackMotion | null, k: number, count: number, g: RackGeometry): Pose {
  const pulledIndex = motion?.kind === 'held' ? clamp(hand.index + Math.round(motion.reach), 0, count - 1) : hand.index;
  const pulled = k === pulledIndex;
  const s = pulled ? g.pullScale : g.rackScale;
  // Keep the face you see in the picture plane, so the rack's floor stays put under perspective.
  const z = -((pulled ? g.T : g.W) * s) / 2;
  const x = pulled ? 0 : g.left + g.pitch * (k + 0.5) - g.centerX;
  return { x, y: pulled ? -g.pullY : 0, z, rx: 0, ry: pulled ? 0 : 90, s, opacity: 1, shade: 0 };
}

/**
 * The one transform-function list for every pose: the perspective sandwich puts the viewpoint `H` above the hinge,
 * so sleeves tip toward the viewer around their bottom edge.
 */
export function transformOf(p: Pose, g: BinGeometry): string {
  return (
    `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) translateY(-${g.H}px) perspective(${g.P}px) ` +
    `translateY(${g.H}px) translateZ(${p.z.toFixed(1)}px) rotateX(${p.rx.toFixed(2)}deg) ` +
    `rotateY(${p.ry.toFixed(2)}deg) scale(${p.s.toFixed(4)})`
  );
}

const scaled = (t: Timing, k: number): Timing => ({
  dur: Math.round(t.dur * k),
  ease: t.ease,
  delay: Math.round(t.delay * k),
});

// Forward: the sleeve in hand falls onto the pile, those behind step up in turn, and the pile settles under the
// new arrival. Back: the top of the pile stands first and pushes the rest back.
function settleTiming(dir: -1 | 0 | 1, d: number): Timing {
  if (dir > 0) {
    if (d === -1) return { dur: 420, ease: FALL, delay: 0 };
    if (d < -1) return { dur: 260, ease: EASE, delay: 300 };
    return { dur: 540, ease: EASE, delay: 16 * d };
  }
  if (dir < 0) {
    if (d === 0) return { dur: 480, ease: EASE, delay: 0 };
    if (d > 0) return { dur: 540, ease: EASE, delay: 30 + 14 * d };
    return { dur: 320, ease: EASE, delay: 0 };
  }
  return { dur: 420, ease: EASE, delay: 0 };
}

/**
 * How sleeve `k` moves into its pose, or null to follow the finger or skip motion. `d` counts from the hand. The
 * fly-in between Grid and Crate runs as its own animation, so arriving sleeves take their pose at once.
 */
export function flipTiming(
  hand: FlipHand,
  motion: FlipMotion,
  k: number,
  count: number,
  g: FlipGeometry,
  reduce: boolean,
) {
  // A riffle runs as its own animation, so its sleeves take their final pose at once.
  if (reduce || motion.kind === 'held' || motion.kind === 'arriving' || motion.kind === 'riffling') return null;
  const d = k - slotOf(hand, count);
  switch (motion.kind) {
    case 'dropping':
      // Gravity: the dropped sleeve speeds up until it lands, the pile gives under it, the rest step up.
      if (d === -1) return scaled({ dur: 220, ease: FALL, delay: 0 }, g.tempo);
      return scaled(d < -1 ? { dur: 110, ease: EASE, delay: 150 } : { dur: DROP_MS, ease: EASE, delay: 0 }, g.tempo);
    case 'settling':
      return scaled(settleTiming(motion.dir, d), g.tempo);
    default:
      return { dur: 240, ease: EASE, delay: 0 };
  }
}

export function rackTiming(hand: RackHand, motion: RackMotion, k: number, g: RackGeometry, reduce: boolean) {
  if (reduce || motion.kind === 'arriving') return null;
  if (motion.kind === 'held') return { dur: 240, ease: EASE, delay: 0 };
  return k === hand.index
    ? scaled({ dur: 520, ease: EASE, delay: 90 }, g.tempo)
    : scaled({ dur: 380, ease: EASE, delay: 0 }, g.tempo);
}

export const transitionOf = (t: Timing | null, properties: readonly string[]) =>
  t ? properties.map((property) => `${property} ${t.dur}ms ${t.ease} ${t.delay}ms`).join(', ') : 'none';

// Where a sleeve's top edge appears, relative to its hinge, when tipped `deg` toward the viewer.
export function topY(deg: number, g: FlipGeometry) {
  const t = (deg * Math.PI) / 180;
  return ((g.H - g.h * Math.cos(t)) * g.P) / (g.P - g.h * Math.sin(t)) - g.H;
}

/** A vertical drag keeps the sleeve's top edge under the finger: down tips it toward you, up stands the pile back. */
export function tipForDrag(dy: number, g: FlipGeometry) {
  const y0 = topY(0, g);
  const travel = topY(g.A, g) - y0;
  const shift = dy >= 0 ? Math.min(travel, dy) : Math.max(0, travel + dy);
  let low = 0;
  let high = g.A;
  for (let step = 0; step < 16; step += 1) {
    const mid = (low + high) / 2;
    if (topY(mid, g) - y0 < shift) low = mid;
    else high = mid;
  }
  const share = (low + high) / 2 / g.A;
  return dy >= 0 ? share : share - 1;
}

export interface Box {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/**
 * The pose that puts a sleeve whose untransformed box is `rest` over a card's artwork at `card`, both in the stage's
 * own coordinates. It uses the same function list as every bin pose, so the fly-in between Grid and Crate
 * interpolates on the compositor. Sleeves scale around their bottom centre.
 */
export function flightPose(card: Box, rest: Box): Pose {
  const s = Math.min(card.width / rest.width, card.height / rest.height);
  return {
    x: card.left + card.width / 2 - (rest.left + rest.width / 2),
    y: card.top + card.height / 2 + (rest.height * s) / 2 - (rest.top + rest.height),
    z: 0,
    rx: 0,
    ry: 0,
    s,
    opacity: 1,
    shade: 0,
  };
}
