import { defineCollection, reference } from 'astro:content';
import { z } from 'zod';
import { publicContentLoader } from './lib/content-loader';
import {
  cmsBodySchema,
  createArtistsContentSchema,
  createReleasesContentSchema,
  createNewsContentSchema,
  createShowsContentSchema,
  createDistroContentSchema,
  formatArtistCountries,
  projectDistroValues,
  readDistroTracklist,
  distroPageContentSchema,
  navigationContentSchema,
  socialsContentSchema,
  settingsContentSchema,
  newsletterContentSchema,
  createHomeContentSchema,
  createAboutContentSchema,
  createServicesContentSchema,
  purchaseInformationSchema,
} from '@blackbox/content-model';

const storeIdentity = z
  .object({ storeItemSlug: z.string().min(1), variantId: z.string().min(1) })
  .strict()
  .nullable()
  .optional();

const artists = defineCollection({
  loader: publicContentLoader('artists', '**/*.{md,mdx}', './src/content/artists'),
  schema: ({ image }) =>
    createArtistsContentSchema(image)
      .extend({
        editorial_body: cmsBodySchema.optional(),
        content_media: z.record(z.string(), image()).optional(),
      })
      .transform((artist) => ({
        ...artist,
        country: artist.country ? formatArtistCountries(artist.country) : undefined,
      })),
});

const releases = defineCollection({
  loader: publicContentLoader('releases', '**/*.{md,mdx}', './src/content/releases'),
  schema: ({ image }) =>
    createReleasesContentSchema(image, { artist: reference('artists') })
      .extend({
        store_item: storeIdentity,
        editorial_body: cmsBodySchema.optional(),
        content_media: z.record(z.string(), image()).optional(),
      })
      .refine((release) => release.release_stage === 'upcoming' || !!release.release_date, {
        path: ['release_date'],
        message: 'Released records need a release date.',
      }),
});

const news = defineCollection({
  loader: publicContentLoader('news', '**/*.{md,mdx}', './src/content/news'),
  schema: ({ image }) =>
    createNewsContentSchema(image, { artist: reference('artists') }).extend({
      editorial_body: cmsBodySchema.optional(),
      content_media: z.record(z.string(), image()).optional(),
    }),
});

const shows = defineCollection({
  loader: publicContentLoader('shows', '**/*.json', './src/content/shows'),
  schema: ({ image }) => createShowsContentSchema(image),
});

const distro = defineCollection({
  loader: publicContentLoader('distro', '**/*.json', './src/content/distro'),
  schema: ({ image }) =>
    createDistroContentSchema(image)
      .extend({ store_item: storeIdentity })
      .transform((data) => ({
        ...data,
        ...projectDistroValues(data),
        // Restated with their schema types; projectDistroValues returns untyped values.
        group: data.format,
        format:
          data.format_override || (data.format === 'CDs' ? 'CD' : data.format === 'Tapes' ? 'Cassette' : data.format),
        tracklist: readDistroTracklist(data.tracklist, data.format),
      })),
});

const distroPage = defineCollection({
  loader: publicContentLoader('distroPage', '**/*.json', './src/content/distro-page'),
  schema: distroPageContentSchema,
});

const navigation = defineCollection({
  loader: publicContentLoader('navigation', '**/*.json', './src/content/navigation'),
  schema: navigationContentSchema,
});

const socials = defineCollection({
  loader: publicContentLoader('socials', '**/*.json', './src/content/socials'),
  schema: socialsContentSchema,
});

const settings = defineCollection({
  loader: publicContentLoader('settings', '**/*.json', './src/content/settings'),
  schema: settingsContentSchema,
});

const newsletter = defineCollection({
  loader: publicContentLoader('newsletter', '**/*.json', './src/content/newsletter'),
  schema: newsletterContentSchema,
});

const home = defineCollection({
  loader: publicContentLoader('home', '**/*.json', './src/content/home'),
  schema: ({ image }) => createHomeContentSchema(image),
});

const about = defineCollection({
  loader: publicContentLoader('about', '**/*.json', './src/content/about'),
  schema: ({ image }) => createAboutContentSchema(image),
});

const services = defineCollection({
  loader: publicContentLoader('services', '**/*.json', './src/content/services'),
  schema: ({ image }) => createServicesContentSchema(image),
});

const purchaseInformation = defineCollection({
  loader: publicContentLoader('purchaseInformation', '**/*.json', './src/content/purchase-information'),
  schema: purchaseInformationSchema,
});

export const collections = {
  purchaseInformation,
  artists,
  releases,
  news,
  shows,
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
