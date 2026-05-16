import { buildFileCollection } from './decap-yaml-builder';

type BuildPageFileCollectionsOptions = {
  homeFields: string[];
  aboutFields: string[];
  servicesFields: string[];
  settingsFields: string[];
};

export function buildPageFileCollections({
  homeFields,
  aboutFields,
  servicesFields,
  settingsFields,
}: BuildPageFileCollectionsOptions) {
  return [
    buildFileCollection({
      name: 'home',
      label: 'Home',
      create: false,
      delete: false,
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
      name: 'settings',
      label: 'Settings',
      create: false,
      delete: false,
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
