import { getPurchaseInformation, isPurchaseInformationDraft } from '@/lib/purchase-information';
import type { ApprovedPurchaseInformation } from '@/lib/purchase-information-schema';

const linkClass = 'inline-flex min-h-11 items-center underline underline-offset-4';

export function PrivacyLink({
  information = getPurchaseInformation(),
}: {
  information?: ApprovedPurchaseInformation | null;
}) {
  return information ? (
    <a className={linkClass} href={`${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/privacy/`}>
      Privacy information
    </a>
  ) : null;
}

export default function PurchaseInformation({
  information = getPurchaseInformation(),
}: {
  information?: ApprovedPurchaseInformation | null;
}) {
  const termsHref = `${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/terms/`;
  return (
    <div className="space-y-2 text-xs leading-6 text-muted-foreground" data-purchase-information>
      {import.meta.env.DEV && information && isPurchaseInformationDraft && (
        <p className="font-semibold">Draft purchase information. Details awaiting confirmation.</p>
      )}
      {information && <p>{information.terms.dispatch.summary}</p>}
      <p>
        {information?.terms.delivery.summary ??
          'Greece-only BOX NOW locker delivery. We arrange your locker with you before dispatch. A street address collected at payment does not mean home delivery.'}
      </p>
      <div className="flex flex-wrap gap-x-5">
        <a className={linkClass} href={`${termsHref}#delivery`}>
          Delivery information
        </a>
        <a className={linkClass} href={`${termsHref}#returns`}>
          Returns and refunds
        </a>
        <a className={linkClass} href={`${termsHref}#support`}>
          Purchase help
        </a>
        <PrivacyLink information={information} />
      </div>
    </div>
  );
}
