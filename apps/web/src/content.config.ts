import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import {
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
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/artists' }),
  schema: ({ image }) => createArtistsContentSchema(image),
});

const releases = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/releases' }),
  schema: ({ image }) => createReleasesContentSchema(image, { artist: reference('artists') }),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/news' }),
  schema: ({ image }) => createNewsContentSchema(image),
});

const distro = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/distro' }),
  schema: ({ image }) => createDistroContentSchema(image),
});

const distroPage = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/distro-page' }),
  schema: distroPageContentSchema,
});

const navigation = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/navigation' }),
  schema: navigationContentSchema,
});

const socials = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/socials' }),
  schema: socialsContentSchema,
});

const settings = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/settings' }),
  schema: settingsContentSchema,
});

const newsletter = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/newsletter' }),
  schema: newsletterContentSchema,
});

const home = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/home' }),
  schema: ({ image }) => createHomeContentSchema(image),
});

const about = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/about' }),
  schema: ({ image }) => createAboutContentSchema(image),
});

const services = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/services' }),
  schema: ({ image }) => createServicesContentSchema(image),
});

const purchaseInformation = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/purchase-information' }),
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
