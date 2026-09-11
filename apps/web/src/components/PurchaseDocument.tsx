import { isPurchaseInformationDraft, purchasePrivacyHeadings, purchaseTermsHeadings } from '@/lib/purchase-information';
import type { ApprovedPurchaseInformation } from '@/lib/purchase-information-schema';

export default function PurchaseDocument({
  kind,
  information,
}: {
  kind: 'terms' | 'privacy';
  information: ApprovedPurchaseInformation;
}) {
  const headings: Record<string, string> = kind === 'terms' ? purchaseTermsHeadings : purchasePrivacyHeadings;
  return (
    <div className="max-w-[70ch] space-y-8 break-words text-sm leading-7">
      {isPurchaseInformationDraft && (
        <p className="font-semibold">
          Draft purchase information. Details awaiting confirmation. This draft is not published in production builds.
        </p>
      )}
      <p>
        Updated <time dateTime={information.revision}>{information.revision}</time>
      </p>
      <nav aria-label={kind === 'terms' ? 'Purchase information sections' : 'Privacy information sections'}>
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {Object.entries(headings).map(([id, title]) => (
            <li key={id}>
              <a
                className="inline-flex min-h-11 items-center underline underline-offset-4"
                href={`#${id.replaceAll('_', '-')}`}
              >
                {title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {kind === 'terms' && (
        <section id="support" className="scroll-mt-28 space-y-3">
          <h2 className="font-display text-3xl">Seller and purchase help</h2>
          <p>{information.seller.name}</p>
          <p className="whitespace-pre-line">{information.seller.address}</p>
          {isPurchaseInformationDraft ? (
            <p>Support contact to be confirmed.</p>
          ) : (
            <p>
              <a className="underline" href={`mailto:${information.seller.support_email}`}>
                {information.seller.support_email}
              </a>
            </p>
          )}
        </section>
      )}
      {Object.entries(information[kind]).map(([id, section]) => (
        <section id={id.replaceAll('_', '-')} key={id} className="scroll-mt-28 space-y-3">
          <h2 className="font-display text-3xl">{headings[id]}</h2>
          {section.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </section>
      ))}
      <p>
        <a
          className="inline-flex min-h-11 items-center underline underline-offset-4"
          href={`${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/${kind === 'terms' ? 'privacy' : 'terms'}/`}
        >
          {kind === 'terms' ? 'Privacy information' : 'Purchase and delivery information'}
        </a>
      </p>
    </div>
  );
}
