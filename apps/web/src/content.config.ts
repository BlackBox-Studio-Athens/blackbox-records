import { defineCollection, reference } from 'astro:content';
import { z } from 'zod';
import { publicContentLoader } from './lib/content-loader';
import {
  cmsBodySchema,
  createArtistsContentSchema,
  createReleasesContentSchema,
  createNewsContentSchema,
  createDistroContentSchema,
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

const artists = defineCollection({
  loader: publicContentLoader('artists', '**/*.{md,mdx}', './src/content/artists'),
  schema: ({ image }) =>
    createArtistsContentSchema(image).extend({
      editorial_body: cmsBodySchema.optional(),
      content_media: z.record(z.string(), image()).optional(),
    }),
});

const releases = defineCollection({
  loader: publicContentLoader('releases', '**/*.{md,mdx}', './src/content/releases'),
  schema: ({ image }) =>
    createReleasesContentSchema(image, { artist: reference('artists') }).extend({
      editorial_body: cmsBodySchema.optional(),
      content_media: z.record(z.string(), image()).optional(),
    }),
});

const news = defineCollection({
  loader: publicContentLoader('news', '**/*.{md,mdx}', './src/content/news'),
  schema: ({ image }) =>
    createNewsContentSchema(image).extend({
      editorial_body: cmsBodySchema.optional(),
      content_media: z.record(z.string(), image()).optional(),
    }),
});

const distro = defineCollection({
  loader: publicContentLoader('distro', '**/*.json', './src/content/distro'),
  schema: ({ image }) => createDistroContentSchema(image),
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
