import type { CollectionEntry } from 'astro:content';
import { SITE_PAGES, type SitePagePath } from '@blackbox/content-model';
import { getCollection, getEntry } from '@/lib/content-reader';

export type SiteNavigationItem = {
  id: string;
  title: string;
  url: SitePagePath;
  order: number;
  show_in_header: boolean;
  show_in_footer: boolean;
};

export type NavigationLink = Pick<SiteNavigationItem, 'id' | 'title' | 'url'>;
type SectionLink = NavigationLink & { url: Exclude<SitePagePath, '/'> };

// Home is structural: the logo on desktop and the first Menu item on phones. Editors
// choose the sections after it, and the navigation schema keeps Home out of them.
export type MainNavigation = { home: NavigationLink & { url: '/' }; sections: SectionLink[] };

export type SiteSocialItem = {
  id: string;
  title: string;
  url: string;
  order: number;
};

export type SiteLabelSettings = CollectionEntry<'settings'>['data'];
export type NewsletterContent = CollectionEntry<'newsletter'>['data'];
export type HomeContent = CollectionEntry<'home'>['data'];
export type AboutContent = CollectionEntry<'about'>['data'];
export type ServicesContent = CollectionEntry<'services'>['data'];
export type DistroPageContent = CollectionEntry<'distroPage'>['data'];

function sortByOrderAndTitle<T extends { order: number; title: string }>(left: T, right: T) {
  if (left.order !== right.order) {
    return left.order - right.order;
  }

  return left.title.localeCompare(right.title);
}

async function getNavigationItems(): Promise<SiteNavigationItem[]> {
  return (await getCollection('navigation'))
    .map((item) => ({
      id: item.id,
      ...item.data,
    }))
    .sort(sortByOrderAndTitle);
}

export async function getMainNavigation(): Promise<MainNavigation> {
  const [home] = SITE_PAGES;
  return {
    home: { id: 'home', title: home.label, url: home.path },
    sections: (await getNavigationItems()).filter(
      (item): item is SiteNavigationItem & SectionLink => item.show_in_header && item.url !== '/',
    ),
  };
}

export async function getFooterNavigationItems() {
  return (await getNavigationItems()).filter((item) => item.show_in_footer);
}

export async function getSocialItems(): Promise<SiteSocialItem[]> {
  return (await getCollection('socials'))
    .map((item) => ({
      id: item.id,
      ...item.data,
    }))
    .sort(sortByOrderAndTitle);
}

export async function getLabelSettings(): Promise<SiteLabelSettings> {
  const siteSettings = await getEntry('settings', 'site');
  if (!siteSettings) {
    throw new Error('Missing site settings entry at src/content/settings/site.json.');
  }

  return siteSettings.data;
}

export async function getNewsletterContent(): Promise<NewsletterContent> {
  const newsletterContent = await getEntry('newsletter', 'site');
  if (!newsletterContent) {
    throw new Error('Missing newsletter content entry at src/content/newsletter/site.json.');
  }

  return newsletterContent.data;
}

export async function getHomeContent(): Promise<HomeContent> {
  const homeContent = await getEntry('home', 'site');
  if (!homeContent) {
    throw new Error('Missing home content entry at src/content/home/site.json.');
  }

  return homeContent.data;
}

export async function getAboutContent(): Promise<AboutContent> {
  const aboutContent = await getEntry('about', 'site');
  if (!aboutContent) {
    throw new Error('Missing about content entry at src/content/about/site.json.');
  }

  return aboutContent.data;
}

export async function getServicesContent(): Promise<ServicesContent> {
  const servicesContent = await getEntry('services', 'site');
  if (!servicesContent) {
    throw new Error('Missing services content entry at src/content/services/site.json.');
  }

  return servicesContent.data;
}

export async function getDistroPageContent(): Promise<DistroPageContent> {
  const distroPageContent = await getEntry('distroPage', 'site');
  if (!distroPageContent) {
    throw new Error('Missing distro page content entry at src/content/distro-page/site.json.');
  }

  return distroPageContent.data;
}
