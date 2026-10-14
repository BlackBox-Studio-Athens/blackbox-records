import { getPurchaseInformation, isPurchaseInformationDraft } from '@/platform/lib/purchase-information';
import type { ApprovedPurchaseInformation } from '@blackbox/content-model';
import LegalGuaranteeNotice from './LegalGuaranteeNotice';
import Prose from './Prose';

// Newsletter consent copy, shared by every form that offers the newsletter so recorded consent matches one text.
export const NEWSLETTER_CONSENT_LABEL =
  'I agree to receive BlackBox Records release, distro, and event updates. I can unsubscribe anytime.';

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
  presentation,
}: {
  information?: ApprovedPurchaseInformation | null;
  presentation?: 'checkout';
}) {
  const termsHref = `${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/terms/`;
  const deliverySummary =
    information?.terms.delivery.summary ??
    'Greece-only BOX NOW locker delivery. We arrange your locker with you before dispatch. A street address collected at payment does not mean home delivery.';
  if (presentation === 'checkout') {
    return (
      <div className="checkout-review__information" data-purchase-information>
        {import.meta.env.DEV && information && isPurchaseInformationDraft && (
          <p className="font-semibold">Draft purchase information. Details awaiting confirmation.</p>
        )}
        <Prose value={deliverySummary} />
        <div className="checkout-review__support">
          <a href={`${termsHref}#delivery`}>Delivery information</a>
          <a href={`${termsHref}#returns`}>Returns and refunds</a>
          <a href={`${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/withdrawal/`}>Withdraw from an order</a>
          <a href={`${termsHref}#support`}>Purchase help</a>
        </div>
        <LegalGuaranteeNotice />
      </div>
    );
  }
  return (
    <div className="space-y-2 text-xs leading-6 text-muted-foreground" data-purchase-information>
      {import.meta.env.DEV && information && isPurchaseInformationDraft && (
        <p className="font-semibold">Draft purchase information. Details awaiting confirmation.</p>
      )}
      {information && <Prose value={information.terms.dispatch.summary} />}
      <Prose value={deliverySummary} />
      <div className="flex flex-wrap gap-x-5">
        <a className={linkClass} href={`${termsHref}#delivery`}>
          Delivery information
        </a>
        <a className={linkClass} href={`${termsHref}#returns`}>
          Returns and refunds
        </a>
        <a className={linkClass} href={`${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/withdrawal/`}>
          Withdraw from an order
        </a>
        <a className={linkClass} href={`${termsHref}#support`}>
          Purchase help
        </a>
        <PrivacyLink information={information} />
      </div>
    </div>
  );
}
