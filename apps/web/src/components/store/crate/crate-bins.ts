/**
 * Which Store formats get a bin in the Store Crate. Shared by the server markup and the browser, so it imports
 * nothing: Vinyl 12-inch stands in a crate, CDs in a CD bin and Tapes in a tape rack, and only once a collection
 * holds enough of them to dig through.
 */

/** A format gets a bin from this many items, the same count at which the Store first offered a second view. */
export const CRATE_BIN_FROM = 7;

export type Bin = 'vinyl' | 'cd' | 'tape';

/** Left to right along the counter. */
export const BINS: readonly Bin[] = ['vinyl', 'cd', 'tape'];

export const BIN_WORDS: Readonly<Record<Bin, { group: string; bin: string; things: string }>> = {
  vinyl: { group: 'Vinyl 12-inch', bin: 'crate', things: 'records' },
  cd: { group: 'CDs', bin: 'CD bin', things: 'CDs' },
  tape: { group: 'Tapes', bin: 'tape rack', things: 'tapes' },
};

const BIN_OF_GROUP = new Map<string, Bin>(BINS.map((bin) => [BIN_WORDS[bin].group, bin]));

/** The bin a Store format group stands in, or null for formats the Crate never holds. */
export function binOfFormatGroup(group: string): Bin | null {
  return BIN_OF_GROUP.get(group) ?? null;
}

// Store photos made by the artwork fetcher's mockup renderer put the cover, or the CD's jewel case, at a fixed place
// on a textured background. A sleeve shows only that part: left, top, width and height in pixels of the photo.
const MOCKUP_ART = new Map<string, readonly [number, number, number, number]>([
  ['3544x3543', [562, 610, 2420, 2420]],
  ['2800x2100', [938, 603, 1102, 990]],
]);

/** Where a sleeve's artwork sits in a Store photo, as "left top width height" fractions, or undefined for the
 * whole photo. */
export function artBoxOf(width: number, height: number): string | undefined {
  const box = MOCKUP_ART.get(`${width}x${height}`);
  if (!box) return undefined;
  const [left, top, w, h] = box;
  return [left / width, top / height, w / width, h / height].map((share) => share.toFixed(4)).join(' ');
}

/** The bins a collection opens, in counter order, with how many of its Store Items stand in each. */
export function openBinsOf(groups: Iterable<string>): { bin: Bin; count: number }[] {
  const counts = new Map<Bin, number>();
  for (const group of groups) {
    const bin = binOfFormatGroup(group);
    if (bin) counts.set(bin, (counts.get(bin) ?? 0) + 1);
  }
  return BINS.flatMap((bin) => {
    const count = counts.get(bin) ?? 0;
    return count >= CRATE_BIN_FROM ? [{ bin, count }] : [];
  });
}
