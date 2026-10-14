// GPSR Article 19 offer information, rendered only from the verified public projection (never private evidence).
// Owner decision, 14 October 2026: shown as a closed native disclosure on the item page and each checkout line.
type Contact = { name: string; postal_address: string; electronic_address: string };

export type ProductSafetyInformation = {
  product_type: string;
  product_identifier: string;
  manufacturer: Contact;
  responsible_person?: Contact | undefined;
  safety_information: { status: 'provided' | 'not_required'; text_el?: string | undefined };
};

export const PRODUCT_SAFETY_COPY = {
  summary: 'Product safety',
  product: 'Product',
  identifier: 'Identifier',
  manufacturer: 'Manufacturer',
  responsiblePerson: 'EU responsible person',
  safety: 'Safety',
  notRequired: 'No specific warnings for this product',
} as const;

function ContactValue({ contact }: { contact: Contact }) {
  const address = contact.electronic_address;
  // The schema allows an email or an HTTPS page; a contact URL may itself contain @ in its path or query.
  const href = /^https:\/\//i.test(address) ? address : `mailto:${address}`;
  return (
    <>
      {contact.name}, {contact.postal_address} ·{' '}
      <a href={href} {...(href === address ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {address}
      </a>
    </>
  );
}

export default function ProductSafetyDisclosure({
  information,
  className,
}: {
  information: ProductSafetyInformation | null | undefined;
  className?: string;
}) {
  if (!information) return null;
  const { safety_information: safety } = information;
  return (
    <details className={className ? `product-safety ${className}` : 'product-safety'} data-product-safety>
      <summary>{PRODUCT_SAFETY_COPY.summary}</summary>
      <dl className="product-safety__facts">
        <dt>{PRODUCT_SAFETY_COPY.product}</dt>
        <dd>{information.product_type}</dd>
        <dt>{PRODUCT_SAFETY_COPY.identifier}</dt>
        <dd>{information.product_identifier}</dd>
        <dt>{PRODUCT_SAFETY_COPY.manufacturer}</dt>
        <dd>
          <ContactValue contact={information.manufacturer} />
        </dd>
        {information.responsible_person && (
          <>
            <dt>{PRODUCT_SAFETY_COPY.responsiblePerson}</dt>
            <dd>
              <ContactValue contact={information.responsible_person} />
            </dd>
          </>
        )}
        <dt>{PRODUCT_SAFETY_COPY.safety}</dt>
        {safety.status === 'provided' && safety.text_el ? (
          <dd lang="el">{safety.text_el}</dd>
        ) : (
          <dd>{PRODUCT_SAFETY_COPY.notRequired}</dd>
        )}
      </dl>
    </details>
  );
}
