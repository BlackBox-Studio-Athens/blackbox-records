export type ArtistPrintRole = 'preview' | 'thumb' | 'detail';
export type ArtistPrintSlot = { width: number; height: number };

/** Largest image area per role, in CSS pixels. `detail` fills the artist hero column and stays near 560px tall with its border. */
export const artistPrintMaxima: Record<ArtistPrintRole, ArtistPrintSlot> = {
  preview: { width: 340, height: 390 },
  thumb: { width: 72, height: 54 },
  detail: { width: 544, height: 520 },
};

export const artistPrintWidths: Record<ArtistPrintRole, number[]> = {
  preview: [360, 540, 720],
  thumb: [80, 160],
  detail: [720, 1080, 1440],
};

const previewTilts = [-2.6, 2.1, -1.4, 3.0, -3.2, 1.6];
const thumbTilts = [-3, 2.5, -1.5, 3.5];

/** Fixed tilt sequence by roster index, so server and client agree. */
export function getArtistPrintTilt(role: ArtistPrintRole, index: number) {
  const tilts = role === 'thumb' ? thumbTilts : previewTilts;
  return tilts[((index % tilts.length) + tilts.length) % tilts.length]!;
}

/** Fit the source aspect ratio inside the role maximum; never crops or pads. */
export function getArtistPrintSlotSize(source: ArtistPrintSlot, max: ArtistPrintSlot): ArtistPrintSlot {
  const ratio = source.width / source.height;
  const width = Math.round(Math.min(max.width, max.height * ratio));
  return { width, height: Math.round(width / ratio) };
}
