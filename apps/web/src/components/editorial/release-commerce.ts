import type { CollectionEntry } from 'astro:content';
import { tracklistFormat, type Tracklist } from '@blackbox/content-model';

import { resolveLinkAttributes } from '@/platform/config/site';
import { getPrimaryReleaseStoreFormat, getStoreItemForRelease } from '@/lib/catalog-data';
import type { ReleasePresentationEntry } from './release-presentation';

export type ReleaseCommerceLink = {
  href: string;
  isNativeStoreLink: boolean;
  label: 'Buy merch' | 'Shop release';
  physicalFormat?: Tracklist['format'] | null;
  rel?: string;
  target?: '_blank';
};

export function getReleasePresentationEntry(
  release: CollectionEntry<'releases'>,
  commerceLink?: ReleaseCommerceLink | null,
): ReleasePresentationEntry {
  const format = commerceLink?.physicalFormat ?? tracklistFormat(getPrimaryReleaseStoreFormat(release.data.formats));
  const storeSlug = commerceLink?.isNativeStoreLink ? commerceLink.href.split('/').filter(Boolean).at(-1) : undefined;
  return {
    id: release.id,
    priority: release.data.releases_priority,
    releaseDate: release.data.release_date?.toISOString().slice(0, 10),
    edition:
      format && (!commerceLink || commerceLink.isNativeStoreLink)
        ? storeSlug
          ? { kind: 'native', format, storeSlug }
          : { kind: 'announced', format }
        : { kind: 'none' },
  };
}

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
