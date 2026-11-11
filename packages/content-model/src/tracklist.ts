import { z } from 'zod';
import { parseDuration, type DurationSeconds } from './values';

export const TRACK_SIDE_LABELS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'] as [string, ...string[]];
export const trackSchema = z
  .object({
    title: z.string().trim().min(1, 'Enter the track title.').max(300),
    duration: z
      .number()
      .int()
      .min(0)
      .max(Number.MAX_SAFE_INTEGER)
      .transform((value) => value as DurationSeconds)
      .optional(),
  })
  .strict();
export const trackSideSchema = z
  .object({
    label: z.enum(TRACK_SIDE_LABELS),
    tracks: z.array(trackSchema).max(99),
  })
  .strict();
export const trackDiscSchema = z.object({ tracks: z.array(trackSchema).max(99) }).strict();
export const distroTracklistSchema = z
  .union([
    z.object({ sides: z.array(trackSideSchema).max(26) }).strict(),
    z.object({ discs: z.array(trackDiscSchema).max(26) }).strict(),
  ])
  .superRefine((tracklist, context) => {
    if (!('sides' in tracklist)) return;
    const labels = new Set<string>();
    tracklist.sides.forEach((side, index) => {
      if (labels.has(side.label))
        context.addIssue({
          code: 'custom',
          path: ['sides', index, 'label'],
          message: 'Each side needs a different letter.',
        });
      labels.add(side.label);
    });
  });

/** Read a legacy duration without changing stored content. */
export function readDuration(value: unknown): DurationSeconds | null {
  if (typeof value === 'string') return parseDuration(value);
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? (value as DurationSeconds) : null;
}
export const tracklistSchema = z
  .discriminatedUnion('format', [
    z.object({ format: z.literal('vinyl'), sides: z.array(trackSideSchema).max(26) }).strict(),
    z.object({ format: z.literal('cassette'), sides: z.array(trackSideSchema).max(26) }).strict(),
    z.object({ format: z.literal('cd'), discs: z.array(trackDiscSchema).max(26) }).strict(),
  ])
  .superRefine((tracklist, context) => {
    if (tracklist.format === 'cd') return;
    const labels = new Set<string>();
    tracklist.sides.forEach((side, index) => {
      if (labels.has(side.label))
        context.addIssue({
          code: 'custom',
          path: ['sides', index, 'label'],
          message: 'Each side needs a different letter.',
        });
      labels.add(side.label);
    });
  });

export type Track = z.infer<typeof trackSchema>;
export type TrackSide = z.infer<typeof trackSideSchema>;
export type TrackDisc = z.infer<typeof trackDiscSchema>;
export type Tracklist = z.infer<typeof tracklistSchema>;

export function tracklistFormat(format: string | null | undefined): Tracklist['format'] | null {
  if (!format) return null;
  if (/\bcds?\b/i.test(format)) return 'cd';
  if (/\b(cassettes?|tapes?)\b/i.test(format)) return 'cassette';
  if (/\b(vinyl|lp)\b|\d+["″]|\binch\b/i.test(format)) return 'vinyl';
  return null;
}

export function distroTracklistMatches(format: unknown, tracklist: unknown): boolean {
  if (typeof format !== 'string' || !tracklist || typeof tracklist !== 'object') return true;
  const type = tracklistFormat(format);
  const value = tracklist as Record<string, unknown>;
  if ('discs' in value) return type === 'cd';
  if ('sides' in value) return type === 'vinyl' || type === 'cassette';
  return true;
}

export function readDistroTracklist(tracklist: unknown, format: string): Tracklist | null {
  const parsed = distroTracklistSchema.safeParse(tracklist);
  if (!parsed.success) return null;
  const type = tracklistFormat(format);
  if ('discs' in parsed.data && type === 'cd') return { format: 'cd', discs: parsed.data.discs };
  if ('sides' in parsed.data && (type === 'vinyl' || type === 'cassette'))
    return { format: type, sides: parsed.data.sides };
  return null;
}

export function tracklistGroups(tracklist: Tracklist | null | undefined, format: string | null | undefined) {
  if (!tracklist || tracklist.format !== tracklistFormat(format)) return [];
  if (tracklist.format === 'cd')
    return tracklist.discs
      .map((disc, index) => ({
        heading: tracklist.discs.length > 1 ? `Disc ${index + 1}` : '',
        tracks: disc.tracks.map((track, number) => ({
          ...track,
          position: tracklist.discs.length > 1 ? `${index + 1}-${number + 1}` : String(number + 1),
        })),
      }))
      .filter((group) => group.tracks.length > 0);
  return tracklist.sides
    .map((side) => ({
      heading: `Side ${side.label}`,
      tracks: side.tracks.map((track, number) => ({ ...track, position: `${side.label}${number + 1}` })),
    }))
    .filter((group) => group.tracks.length > 0);
}
