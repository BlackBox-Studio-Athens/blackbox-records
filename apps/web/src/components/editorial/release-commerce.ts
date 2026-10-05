import type { CollectionEntry } from 'astro:content';
import { tracklistFormat, type Tracklist } from '@blackbox/content-model';

import { resolveLinkAttributes } from '@/platform/config/site';
import { getPrimaryReleaseStoreFormat, getStoreItemForRelease } from '@/lib/catalog-data';

export type ReleaseCommerceLink = {
  href: string;
  isNativeStoreLink: boolean;
  label: 'Buy merch' | 'Shop release';
  physicalFormat?: Tracklist['format'] | null;
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
      physicalFormat: tracklistFormat(getPrimaryReleaseStoreFormat(release.data.formats)),
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
