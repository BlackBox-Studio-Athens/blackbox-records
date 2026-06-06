import { buildFileCollection } from './decap-yaml-builder';

type BuildPageFileCollectionsOptions = {
  homeFields: string[];
  aboutFields: string[];
  servicesFields: string[];
  settingsFields: string[];
  newsletterFields: string[];
};

export function buildPageFileCollections({
  homeFields,
  aboutFields,
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
          file: 'src/content/home/site.json',
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
          file: 'src/content/about/site.json',
          mediaFolder: '.',
          publicFolder: './',
          fields: aboutFields,
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
          file: 'src/content/services/site.json',
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
          file: 'src/content/newsletter/site.json',
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
          file: 'src/content/settings/site.json',
          fields: settingsFields,
        },
      ],
    }),
  ];
}
