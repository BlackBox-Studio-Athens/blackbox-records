import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type SiteNavigationItem = {
  id: string;
  title: string;
  url: string;
  order: number;
  show_in_header: boolean;
  show_in_footer: boolean;
};

export type SiteSocialItem = {
  id: string;
  title: string;
  url: string;
  order: number;
};

export type SiteLabelSettings = CollectionEntry<'settings'>['data'];
export type HomeContent = CollectionEntry<'home'>['data'];
export type AboutContent = CollectionEntry<'about'>['data'];

function sortByOrderAndTitle<T extends { order: number; title: string }>(left: T, right: T) {
  if (left.order !== right.order) {
    return left.order - right.order;
  }

  return left.title.localeCompare(right.title);
}

export async function getNavigationItems(): Promise<SiteNavigationItem[]> {
  return (await getCollection('navigation'))
    .map((item) => ({
      id: item.id,
      ...item.data,
    }))
    .sort(sortByOrderAndTitle);
}

export async function getHeaderNavigationItems() {
  return (await getNavigationItems()).filter((item) => item.show_in_header);
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
