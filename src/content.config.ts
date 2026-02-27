import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const artists = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/artists' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    genre: z.string(),
    country: z.string().optional(),
    image: z.string(),
    image_alt: z.string().optional(),
    bio: z.string(),
    upcoming_release: z.string().optional(),
    section_label: z.string().optional(),
  }),
});

const releases = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/releases' }),
  schema: z.object({
    title: z.string(),
    artist_slug: z.string(),
    release_date: z.coerce.date(),
    cover_image: z.string(),
    cover_image_alt: z.string().optional(),
    merch_url: z.string().optional(),
    bandcamp_embed_url: z.string().optional(),
    tidal_url: z.string().optional(),
    summary: z.string().optional(),
    formats: z.array(z.string()).optional(),
    credits: z
      .array(
        z.object({
          role: z.string(),
          name: z.string(),
        }),
      )
      .optional(),
  }),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    image: z.string(),
    image_alt: z.string().optional(),
    section_label: z.string().optional(),
  }),
});

export const collections = {
  artists,
  releases,
  news,
};
