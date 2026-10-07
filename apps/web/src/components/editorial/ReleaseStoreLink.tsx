import * as React from 'react';
import type { Tracklist } from '@blackbox/content-model';
import { readPublicStoreListingPrices } from '@/components/store/StoreListingPricePresentation';
import { buttonVariants } from '@/components/ui/button';
import {
  physicalBadgeState,
  releasePresentation,
  RELEASE_DETAIL_LINK_CLASS,
  type Listing,
  type ReleasePresentationEntry,
} from './release-presentation';

export default function ReleaseStoreLink({
  href,
  className,
  releaseDate,
  physicalFormat,
}: {
  href: string;
  className: string;
  releaseDate?: string | undefined;
  physicalFormat?: Tracklist['format'] | null | undefined;
}) {
  const slug = href.split('/').filter(Boolean).at(-1);
  const [record, setRecord] = React.useState<Listing>();
  React.useEffect(() => {
    const controller = new AbortController();
    void readPublicStoreListingPrices(controller.signal)
      .then((records) => {
        if (controller.signal.aborted) return;
        setRecord(records.find((item) => item.storeItemSlug === slug));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [slug]);

  const entry: ReleasePresentationEntry = {
    id: href,
    releaseDate,
    edition: physicalFormat && slug ? { kind: 'native', format: physicalFormat, storeSlug: slug } : { kind: 'none' },
  };
  const presentation = releasePresentation(entry, record);
  const buyable = presentation.state === 'preorder' || presentation.state === 'available';
  const physicalState = physicalBadgeState(presentation);
  const actionClassName = !physicalFormat
    ? className
    : buyable
      ? buttonVariants({
          size: 'lg',
          className: presentation.state === 'preorder' ? 'preorder-action' : 'purchase-action',
        })
      : RELEASE_DETAIL_LINK_CLASS;

  return (
    <>
      <a href={href} className={actionClassName}>
        {physicalFormat ? presentation.action : 'Shop release'}
      </a>
      {physicalFormat && presentation.badges.length > 0 && (
        <span className="flex flex-wrap items-center gap-2">
          {presentation.badges.map((badge, index) => (
            <span
              key={badge}
              className={badge.startsWith('Pre-order') ? 'preorder-badge' : 'store-item-card__release-status'}
              data-availability-state={
                physicalState && index === presentation.badges.length - 1 ? physicalState : undefined
              }
            >
              {badge}
            </span>
          ))}
        </span>
      )}
      {physicalFormat && presentation.shipping && (
        <span className="text-sm text-muted-foreground">{presentation.shipping}</span>
      )}
    </>
  );
}
