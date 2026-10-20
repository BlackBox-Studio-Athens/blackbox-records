import * as React from 'react';
import type { Tracklist } from '@blackbox/content-model';
import { Disc3 } from 'lucide-react';
import StoreBuyIcon from '@/components/store/StoreBuyIcon';
import { readPublicStoreListingPrices } from '@/components/store/StoreListingPricePresentation';
import { createProjectRelativeUrl } from '@/platform/config/site';
import {
  physicalStatusState,
  releaseActionClassName,
  releasePresentation,
  type Listing,
  type ReleasePresentationEntry,
} from './release-presentation';

export default function ReleaseStoreLink({
  href,
  className,
  physicalFormat,
  projected,
  announced = false,
  children,
  formats,
}: {
  href: string;
  className: string;
  physicalFormat?: Tracklist['format'] | null | undefined;
  /** The rendered projection's record; a live read replaces it only when it succeeds. */
  projected?: Listing | undefined;
  announced?: boolean;
  children?: React.ReactNode;
  formats?: React.ReactNode;
}) {
  const slug = href.split('/').filter(Boolean).at(-1);
  const [record, setRecord] = React.useState(projected);
  const purchaseRef = React.useRef<HTMLAnchorElement>(null);
  const entry: ReleasePresentationEntry = {
    id: href,
    edition:
      physicalFormat && slug
        ? announced
          ? { kind: 'announced', format: physicalFormat }
          : { kind: 'native', format: physicalFormat, storeSlug: slug }
        : { kind: 'none' },
  };
  React.useEffect(() => {
    if (announced) return;
    const controller = new AbortController();
    void readPublicStoreListingPrices(controller.signal)
      .then((records) => {
        if (controller.signal.aborted) return;
        const next = records.find((item) => item.storeItemSlug === slug);
        const action = purchaseRef.current;
        if (
          action?.isConnected &&
          action.ownerDocument.activeElement === action &&
          !releasePresentation(entry, next).action
        ) {
          (
            action
              .closest('.release-detail-purchase')
              ?.querySelector<HTMLAnchorElement>('.release-card-formats .release-format-link[href]') ??
            action.closest('section')?.querySelector<HTMLAnchorElement>('.release-card-title-link[href]')
          )?.focus();
        }
        setRecord(next);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [slug, announced, physicalFormat, href]);
  const presentation = releasePresentation(entry, record);
  const physicalState = physicalStatusState(presentation);
  const actionClassName = physicalFormat ? releaseActionClassName(presentation) : className;
  if (!physicalFormat)
    return (
      <div className="release-edition-actions">
        <a href={href} className={className}>
          Shop release
        </a>
        {children}
      </div>
    );
  const buyable = presentation.state === 'preorder' || presentation.state === 'available';

  return (
    <>
      <div className="release-edition-actions">
        {buyable ? (
          <a ref={purchaseRef} href={href} className={actionClassName}>
            {physicalFormat === 'vinyl' ? (
              <Disc3 className="release-vinyl-icon" size={18} aria-hidden="true" />
            ) : (
              <StoreBuyIcon
                formatGroup={
                  physicalFormat === 'cd' ? 'CDs' : physicalFormat === 'cassette' ? 'Tapes' : 'Vinyl 12-inch'
                }
              />
            )}
            <span>{presentation.action}</span>
          </a>
        ) : (
          <>
            {physicalState && (
              <span className="release-physical-status" data-availability-state={physicalState}>
                {presentation.status}
              </span>
            )}
          </>
        )}
        {children}
      </div>
      <div className="release-edition-facts">
        {formats}
        {presentation.shipping && (
          <span className="release-edition-fact text-sm text-muted-foreground">{presentation.shipping}</span>
        )}
        {presentation.state === 'preorder' && (
          <a className="release-edition-fact release-format-link" href={createProjectRelativeUrl('/terms/')}>
            Pre-order &amp; delivery information
          </a>
        )}
      </div>
    </>
  );
}
