// Loaded on demand by StorePreorderShowcase. Static zod/mini member imports tree-shake to the validators used here,
// keeping Home's after-load chunk small; full Zod stays at the Worker and cart money boundaries.
import * as z from 'zod/mini';

const isLocalPath = (value: string) => value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\');
const isImageUrl = (value: string) =>
  isLocalPath(value) || (URL.canParse(value) && new URL(value).protocol === 'https:');
export const nonEmpty = z.string().check(z.minLength(1));
const clipId = z.string().check(z.regex(/^[A-Za-z0-9_-]{11}$/));
const localPath = z.string().check(z.refine(isLocalPath));
const imageUrl = z.string().check(z.refine(isImageUrl));
// Each candidate is "<url> <width>w"; Images URLs contain commas, so candidates split on a comma plus whitespace.
const imageSrcSet = z.string().check(
  z.refine((value) =>
    value.split(/,\s+/).every((candidate) => {
      const match = /^(\S+) \d+w$/.exec(candidate.trim());
      return !!match && isImageUrl(match[1]!);
    }),
  ),
);
const candidateSchema = z.object({
  slug: nonEmpty,
  title: nonEmpty,
  artist: nonEmpty,
  artistPath: z.optional(z.nullable(localPath)),
  option: nonEmpty,
  storePath: localPath,
  releaseDate: z.nullable(z.iso.date()),
  coverUrl: imageUrl,
  coverSrcSet: z.optional(imageSrcSet),
  firstClipId: z.nullable(clipId),
  clips: z.optional(
    z.array(
      z.object({
        id: clipId,
        title: nonEmpty,
        posterUrl: z.nullable(imageUrl),
        backgroundVideoUrl: z.optional(z.nullable(imageUrl)),
        backgroundVideoDesktopUrl: z.optional(z.nullable(imageUrl)),
      }),
    ),
  ),
  artistPhotoUrl: z.nullable(imageUrl),
  artistPhotoSrcSet: z.optional(imageSrcSet),
  summary: z.optional(z.nullable(z.string())),
  trackCount: z.optional(z.nullable(z.int().check(z.positive()))),
  recording: z.optional(z.nullable(z.string())),
  listen: z.optional(
    z.nullable(
      z.object({
        releaseId: nonEmpty,
        bandcampEmbedUrl: z.nullable(z.url().check(z.startsWith('https://bandcamp.com/EmbeddedPlayer/'))),
        tidalEmbedUrl: z.nullable(z.url().check(z.startsWith('https://embed.tidal.com/'))),
      }),
    ),
  ),
});
const estimateSchema = z.union([
  z.object({
    kind: z.literal('month'),
    month: z.string().check(z.regex(/^\d{4}-(0[1-9]|1[0-2])$/)),
    part: z.nullable(z.enum(['early', 'mid', 'late'])),
  }),
  z.object({ kind: z.literal('date'), date: z.iso.date() }),
]);

export const candidatesSchema = z.array(candidateSchema);
export const shipEstimateSchema = z.nullable(estimateSchema);
export type StorePreorderShowcaseCandidate = z.infer<typeof candidateSchema>;
