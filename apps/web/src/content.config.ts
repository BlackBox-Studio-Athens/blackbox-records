import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

import { buildBandcampEmbedUrl, buildTidalEmbedUrl } from './utils/music';

const bandcampEmbedUrl = z.string().refine((value) => buildBandcampEmbedUrl(value) === value, {
  message: 'Use the official Bandcamp iframe src from Share/Embed. Public album or track URLs are not valid embeds.',
});

const tidalUrl = z.string().refine((value) => buildTidalEmbedUrl(value) !== '', {
  message: 'Use a Tidal album, track, playlist, or video URL. Artist profile URLs are not embedded players.',
});

const artists = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/artists' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string(),
      genre: z.string(),
      country: z.string().optional(),
      image: image(),
      image_alt: z.string().optional(),
      bio: z.string(),
      profile_links: z
        .array(
          z.object({
            label: z.string(),
            url: z.url(),
          }),
        )
        .optional(),
      videos: z
        .array(
          z.object({
            title: z.string(),
            youtube_video_id: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
            description: z.string().optional(),
          }),
        )
        .optional(),
      upcoming_release: z.string().optional(),
      section_label: z.string().optional(),
    }),
});

const releases = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/releases' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      artist: reference('artists'),
      release_date: z.coerce.date(),
      cover_image: image(),
      cover_image_alt: z.string().optional(),
      merch_url: z.string().optional(),
      bandcamp_embed_url: bandcampEmbedUrl.optional(),
      tidal_url: tidalUrl.optional(),
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
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      summary: z.string(),
      image: image(),
      image_alt: z.string().optional(),
      section_label: z.string().optional(),
    }),
});

const distroGroupValues = [
  'Vinyl 12-inch',
  'Vinyl 10-inch',
  'Vinyl 7-inch',
  'CDs',
  'Clothes',
  'Tapes',
  'Other',
] as const;

const distro = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/distro' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      group: z.enum(distroGroupValues),
      artist_or_label: z.string(),
      image: image(),
      image_alt: z.string(),
      summary: z.string(),
      eyebrow: z.string().optional(),
      format: z.string().optional(),
      release_date: z.coerce.date().optional(),
      order: z.number().int().nonnegative(),
    }),
});

const distroPage = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/distro-page' }),
  schema: z.object({
    page_title: z.string(),
    page_description: z.string(),
    hero: z.object({
      section_label: z.string(),
      title: z.string(),
      intro: z.string(),
    }),
    group_intros: z.record(z.enum(distroGroupValues), z.string()),
  }),
});

const navigation = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/navigation' }),
  schema: z.object({
    title: z.string(),
    url: z.string(),
    order: z.number().int().nonnegative(),
    show_in_header: z.boolean(),
    show_in_footer: z.boolean(),
  }),
});

const socials = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/socials' }),
  schema: z.object({
    title: z.string(),
    url: z.string(),
    order: z.number().int().nonnegative(),
  }),
});

const settings = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/settings' }),
  schema: z.object({
    label_name: z.string(),
    established_year: z.number().int().positive(),
    url: z.url(),
    logo: z.string(),
    location: z.object({
      locality: z.string(),
      country: z.string(),
    }),
  }),
});

const newsletter = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/newsletter' }),
  schema: z.object({
    section_label: z.string(),
    title: z.string(),
    description: z.string(),
    placeholder: z.string(),
    button_label: z.string(),
    note: z.string(),
  }),
});

const home = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/home' }),
  schema: ({ image }) =>
    z.object({
      hero: z.object({
        tagline: z.string(),
        image: image(),
        image_alt: z.string(),
        scroll_indicator_text: z.string(),
      }),
      sections: z.array(
        z.discriminatedUnion('type', [
          z.object({
            type: z.literal('news'),
            section_label: z.string(),
            title: z.string(),
            link_text: z.string(),
            link_url: z.string(),
          }),
          z.object({
            type: z.literal('artists'),
            section_label: z.string(),
            title: z.string(),
            button_text: z.string(),
            button_link: z.string(),
          }),
          z.object({
            type: z.literal('distro'),
            section_label: z.string(),
            title: z.string(),
            link_text: z.string(),
            link_url: z.string(),
          }),
          z.object({
            type: z.literal('journey'),
            section_label: z.string(),
            title: z.string(),
            image: image(),
            image_alt: z.string(),
            paragraphs: z.array(z.string()),
            stats: z.array(
              z.object({
                key: z.string(),
                label: z.string(),
              }),
            ),
          }),
        ]),
      ),
    }),
});

const about = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/about' }),
  schema: ({ image }) =>
    z.object({
      hero: z.object({
        section_label: z.string(),
        title: z.string(),
        image: image(),
        image_alt: z.string(),
      }),
      sections: z.array(
        z.discriminatedUnion('type', [
          z.object({
            type: z.literal('lead'),
            text: z.string(),
          }),
          z.object({
            type: z.literal('story'),
            title: z.string(),
            paragraphs: z.array(z.string()),
          }),
          z.object({
            type: z.literal('quote'),
            text: z.string(),
            cite: z.string(),
          }),
          z.object({
            type: z.literal('contact'),
            title: z.string(),
            intro: z.string(),
            items: z.array(
              z.object({
                label: z.string(),
                value: z.string(),
              }),
            ),
          }),
          z.object({
            type: z.literal('stats'),
            items: z.array(
              z.object({
                key: z.string(),
                label: z.string(),
              }),
            ),
          }),
        ]),
      ),
    }),
});

const services = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/services' }),
  schema: ({ image }) =>
    z.object({
      hero: z.object({
        title: z.string(),
        intro: z.string(),
        cta_text: z.string(),
      }),
      sections: z.array(
        z.discriminatedUnion('type', [
          z.object({
            type: z.literal('services'),
            items: z.array(
              z.object({
                id: z.string(),
                title: z.string(),
                image: image(),
                image_alt: z.string(),
                summary: z.string(),
                bullets: z.array(z.string()).min(2),
                contact_note: z.string(),
                partner_name: z.string().optional(),
                partner_url: z.url().optional(),
              }),
            ),
          }),
          z.object({
            type: z.literal('process'),
            title: z.string(),
            intro: z.string(),
            steps: z
              .array(
                z.object({
                  title: z.string(),
                  body: z.string(),
                }),
              )
              .min(3),
          }),
          z.object({
            type: z.literal('inquiry'),
            title: z.string(),
            intro: z.string(),
            email: z.email(),
            submit_text: z.string(),
          }),
        ]),
      ),
    }),
});

export const collections = {
  artists,
  releases,
  news,
  distro,
  distroPage,
  navigation,
  socials,
  settings,
  newsletter,
  home,
  about,
  services,
};
