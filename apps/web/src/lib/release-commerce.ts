import type { CollectionEntry } from 'astro:content';

import { resolveLinkAttributes } from '../config/site';
import { getStoreItemForRelease } from './catalog-data';

export type ReleaseCommerceLink = {
  href: string;
  isNativeStoreLink: boolean;
  label: 'Buy merch' | 'Shop release';
  rel?: string;
  target?: '_blank';
};

export async function getReleaseCommerceLink(
  release: CollectionEntry<'releases'>,
): Promise<ReleaseCommerceLink | null> {
  const nativeStoreItem = await getStoreItemForRelease(release);

  if (nativeStoreItem) {
    return {
      href: nativeStoreItem.storePath,
      isNativeStoreLink: true,
      label: 'Shop release',
    };
  }

  const merchHref = release.data.merch_url || '';
  if (!merchHref) {
    return null;
  }

  const linkAttributes = resolveLinkAttributes(merchHref);

  return {
    href: linkAttributes.href,
    isNativeStoreLink: false,
    label: 'Buy merch',
    ...(linkAttributes.rel ? { rel: linkAttributes.rel } : {}),
    ...(linkAttributes.target ? { target: linkAttributes.target } : {}),
  };
}
