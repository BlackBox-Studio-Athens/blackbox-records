import { buildFileCollection } from './decap-yaml-builder';
import { decapCollectionDescriptions, decapSitePageDescriptions } from './decap-editorial-copy';
import { decapCollectionMedia } from './decap-media';

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
    sitePages: buildFileCollection({
      name: 'site-pages',
      label: 'Site Pages',
      description: decapCollectionDescriptions.sitePages,
      create: false,
      delete: false,
      extension: 'json',
      format: 'json',
      files: [
        {
          name: 'home-site',
          label: 'Home Content',
          description: decapSitePageDescriptions.home,
          file: 'apps/web/src/content/home/site.json',
          mediaFolder: decapCollectionMedia.home.mediaFolder,
          publicFolder: decapCollectionMedia.home.publicFolder,
          fields: homeFields,
        },
        {
          name: 'about-site',
          label: 'About Content',
          description: decapSitePageDescriptions.about,
          file: 'apps/web/src/content/about/site.json',
          mediaFolder: decapCollectionMedia.about.mediaFolder,
          publicFolder: decapCollectionMedia.about.publicFolder,
          fields: aboutFields,
        },
        {
          name: 'services-site',
          label: 'Services Content',
          description: decapSitePageDescriptions.services,
          file: 'apps/web/src/content/services/site.json',
          mediaFolder: decapCollectionMedia.services.mediaFolder,
          publicFolder: decapCollectionMedia.services.publicFolder,
          fields: servicesFields,
        },
        {
          name: 'newsletter-site',
          label: 'Newsletter Content',
          description: decapSitePageDescriptions.newsletter,
          file: 'apps/web/src/content/newsletter/site.json',
          fields: newsletterFields,
        },
        {
          name: 'distro-page-site',
          label: 'Distro Page Content',
          description: decapSitePageDescriptions.distroPage,
          file: 'apps/web/src/content/distro-page/site.json',
          fields: distroPageFields,
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
