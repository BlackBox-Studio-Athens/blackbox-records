import { buildFileCollection } from './decap-yaml-builder';

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
  return [
    buildFileCollection({
      name: 'home',
      label: 'Home',
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
    buildFileCollection({
      name: 'about',
      label: 'About',
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
    buildFileCollection({
      name: 'distro-page',
      label: 'Distro Page',
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
    buildFileCollection({
      name: 'services',
      label: 'Services',
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
    buildFileCollection({
      name: 'newsletter',
      label: 'Newsletter',
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
    buildFileCollection({
      name: 'settings',
      label: 'Settings',
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
  ];
}
