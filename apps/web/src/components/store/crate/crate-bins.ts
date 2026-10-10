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

/** The bins a collection opens, in counter order, from the format group of each of its Store Items. */
export function openBinsOf(groups: Iterable<string>): Bin[] {
  const counts = new Map<Bin, number>();
  for (const group of groups) {
    const bin = binOfFormatGroup(group);
    if (bin) counts.set(bin, (counts.get(bin) ?? 0) + 1);
  }
  return BINS.filter((bin) => (counts.get(bin) ?? 0) >= CRATE_BIN_FROM);
}
