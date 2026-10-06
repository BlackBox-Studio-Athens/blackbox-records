import * as React from 'react';
import type { Tracklist } from '@blackbox/content-model';
import { readPublicStoreListingPrices } from '@/components/store/StoreListingPricePresentation';
import { buttonVariants } from '@/components/ui/button';
import { releasePresentation, type Listing, type ReleasePresentationEntry } from './release-presentation';

export default function ReleaseStoreLink({
  href,
  className,
  releaseDate,
  releaseStage,
  physicalFormat,
}: {
  href: string;
  className: string;
  releaseDate?: string | undefined;
  releaseStage?: 'upcoming' | 'released' | undefined;
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
    releaseStage,
    edition: physicalFormat && slug ? { kind: 'native', format: physicalFormat, storeSlug: slug } : { kind: 'none' },
  };
  const presentation = releasePresentation(entry, record);
  const buyable = presentation.state === 'preorder' || presentation.state === 'available';
  const actionClassName = physicalFormat
    ? buttonVariants({
        variant: buyable ? 'default' : 'outline',
        size: 'lg',
        className:
          presentation.state === 'preorder'
            ? 'preorder-action'
            : presentation.state === 'available'
              ? 'purchase-action'
              : undefined,
      })
    : className;

  return (
    <>
      <a href={href} className={actionClassName}>
        {physicalFormat ? presentation.action : 'Shop release'}
      </a>
      {physicalFormat && presentation.badges.length > 0 && (
        <span className="flex flex-wrap items-center gap-2">
          {presentation.badges.map((badge) => (
            <span
              key={badge}
              className={badge.startsWith('Pre-order') ? 'preorder-badge' : 'store-item-card__release-status'}
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
