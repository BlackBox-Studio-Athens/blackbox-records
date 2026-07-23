import { buildFileCollection } from './decap-yaml-builder';
import { decapCollectionDescriptions } from './decap-editorial-copy';

type BuildPageFileCollectionsOptions = {
  homeFields: string[];
  aboutFields: string[];
  distroPageFields: string[];
  servicesFields: string[];
  settingsFields: string[];
  newsletterFields: string[];
};

export function buildPageFileCollections({
  homeFields,
  aboutFields,
  distroPageFields,
  servicesFields,
  settingsFields,
  newsletterFields,
}: BuildPageFileCollectionsOptions) {
  return {
    home: buildFileCollection({
      name: 'home',
      label: 'Home',
      description: decapCollectionDescriptions.home,
      create: false,
      delete: false,
      extension: 'json',
      format: 'json',
      files: [
        {
          name: 'home-site',
          label: 'Home Content',
          file: 'apps/web/src/content/home/site.json',
          mediaFolder: '.',
          publicFolder: './',
          fields: homeFields,
        },
      ],
    }),
    about: buildFileCollection({
      name: 'about',
      label: 'About',
      description: decapCollectionDescriptions.about,
      create: false,
      delete: false,
      extension: 'json',
      format: 'json',
      files: [
        {
          name: 'about-site',
          label: 'About Content',
          file: 'apps/web/src/content/about/site.json',
          mediaFolder: '.',
          publicFolder: './',
          fields: aboutFields,
        },
      ],
    }),
    distroPage: buildFileCollection({
      name: 'distro-page',
      label: 'Store — Distro Page Copy',
      description: decapCollectionDescriptions.distroPage,
      create: false,
      delete: false,
      extension: 'json',
      format: 'json',
      files: [
        {
          name: 'distro-page-site',
          label: 'Distro Page Content',
          file: 'apps/web/src/content/distro-page/site.json',
          fields: distroPageFields,
        },
      ],
    }),
    services: buildFileCollection({
      name: 'services',
      label: 'Services',
      description: decapCollectionDescriptions.services,
      create: false,
      delete: false,
      extension: 'json',
      format: 'json',
      files: [
        {
          name: 'services-site',
          label: 'Services Content',
          file: 'apps/web/src/content/services/site.json',
          mediaFolder: '.',
          publicFolder: './',
          fields: servicesFields,
        },
      ],
    }),
    newsletter: buildFileCollection({
      name: 'newsletter',
      label: 'Newsletter',
      description: decapCollectionDescriptions.newsletter,
      create: false,
      delete: false,
      extension: 'json',
      format: 'json',
      files: [
        {
          name: 'newsletter-site',
          label: 'Newsletter Content',
          file: 'apps/web/src/content/newsletter/site.json',
          fields: newsletterFields,
        },
      ],
    }),
    settings: buildFileCollection({
      name: 'settings',
      label: 'Advanced — Site Settings',
      description: decapCollectionDescriptions.settings,
      create: false,
      delete: false,
      extension: 'json',
      format: 'json',
      files: [
        {
          name: 'settings-site',
          label: 'Site Settings',
          file: 'apps/web/src/content/settings/site.json',
          fields: settingsFields,
        },
      ],
    }),
  };
}
