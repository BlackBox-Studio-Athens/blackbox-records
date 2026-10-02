import * as React from 'react';
import { readPublicStoreListingPrices } from '@/components/store/StoreListingPricePresentation';
import { preorderBadges } from '@/platform/lib/preorder-estimate';

type Preorder = Awaited<ReturnType<typeof readPublicStoreListingPrices>>[number]['preorder'];

export default function ReleaseStoreLink({
  href,
  className,
  releaseDate,
}: {
  href: string;
  className: string;
  releaseDate?: string | undefined;
}) {
  const [preorder, setPreorder] = React.useState<Preorder>(null);
  React.useEffect(() => {
    const controller = new AbortController();
    const slug = href.split('/').filter(Boolean).at(-1);
    void readPublicStoreListingPrices(controller.signal, { scope: 'preorders' })
      .then((records) => {
        if (controller.signal.aborted) return;
        const record = records.find((item) => item.storeItemSlug === slug);
        setPreorder(
          record?.presentationState === 'ready' && record.availabilityState === 'stocked' ? record.preorder : null,
        );
      })
      .catch(() => {});
    return () => controller.abort();
  }, [href]);

  return (
    <>
      <a href={href} className={preorder ? `${className} preorder-action` : className}>
        {preorder ? 'Pre-order' : 'Shop release'}
      </a>
      {preorder && (
        <span className="flex flex-wrap items-center gap-2">
          {preorderBadges({ releaseDate, shipEstimate: preorder.shipEstimate, today: new Date() }).map((badge) => (
            <span key={badge} className={badge === 'Out now' ? 'store-item-card__release-status' : 'preorder-badge'}>
              {badge}
            </span>
          ))}
        </span>
      )}
    </>
  );
}
