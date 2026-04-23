import type { CollectionEntry } from 'astro:content';

import { resolveLinkAttributes } from '../config/site';
import { getStoreItemForRelease } from './catalog-data';
import { resolveMerchHref } from '../utils/music';

export type ReleaseCommerceLink = {
  href: string;
  isNativeStoreLink: boolean;
  label: 'Buy merch' | 'View In Store';
  rel?: string;
  target?: '_blank';
};

export async function getReleaseCommerceLink(
  release: CollectionEntry<'releases'>,
): Promise<ReleaseCommerceLink | null> {
  const nativeStoreItem = await getStoreItemForRelease(release);

  if (nativeStoreItem) {
    return {
      href: nativeStoreItem.shopPath,
      isNativeStoreLink: true,
      label: 'View In Store',
    };
  }

  const merchHref = resolveMerchHref(release.data.merch_url, release.data.shop_collection_handle);
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
