import { z } from 'astro/zod';

import { DISTRO_GROUP_VALUES } from './distro-data';

const requiredAltText = z.string().trim().min(1, 'Describe the visible image for people who cannot see it.');

export function createDistroContentSchema<TImageSchema extends z.ZodType>(image: () => TImageSchema) {
  return z.object({
    title: z.string(),
    group: z.enum(DISTRO_GROUP_VALUES),
    artist_or_label: z.string(),
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
    summary: z.string(),
    eyebrow: z.string().optional(),
    format: z.string().optional(),
    release_date: z.coerce.date().optional(),
    order: z.number().int().nonnegative(),
  });
}
