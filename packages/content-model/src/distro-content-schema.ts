import { tracklistSchema } from './tracklist';
import { z } from 'zod';

import { DISTRO_GROUP_VALUES } from './validation';
import { richTextSchema } from './prose';
import { bandcampEmbedUrlSchema, tidalUrlSchema } from './schemas';

const requiredAltText = z.string().trim().min(1, 'Describe the visible image for people who cannot see it.');
const requiredText = z.string().trim().min(1, 'Enter a value.');

export function createDistroContentSchema<TImageSchema extends z.ZodType>(image: () => TImageSchema) {
  return z.object({
    title: requiredText,
    group: z.enum(DISTRO_GROUP_VALUES),
    artist_or_label: requiredText,
    image: image(),
    image_alt: requiredAltText,
    gallery: z
      .array(
        z.object({
          image: image(),
          image_alt: requiredAltText,
        }),
      )
      .optional(),
    tracklist: tracklistSchema.nullish(),
    summary: requiredText,
    summary_rich: richTextSchema.nullish(),
    bandcamp_embed_url: bandcampEmbedUrlSchema.optional(),
    tidal_url: tidalUrlSchema.optional(),
    eyebrow: z.string().optional(),
    format: z.string().optional(),
    release_date: z.coerce.date().optional(),
    order: z.number().int().nonnegative(),
  });
}
